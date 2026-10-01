# Intégration GeeckosCollector — 0.0.1

Cette adaptation utilise Pokémon Cards CSS de Simon Goellner (@simeydotme), GPL-3.0.
Sources amont : https://github.com/simeydotme/pokemon-cards-css
Base conservée : acb1197633e749a1fba4412231db2f6581586d00

## Changements du 1 octobre 2026

- Styles classique, illusion (V Full Art), glitter (Secret Rare), rainbow et cosmos.
- Finitions indépendantes de l’effet : normale sur la zone illustrée, reverse sur le cadre, full art sur toute la face.
- Isolation des sélecteurs sous .gc-holo et textures servies localement depuis /vendor/pokemon-holo/img/.
- Composant React HoloSurface et fiche de carte avec rotation manuelle et clavier.
- Respect des mouvements réduits/désactivés ; aucune animation automatique.
- Profils persistants par set et exceptions par carte ; validation serveur et journal des modifications.
- Les variantes réellement disponibles dans le catalogue restent distinctes des aperçus esthétiques.

## Fichiers

Les fichiers dans integration/geeckoscollector correspondent à l’intégration utilisée par le jeu.
Le moteur et son adaptation sont distribués sous GPL-3.0, sans garantie ; conserver la licence et les crédits lors de leur redistribution.
Les fichiers CSS et textures originaux restent dans public/ du dépôt amont, avec leurs crédits.

## Préparer les assets pour une application Next.js / React

1. Servir les textures utilisées dans public/img sous public/vendor/pokemon-holo/img.
2. Importer app/card-holo.css après les styles de base du site.
3. Utiliser HoloSurface dans un conteneur de carte positionné, avec une image recto et un dos séparé.
4. Fournir les variables de pointeur et un ResolvedAppearance validé : effect, intensity, artworkWindow et finish.
5. La rotation, la fiche native et les styles de mise en page du site hôte restent nécessaires. Le moteur holo ne recrée pas à lui seul toute l’application.
6. Pour les réglages persistants, adapter les imports du site hôte (base Drizzle, auth, manifeste du catalogue) et appliquer la migration SQL. Le contrôle admin est effectué côté serveur, via une liste d’identifiants internes configurée hors dépôt.
7. Garder les sources correspondantes, le texte GPL et les crédits accessibles aux utilisateurs lors de la distribution.

## Vérifications

Compilation Webpack/TypeScript à effectuer dans le projet hôte sur le VPS.
Aucune dépendance du jeu ni donnée privée ne doit être commise dans ce fork.
