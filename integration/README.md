# GeeckosCollector — intégration holo

Cette intégration contient uniquement les éléments nécessaires pour utiliser les effets holographiques et l’épaisseur 3D des cartes dans GeeckosCollector :

- `app/card-holo.css` : effets CSS dérivés de Pokémon Cards CSS ;
- `components/holo-surface.tsx` : surface holo dont la lumière suit l’orientation de la carte ;
- `components/card-thickness.tsx` et `app/card-thickness.css` : tranche blanche de la carte 3D ;
- `lib/card-appearance.ts` et `lib/card-layouts.ts` : finitions, effets et fenêtres d’illustration.

Le dépôt ne contient aucune page du site, aucun compte, aucune API, aucune base de données, aucun panneau d’administration et aucune donnée de GeeckosCollector. Les réglages d’administration restent dans le projet hôte et consomment cette intégration.

## Utilisation dans GeeckosCollector

Copier ces fichiers dans une application React/Next.js, adapter l’alias `@/` vers la racine de l’application, puis fournir à `HoloSurface` une apparence résolue et une rotation `{ x, y }` en degrés. La lumière est calculée depuis cette rotation et ne suit pas le pointeur.

Les profils `normal`, `reverse` et `fullart` peuvent utiliser des fenêtres d’illustration différentes. Les effets disponibles sont `classic`, `illusion`, `glitter`, `rainbow` et `galaxy`.

## Crédits et licence

Les effets CSS originaux proviennent de [Pokémon Cards CSS](https://github.com/simeydotme/pokemon-cards-css), par Simon Goellner, sous GPL-3.0. Cette adaptation et ses fichiers d’intégration sont distribués sous GPL-3.0 ; conserver la licence et les crédits lors de toute redistribution.

Version de l’intégration : 0.0.44.
