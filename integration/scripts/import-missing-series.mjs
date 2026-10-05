#!/usr/bin/env node

/**
 * Importe les séries manquantes à partir des scans publics Pokécardex
 * et des fiches françaises TCGdex. Aucun paquet npm n'est nécessaire.
 *
 * Le mode par défaut est une prévisualisation. --write crée seulement de
 * nouveaux dossiers et refuse d'écraser un dossier de série existant.
 */

import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT, "Web", "Data");
const POKEDEX_BASE = "https://www.pokecardex.com/series";
const POKEDEX_SCANS_BASE = "https://pokecardex-scans.b-cdn.net/sets";
const TCGDEX_BASE = "https://api.tcgdex.net/v2/fr";
const USER_AGENT = "GeeckosCollector-catalogue-import/1.0 (public card catalogue import)";
const CONCURRENCY = 4;

// Le code de Pokécardex et le code de rangement sont dissociés lorsque le
// catalogue contient déjà une sous-série portant le même code (LOR/SIT).
const TARGETS = [
  ["30C", "30th"],
  ["EPO", "bw2"], ["NVI", "bw3"], ["NXD", "bw4"], ["DEX", "bw5"],
  ["DRX", "bw6"], ["BCR", "bw7"], ["PLS", "bw8"], ["PLF", "bw9"],
  ["PLB", "bw10"], ["LTR", "bw11"],
  ["RR", "pl2"], ["SV", "pl3"], ["AR", "pl4"], ["SM05", "sm5"],
  ["PGO", "swsh10.5"], ["LOR", "swsh11", "LOR-MAIN"],
  ["SIT", "swsh12", "SIT-MAIN"], ["DPK", "det1"],
  ["MEE", null], ["MEP", "mep"], ["SVE", "sve"], ["SVP", "svp"],
  ["PRSWSH", "swshp"], ["PRSM", "smp"], ["PRXY", "xyp"],
  ["PRBW", "bwp"], ["PRHS", "hgssp"], ["PRDP", "dpp"],
  ["PRNI", "np"], ["PRWC", "basep"],
].map(([pokecardexCode, tcgdexId, storageCode = pokecardexCode]) => ({
  pokecardexCode,
  tcgdexId,
  storageCode,
}));

function usage() {
  console.log(`Usage:
  node scripts/import-missing-series.mjs --list
  node scripts/import-missing-series.mjs --code 30C [--code EPO ...] [--write]
  node scripts/import-missing-series.mjs --all --write --sync-app [--allow-partial]

Sans --write, le script affiche une prévisualisation sans créer de fichiers.
--sync-app met aussi à jour le manifeste compact et insère les sets inactifs
dans PostgreSQL; cette option nécessite --write et DATABASE_URL.
--allow-partial autorise explicitement l'import quand les listes Pokécardex et
TCGdex ne correspondent pas carte par carte. Les dossiers déjà présents sont
toujours ignorés et ne sont jamais écrasés.`);
}

function parseArgs(args) {
  const options = { codes: [], all: false, write: false, syncApp: false, allowPartial: false, list: false };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--list") options.list = true;
    else if (arg === "--all") options.all = true;
    else if (arg === "--write") options.write = true;
    else if (arg === "--sync-app") options.syncApp = true;
    else if (arg === "--allow-partial") options.allowPartial = true;
    else if (arg === "--code") {
      const code = args[++i];
      if (!code) throw new Error("--code attend un code Pokécardex.");
      options.codes.push(code.toUpperCase());
    } else {
      throw new Error(`Option inconnue : ${arg}`);
    }
  }
  return options;
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function normalizeLocalId(value) {
  const id = String(value ?? "").trim().toUpperCase();
  return /^\d+$/.test(id) ? String(Number(id)) : id;
}

