import Link from "next/link";
import { PlayerChrome } from "@/components/player-ui";
export default function About(){
 return <><PlayerChrome/><main className="catalogue-main"><span className="section-kicker">GeeckosCollector</span><h1>À propos</h1><section id="open-source"><h2>Open source</h2><h3>Pokémon Cards CSS</h3><p>Effets holographiques créés par Simon Goellner (@simeydotme), copyright 2022. Intégration sous licence GNU GPL-3.0, sans garantie.</p><p>Révision utilisée : acb1197633e749a1fba4412231db2f6581586d00. Adaptation au jeu le 1 octobre 2026 : intégration React, sélecteurs isolés, textures locales, cadres de référence par génération, masques de finition et reflets liés à la rotation.</p><ul>
 <li><a href="https://github.com/simeydotme/pokemon-cards-css">Dépôt original et auteur</a></li><li><a href="https://github.com/MasterBougli/Holo-Pkmn-Card/tree/codex/geeckoscollector-integration/integration">Notre fork et les sources de l’intégration · 0.0.18</a></li>
 <li><a href="/vendor/pokemon-holo/LICENSE.txt">Texte de la licence GPL-3.0</a></li>
 <li><a href="/vendor/pokemon-holo/NOTICE.md">Crédits et modifications</a></li>
 <li><a href="/vendor/pokemon-holo/sources.zip" download>Sources originales, textures et intégration utilisée</a></li>
 </ul><p>Le dépôt original crédite également aschefield101 pour Galaxy Holo et Vecteezy pour certains arrière-plans.</p></section><p><Link href="/sets">Retour au catalogue</Link></p></main></>;
}
