# Intégration GeeckosCollector — 0.0.9

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
4. Fournir la rotation en degrés (rotation.x et rotation.y) : la lumière est dérivée de l’orientation, sans suivi du pointeur. Fournir également et un ResolvedAppearance validé : effect, intensity, artworkWindow et finish.
5. La rotation, la fiche native et les styles de mise en page du site hôte restent nécessaires. Le moteur holo ne recrée pas à lui seul toute l’application.
6. Pour les réglages persistants, adapter les imports du site hôte (base Drizzle, auth, manifeste du catalogue) et appliquer la migration SQL. Le contrôle admin utilise des rôles et permissions cumulées, relus côté serveur. La liste privée ADMIN_USER_IDS réserve le statut de superadministrateur au compte protégé du site hôte.
7. Garder les sources correspondantes, le texte GPL et les crédits accessibles aux utilisateurs lors de la distribution.

## Vérifications

Compilation Webpack/TypeScript réalisée dans le projet hôte sur le VPS pour la première intégration. Les corrections 0.0.2 ajoutent les cadres XY/classique/moderne et une lumière liée à la rotation. Les contrôles détaillés restent ceux du projet hôte.
Aucune dépendance du jeu ni donnée privée ne doit être commise dans ce fork.

## Tranche 3D — 0.0.5

Importer app/card-thickness.css dans le projet hôte. CardThickness est utilisé uniquement dans CardViewer : recto et dos à ±1,5 px, côtés blancs et coins arrondis segmentés. L’aperçu plat dans l’administration reste sans extrusion.

## Administration et permissions — 0.0.6

Navigation partagée, rôles personnalisés, attributions multiples, délégation limitée aux droits de l’auteur et journal en lecture seule. Le module holo sépare lecture et modification. Les mutations relisent les permissions sous verrou transactionnel ; les rôles ont une révision pour prévenir l’écrasement simultané. Migration 0003 à appliquer dans le site hôte, après sauvegarde. Aucun compte ne reçoit automatiquement les nouveaux rôles.

Les imports du site hôte auth, db, auth-schema, player-ui et catalogue restent des interfaces à adapter. Aucun secret ni compte réel n’est inclus. Les droits des futurs modules sont réservés, sans outil correspondant à cette version.

## Configuration du site hôte — 0.0.9

La navigation de l’atelier propose le module Configuration, avec les permissions config.read et config.edit. Le journal commun affiche ses changements. Migration 0004 : maintenance désactivée et inscriptions autorisées au départ. Aucun accès ou compte privé dans ces sources.

Les comptes ayant un rôle actif (et le compte superadministrateur protégé du site hôte) accèdent au jeu complet pendant une maintenance ; les permissions administratives restent distinctes. Le site hôte doit appeler requireGameAccess sur ses pages privées et getGameAccess avant ses actions de jeu. Ses pages publiques et les préférences d’accessibilité restent ouvertes.

Importer app/site-availability.css. Pour les notices publiques, placer SiteAvailabilityProvider autour du chrome du site et SiteAvailabilityNotice dans ce chrome ; utiliser useSiteAvailability pour conserver les liens d’actualités sur l’accueil public lorsqu’un joueur est bloqué.

Le site hôte conserve sa configuration Better Auth. Ajouter un hook databaseHooks.user.create.before qui relit getSiteSettings, lance APIError("FORBIDDEN", {code:"REGISTRATIONS_CLOSED", message:config.registrationMessage}) lorsque registrationsEnabled est faux, puis retourne {data:user}. Ce hook intercepte la création e-mail et OAuth, sans bloquer les connexions à un compte existant. Les pages d’inscription et connexion doivent être dynamiques. Documentation du hook : https://better-auth.com/docs/concepts/database#database-hooks.

Cette livraison ajoute la configuration et son intégration à la navigation partagée de l’atelier. Les styles et moteurs holo eux-mêmes sont inchangés. Adapter les dépendances auth, db, auth-schema, player-ui et catalogue au projet hôte.


## Catalogue administratif — 2 octobre 2026

Navigation partagée complétée par /admin/catalogue : statuts des sets, exclusions individuelles des cartes, recherche et pagination, permissions, révisions et journal. Migration 0005 et sources associées incluses. Adaptateurs du site hôte toujours nécessaires pour la base, le manifeste du catalogue et la navigation joueur. Aucun moteur de boosters ni défaut d’impression par exemplaire implémenté dans cette tranche.


## Atelier de défauts — 2 octobre 2026

/admin/defauts permet les essais visuels de découpe décalée, séparation des couleurs, encre manquante, taches et lignes, cumulables, avec recto/dos rotatifs et holo existant. Composition SVG depuis les scans d’origine, voisine du même set sur planche fictive, paramètres et graine reproductibles, export/import JSON validé. Permission defects.preview, sans attribution d’exemplaire ni écriture de données de jeu. Le fichier JSON contient les défauts et la sélection de cartes ; les aperçus de finition/holo restent séparés.