async function readPokecardexScans(code, tcgdexCards) {
  const results = await mapConcurrent(tcgdexCards, CONCURRENCY, async (card) => {
    const localId = String(card.localId ?? "").trim();
    if (!localId) return null;
    const scanUrl = `${POKEDEX_SCANS_BASE}/${encodeURIComponent(code)}/FR/${encodeURIComponent(localId)}.jpg?class=hd`;
    const response = await fetchResponse(scanUrl, { attempts: 2, method: "HEAD", missingIsNull: true });
    if (!response) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;
    const printed = localId.match(/^(\d+)$/);
    return {
      id: normalizeLocalId(localId),
      card,
      source: {
        localId,
        printedNumber: printed ? Number(printed[1]) : null,
        printedTotal: null,
        nameFromPokecardex: null,
        scanUrl,
      },
    };
  });
  const matched = results.filter(Boolean);
  return {
    matched: matched.map(({ card }) => card),
    source: new Map(matched.map(({ id, source }) => [id, source])),
    missing: results.filter((item) => !item).length,
  };
}

async function fetchResponse(url, { attempts = 4, method = "GET", missingIsNull = false } = {}) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "user-agent": USER_AGENT,
          accept: "text/html,application/json;q=0.9,*/*;q=0.8",
          "accept-language": "fr-FR,fr;q=0.9",
        },
        signal: AbortSignal.timeout(25_000),
      });
      if (response.ok) return response;
      if (missingIsNull && (response.status === 403 || response.status === 404)) return null;
      if (response.status === 403 || response.status === 404) {
        throw new Error(`Réponse HTTP ${response.status} pour ${url}`);
      }
      const retryAfter = Number(response.headers.get("retry-after")) * 1000;
      throw Object.assign(new Error(`Réponse HTTP ${response.status} pour ${url}`), {
        retryAfter: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 700 * (attempt + 1),
      });
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1 || /HTTP 403|HTTP 404/.test(error.message)) break;
      await new Promise((resolve) => setTimeout(resolve, error.retryAfter ?? 700 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function fetchJson(url) {
  const response = await fetchResponse(url);
  return response.json();
}

async function findTcgdexSet(target, title, allSets) {
  const setId = target.tcgdexId ?? (() => {
    const matches = allSets.filter((set) => normalize(set.name) === normalize(title));
    if (matches.length !== 1) {
      const ids = matches.map((set) => set.id).join(", ") || "aucun";
      throw new Error(`Impossible d'associer « ${title} » à un set TCGdex unique (${ids}). Ajoute son ID à TARGETS après vérification.`);
    }
    return matches[0].id;
  })();
  return fetchJson(`${TCGDEX_BASE}/sets/${encodeURIComponent(setId)}`);
}

async function mapConcurrent(items, limit, mapper) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await mapper(items[index], index);
    }
  }));
  return results;
}

function buildFiles(target, tcgdexSet, source, matched, detailCards) {
  const cardCodes = [];
  const cards = {};

  matched.forEach((brief, index) => {
    const cardCode = `${target.storageCode}-${String(index + 1).padStart(3, "0")}`;
    const sourceCard = source.get(normalizeLocalId(brief.localId));
    cardCodes.push(cardCode);
    cards[cardCode] = {
      ...detailCards[index],
      _local: {
        code: cardCode,
        pokepedia_set_code: target.storageCode,
        pokecardex_code: target.pokecardexCode,
        pokecardex_number: sourceCard?.printedNumber ?? (Number(brief.localId) || null),
        pokecardex_scan_url: sourceCard.scanUrl,
        tcgdex_set_id: tcgdexSet.id,
        image_file: null,
        image_source_high_png: detailCards[index].image ? `${detailCards[index].image}/high.png` : null,
        image_sha256: null,
        image_size_bytes: null,
      },
    };
  });

  const set = {
    code: target.storageCode,
    pokepedia_name: tcgdexSet.name,
    pokecardex_code: target.pokecardexCode,
    tcgdex_id: tcgdexSet.id,
    tcgdex_name: tcgdexSet.name,
    tcg_online_code: target.pokecardexCode,
    release_date: tcgdexSet.releaseDate ?? null,
    serie: tcgdexSet.serie ?? { id: "", name: "" },
    card_count: tcgdexSet.cardCount ?? { official: matched.length, total: matched.length },
    symbol: tcgdexSet.symbol ?? null,
    logo: tcgdexSet.logo ?? null,
    booster_count: 0,
    boosters: [],
    cards: cardCodes,
  };

  const boosters = {
    code: target.storageCode,
    name: tcgdexSet.name,
    source_page: `${POKEDEX_BASE}/${encodeURIComponent(target.pokecardexCode)}`,
    booster_count: 0,
    boosters: [],
  };

  return { set, cards, boosters };
}

