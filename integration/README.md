# Intégration GeeckosCollector — 0.0.15

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


## Fiches de catalogue et activation — 0.0.10

Éditeur /admin/catalogue/carte : nom, numéro, rareté, illustrateur et finitions, avec ajout d’image seulement si elle manque. Chaque carte doit disposer des six informations avant l’activation de son set ; une exclusion individuelle ne contourne pas ce contrôle. Une modification qui rend un set actif incomplet le désactive avec journal. Aucun set n’est activé automatiquement.

Migration 0006, corrections stockées dans catalogue_cards et fusionnées à la lecture avec le catalogue du site hôte. Adapter lib/db et fournir lib/catalogue-data.json ainsi que les fiches Web/CardDetails du site hôte : ces données de cartes ne sont pas distribuées dans ce fork. Exposer le dossier Cards via GAME_ASSETS_ROOT. L’ajout d’images utilise sharp, déjà fourni par Next.js dans le site hôte, avec taille limitée, validation et création exclusive sans écraser un scan existant. Les pages/API publiques du site hôte doivent appeler ces lecteurs asynchrones.

Le contrôle d’éligibilité exclut aussi les sets incomplets. La recherche hebdomadaire et la validation manuelle des propositions d’import sont des fonctions prévues, pas encore fournies. Importer app/admin/admin.css pour le module éditorial. Les dépendances privées restent des adaptateurs : aucun secret, compte ou image de carte inclus.


## Recherche et import du catalogue — 0.0.11

Module /admin/imports, rapports persistants, propositions de correspondance et validation explicite par set. Migration 0007 à appliquer. Le service scripts/catalogue-worker.ts lit les pages publiques rendues de Pokécardex et les fiches françaises TCGdex ; aucune source privée incluse. Les checklists partielles empêchent la validation du set concerné. Une correspondance absente permet un import de scans avec fiches à compléter, jamais une activation automatique.

Adaptateurs du site hôte : lib/db doit enregistrer importJobs, discoveryItems, importSchedule et importMappings ; fournir les dépendances pg, Drizzle et tsx, le catalogue existant et les contrôles d’authentification. La classe AdminError et le verrou d’autorisation sont désormais dans admin-authorisation, utilisable sans contexte HTTP. Les images originales sont conservées ; les ajouts sont normalisés par sharp, enregistrés sans écrasement et journalisés.

Le service séparé utilise le Dockerfile fourni (Playwright 1.63.0, sharp 0.35.5), un utilisateur sans privilège et le profil seccomp de Playwright pour le sandbox Chromium. Monter le projet en lecture seule et seulement Cards en écriture ; exposer uniquement DATABASE_URL, ADMIN_USER_IDS, GAME_ASSETS_ROOT et NODE_ENV au service. Limiter mémoire/CPU et ne publier aucun port. Insérer le planning dans catalogue_import_schedule (id 1, jour 0-6, heure de Paris, next_run). Le service reprend les tâches interrompues, conserve les cartes déjà présentes et ne valide jamais un import de lui-même.


### Ressources sur VPS partagé

La configuration hôte fournie limite les workers de compilation à un et active webpackMemoryOptimizations. Compiler dans un conteneur dédié plafonné à 2304 Mo de RAM, 3584 Mo RAM+swap, CPU 1, avec NODE_OPTIONS=--max-old-space-size=640 ; arrêter le scanner pendant la compilation et le relancer après livraison. Le worker a une limite de 768 Mo sans swap supplémentaire et ferme la page source après chaque série. Ne pas lancer un build dans le conteneur web sans limites.

Le cache Webpack est désactivé pour limiter la mémoire de compilation sur cet hôte. Le build utilise un worker isolé et un seul worker de génération de pages.


## Lecture des numéros spéciaux — 0.0.12

Le lecteur accepte les numéros avec ou sans dénominateur (SWSH001, AR1, H1), et les cartes sans numéro. Les listes sont dédupliquées par URL de scan. Les numéros imprimés uniques deviennent les numéros de catalogue ; lorsqu’ils se répètent ou manquent, les positions de scan servent d’identifiants. 30C conserve toujours ses positions pour distinguer ses rééditions. Le numéro imprimé reste disponible séparément dans le rapport. Le contrôle du nombre total de cartes reste obligatoire pour valider un import. Aucun scan existant n’est remplacé et aucun set n’est activé par cette correction.

Les recherches interrompues conservent les listes complètes lues par cette version du lecteur. Elles relisent les listes incomplètes ou issues d’un ancien lecteur. Les propositions restent soumises à validation manuelle.


## Scans PRZP — 0.0.13

Reconnaissance des scans français avec un sous-dossier de variante (exemple PRZP/FR/149/1.jpg), partagée avec la validation du téléchargement. Domaine source inchangé, un sous-dossier maximum, segments alphanumériques sans chemin relatif ni encodage de séparateur. Les positions finales sont utilisées si elles sont uniques ; sinon la référence complète distingue les variantes. Une collision de numéros bloque la validation de la liste. Le lecteur passe en révision 3 pour relire les résultats issus de l’ancienne règle. Aucun import ou activation automatique.

Une liste complète lue en révision 2 reste réutilisable pendant la reprise du même rapport : la correction ne change pas les références sans sous-dossier. Les listes partielles sont relues par la révision 3. La date d’origine du rapport reste inchangée, donc sa durée de validité ne se prolonge pas.


## Tarifs de revente — 0.0.15

Migration 0008 pour les tarifs indépendants en pièces et gemmes par rareté/finition, avec exceptions par carte. Champ vide : À définir pour un tarif général, héritage par monnaie pour une exception ; zéro est conservé. Permissions economy.read/economy.edit, origine contrôlée, droits relus sous verrou commun, révisions anti-conflit et journal avant/après. Les règles effacées conservent leur révision pour éviter une réapparition silencieuse d'anciens brouillons.

Fiche publique : choix parmi les versions réellement disponibles ; tarifs fournis séparément des aperçus holo. Les défauts ne changent pas ces valeurs. Aucun moteur de vente, solde ou achat réel ajouté ; aucun montant injecté automatiquement.

La livraison 0.0.15 limite aussi Webpack à un module simultané et RAYON_NUM_THREADS=1, avec NEXT_TELEMETRY_DISABLED=1. Réserver un coeur au build et arrêter uniquement le scanner pendant la compilation. Surveiller les réserves de RAM et de swap du VPS ; aucun déploiement en cas de compilation incomplète.


Version 0.0.15 : réglage carte par carte ouvert par défaut, tarifs par finition et monnaie, accès direct depuis la fiche de carte.
