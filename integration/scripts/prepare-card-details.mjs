import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const source = path.resolve("Web/Data");
const target = path.resolve("Web/CardDetails");
await mkdir(target, { recursive: true });
let count = 0;
for (const entry of await readdir(source, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = path.join(source, entry.name, "cards.json");
  let raw;
  try { raw = await readFile(file, "utf8"); } catch (error) {
    if (error.code === "ENOENT") continue;
    throw error;
  }
  const cards = JSON.parse(raw);
  for (const card of Object.values(cards)) delete card._local;
  await writeFile(path.join(target, entry.name + ".json"), JSON.stringify(cards));
  count++;
}
console.info(count + " fiches de sets préparées.");