async function syncApplication(set, cards) {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL est nécessaire avec --sync-app.");
  const manifestPath = path.join(ROOT, "lib", "catalogue-data.json");
  const originalManifest = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(originalManifest);
  const alreadyListed = manifest.sets.some((item) => item.code === set.code);
  if (!alreadyListed) {
    manifest.sets.push({
      code: set.code,
      name: set.tcgdex_name,
      series: set.serie?.name ?? "",
      releaseDate: set.release_date ?? "",
      officialCount: set.card_count?.official ?? set.cards.length,
      totalCount: set.card_count?.total ?? set.cards.length,
      cards: set.cards.map((code) => {
        const card = cards[code];
        return {
          id: code,
          name: card.name,
          localId: String(card.localId),
          rarity: card.rarity ?? "Sans rareté",
        };
      }),
    });
    manifest.sets.sort((a, b) => a.code.localeCompare(b.code, "fr"));
  }

  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let client;
  let manifestWritten = false;
  const tempManifest = `${manifestPath}.${process.pid}.tmp`;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO game_sets (code, name, series_name, release_date, official_card_count, total_card_count, active)
       VALUES ($1, $2, $3, $4, $5, $6, false)
       ON CONFLICT (code) DO NOTHING`,
      [
        set.code,
        set.tcgdex_name,
        set.serie?.name ?? "",
        set.release_date ?? null,
        set.card_count?.official ?? set.cards.length,
        set.card_count?.total ?? set.cards.length,
      ],
    );
    await writeFile(tempManifest, `${JSON.stringify(manifest)}\n`, "utf8");
    await rename(tempManifest, manifestPath);
    manifestWritten = true;
    await client.query("COMMIT");
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    if (manifestWritten) await writeFile(manifestPath, originalManifest, "utf8");
    await rm(tempManifest, { force: true });
    throw error;
  } finally {
    client?.release();
    await pool.end();
  }
}

async function importTarget(target, allSets, options) {
  const destination = path.join(DATA_DIR, target.storageCode);
  try {
    const existingSet = JSON.parse(await readFile(path.join(destination, "set.json"), "utf8"));
    if (options.syncApp && options.write) {
      const existingCards = JSON.parse(await readFile(path.join(destination, "cards.json"), "utf8"));
      await syncApplication(existingSet, existingCards);
      console.log(`SYNC ${target.pokecardexCode}: données existantes gardées; manifeste et base synchronisés.`);
    } else {
      console.log(`SKIP ${target.pokecardexCode}: ${target.storageCode} existe déjà; aucun fichier ne sera écrasé.`);
    }
    return;
  } catch {
    // Dossier absent : continuer. Un dossier partiel est aussi protégé ci-dessous.
  }

  const tcgdexSet = await findTcgdexSet(target, "", allSets);
  if (!Array.isArray(tcgdexSet.cards) || tcgdexSet.cards.length === 0) {
    throw new Error(`TCGdex n'a pas fourni de liste de cartes pour ${tcgdexSet.id}.`);
  }
  const { matched, source, missing } = await readPokecardexScans(target.pokecardexCode, tcgdexSet.cards);
  if (missing && !options.allowPartial) {
    throw new Error(`Pokécardex expose ${matched.length}/${tcgdexSet.cards.length} scans pour ${target.pokecardexCode}; ${missing} URL(s) image absente(s). Vérifie le code et les IDs ou relance avec --allow-partial.`);
  }
  if (!matched.length) throw new Error(`Aucun scan Pokécardex vérifié pour ${target.pokecardexCode}.`);

  console.log(`${target.pokecardexCode} → ${target.storageCode} | ${tcgdexSet.name} | TCGdex ${tcgdexSet.id} | ${matched.length}/${tcgdexSet.cards.length} scans Pokécardex vérifiés`);
  if (missing) {
    console.warn(`  ${missing} carte(s) TCGdex ignorée(s), car leur scan Pokécardex n'a pas été trouvé.`);
  }
  if (!options.write) return;

  const detailCards = await mapConcurrent(matched, CONCURRENCY, async (card) =>
    fetchJson(`${TCGDEX_BASE}/cards/${encodeURIComponent(card.id)}`));
  const files = buildFiles(target, tcgdexSet, source, matched, detailCards);

  // Publication atomique du nouveau dossier : aucun contenu préexistant n'est remplacé.
  const tempDir = path.join(DATA_DIR, `.import-${target.storageCode}-${process.pid}-${Date.now()}`);
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await mkdir(tempDir, { recursive: false });
    await writeFile(path.join(tempDir, "set.json"), `${JSON.stringify(files.set, null, 2)}\n`, "utf8");
    await writeFile(path.join(tempDir, "cards.json"), `${JSON.stringify(files.cards, null, 2)}\n`, "utf8");
    await writeFile(path.join(tempDir, "boosters.json"), `${JSON.stringify(files.boosters, null, 2)}\n`, "utf8");
    await rename(tempDir, destination);
    console.log(`  Écrit dans Web/Data/${target.storageCode}/`);
    if (options.syncApp) {
      await syncApplication(files.set, files.cards);
      console.log("  Manifeste et entrée de base ajoutés (set inactif).");
    }
  } catch (error) {
    await rm(tempDir, { recursive: true, force: true });
    if (error.code === "EEXIST" || error.code === "ENOTEMPTY") {
      throw new Error(`Web/Data/${target.storageCode} existe déjà; import annulé sans écrasement.`);
    }
    throw error;
  }
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    usage();
    process.exitCode = 2;
    return;
  }

  if (options.help) return usage();
  if (options.syncApp && !options.write) {
    console.error("--sync-app nécessite aussi --write.");
    process.exitCode = 2;
    return;
  }
  if (options.list) {
    for (const target of TARGETS) {
      console.log(`${target.pokecardexCode}\t${target.tcgdexId ?? "auto"}\t${target.storageCode}`);
    }
    return;
  }

  if (!options.all && options.codes.length === 0) {
    console.error("Choisis au moins un --code ou passe --all. Le script ne lance pas de collecte implicite.");
    usage();
    process.exitCode = 2;
    return;
  }
  const requested = options.all ? TARGETS : options.codes.map((code) => {
    const target = TARGETS.find((item) => item.pokecardexCode === code);
    if (!target) throw new Error(`Code non configuré : ${code}. Lance --list pour afficher les codes pris en charge.`);
    return target;
  });

  if (!options.write) console.log("Prévisualisation uniquement; ajoute --write pour créer les fichiers.");
  const allSets = await fetchJson(`${TCGDEX_BASE}/sets`);
  let failures = 0;
  for (const target of requested) {
    try {
      await importTarget(target, allSets, options);
    } catch (error) {
      failures += 1;
      console.error(`ERREUR ${target.pokecardexCode}: ${error.message}`);
    }
    // Respecte les services publics en espaçant les pages et les lots de séries.
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  if (failures) {
    console.error(`${failures} série(s) n'ont pas été traitées.`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
