# Administration — modules disponibles et prochaines étapes

## État actuel

Les modules d’apparence des cartes, rôles et permissions, attributions aux comptes et journal sont disponibles depuis /admin. Bougli est le seul superadministrateur protégé, identifié par son identifiant interne dans ADMIN_USER_IDS sur le VPS. Les autres membres accèdent aux modules selon leurs rôles cumulés. Les routes et écritures sont protégées côté serveur ; le pseudo seul ne donne aucun droit.

Les profils holo par set et les exceptions par carte sont sauvegardés en PostgreSQL, avec historique des modifications. Voir [Holographie](HOLOGRAPHIE.md). Les anciennes maquettes supprimées volontairement n’ont pas été restaurées.

Les rôles configurables et permissions détaillées sont implémentés. La configuration générale est disponible pour la maintenance et les inscriptions (voir CONFIGURATION.md). L’activation des séries, les imports administrateur, les prix et règles de boosters, l’économie, les récompenses, le CMS des actualités, les événements et la modération restent à développer.

## Catalogue à vérifier plus tard

Les JSON du catalogue restent dans `Web/Data/`. L’audit précédent a relevé des illustrations de cartes locales manquantes ; les détails et limites de cet état historique sont dans [l’audit des images](IMAGES_MANQUANTES.md).

La vérification manuelle des images sera reprise quand une interface d’administration adaptée sera reconstruite. Aucune image ne doit être téléchargée, renommée ou déplacée automatiquement sur la base de cet ancien rapport.

### Fonction à prévoir : contrôle et import des séries

L’administration devra permettre de comparer régulièrement le catalogue local avec les séries et cartes publiées par Pokécardex et TCGdex. Elle devra signaler les séries ou cartes absentes, présenter les écarts avant import, puis permettre à un membre autorisé d’importer les données vérifiées. Les nouveaux sets devront rester inactifs par défaut. L’import ne devra jamais écraser silencieusement les données existantes ; les images et leurs sources devront être contrôlées séparément. Le script provisoire [`import-missing-series.mjs`](../scripts/import-missing-series.mjs) sert uniquement à alimenter les données pendant le développement et ne remplace pas cette fonction d’administration.

## Étapes futures

Les rôles et la navigation du panel sont disponibles. Poursuivre le cadrage de la configuration selon les besoins, puis développer les imports, le CMS des actualités et la modération. La consultation des comptes et les attributions de rôles existent ; les actions de modification/modération des comptes restent à cadrer. Poser les questions une par une.

## CMS des actualités — à prévoir

L’administration devra intégrer un CMS permettant de créer, modifier et publier les actualités affichées sur les accueils public et connecté. Cette demande est confirmée ; la fonction n’est pas encore développée.

Le cadrage devra préciser les champs d’un article (titre, contenu, illustration et éventuel lien), les brouillons, la prévisualisation, la publication immédiate ou programmée, l’archivage, ainsi que les permissions de rédaction et de publication. Prévoir la gestion des textes alternatifs des images et une présentation compatible avec les réglages d’accessibilité du joueur. Ces modalités restent à valider avec Bougli.

## Événements — conception à cadrer

Avant leur développement, il faudra définir comment les événements sont créés, administrés et utilisés dans le jeu. Leur présence dans les actualités et sur les accueils ne suffit pas à définir leur fonctionnement.

Questions à traiter une par une avec Bougli :

1. Quels types d’événements proposer, avec quels objectifs pour le joueur ?
2. Quelles règles de participation, conditions d’accès et modalités d’inscription ?
3. Quel calendrier, fuseau horaire et cycle de vie : préparation, programmation, lancement, fin, annulation et archivage ?
4. Quels effets sur le jeu : séries ou boosters disponibles, missions, progression, récompenses, éventuels classements et règles économiques ?
5. Comment suivre la participation et distribuer les récompenses sans attribution multiple, y compris après une interruption ?
6. Comment présenter les événements sur les accueils public et connecté, et les relier éventuellement à une actualité ?
7. Quelles permissions, actions de modération et traces des modifications prévoir dans l’administration ?

Ces points sont des sujets de conception, pas des mécaniques validées ni des fonctions déjà disponibles. La relation entre événement et article d’actualité reste à décider.

## Finitions, revente et défauts des exemplaires — décision du 1 octobre 2026

- Configurer séparément le prix de revente en pièces et en gemmes par rareté et finition, avec exception par carte. Valeur non définie distincte de zéro ; afficher « À définir » avant configuration.
- Corriger ou compléter les finitions importées : normale, holo, full art, reverse ; définir la zone illustrée et le profil de reflet selon le cadre. Les aperçus actuels ne prouvent pas la disponibilité d’une variante.
- Prévoir ensuite des exemplaires distincts des définitions du catalogue, avec défaut d’impression enregistré lors de l’obtention : missprint, misscut, décalage, etc.
- Une découpe montrant une partie de la carte voisine est techniquement possible par composition de plusieurs images et recadrage. Conserver les images originales ; enregistrer identifiant de la voisine, décalage, rotation, type, intensité et graine reproductible sur l’exemplaire.
- Les décisions du 2 octobre 2026 ci-dessous remplacent le cadrage des défauts et des multiplicateurs de valeur : aucun bonus automatique de revente pour les défauts. Les probabilités exactes et les voisinages de planche restent à définir. Cette mécanique n’est pas implémentée.

## Configuration holo demandée — 1 octobre 2026

Réutilisation acceptée par Bougli sous GPL-3.0. Les effets de simeydotme/pokemon-cards-css sont intégrés, avec originaux, textures, licence, crédits et sources adaptées disponibles depuis /a-propos#open-source. Les adaptations sont publiées dans le fork MasterBougli/Holo-Pkmn-Card, branche codex/geeckoscollector-integration, version 0.0.9.

### Deux réglages distincts

- Finition : normale, reverse ou full art.
- Effet : aucun, classique, illusion, glitter, rainbow, galaxy ; liste extensible selon les effets effectivement intégrés. Ces effets utilisent les variantes du dépôt tiers ; les masques de finition sont appliqués séparément.
- Intensité et zone de l’illustration configurables. Ces champs permettent des cadres différents selon les générations.
- Une finition normale peut être sans effet ou recevoir un holo sur l’illustration. Full art couvre la face ; reverse exclut la zone de l’illustration.

### Héritage et interface disponibles

1. Depuis chaque set, régler un profil pour chaque finition et prévisualiser une carte.
2. Depuis une carte, conserver « Hériter du set » ou définir une exception par finition.
3. Priorité : carte, puis set, puis défaut sans effet. Une exception « Aucun effet » doit désactiver un holo hérité. Rétablir l’héritage retire l’exception.
4. Afficher la provenance du profil (carte ou set), une prévisualisation avant enregistrement et la possibilité de revenir au réglage hérité.
5. Les profils esthétiques ne déterminent pas quelles versions d’une carte peuvent être obtenues. La disponibilité des versions doit être configurée séparément des effets.
6. Stocker les réglages dans la base du jeu, sans modifier les JSON importés. Vérifier l’identité de la carte et du set, les valeurs autorisées et les permissions de modification côté serveur. Journaliser les changements.
7. Garder les reflets sur le recto uniquement, la rotation accessible au clavier, et une présentation fixe avec mouvements réduits ou désactivés. Prévoir un rendu sans effet en cas d’absence d’asset.

Le contrat et le validateur dans lib/card-appearance.ts sont reliés à l’éditeur, à la sauvegarde et au rendu public. Le serveur contrôle l’identité, l’origine de la requête, l’appartenance de la carte au set et les valeurs autorisées. Les permissions détaillées sont définies dans lib/admin-permissions.ts ; chaque nouveau module devra contrôler ses droits côté serveur et journaliser ses changements.

## Rôles personnalisés — décisions et mise en œuvre du 1 octobre 2026

- Bougli est le seul superadministrateur, identifié par son identifiant interne dans le fichier privé .env (ADMIN_USER_IDS). Aucune promotion en superadministrateur depuis l’interface. Son accès est indépendant des rôles.
- Un compte peut recevoir plusieurs rôles ; union des permissions, sans refus explicite. Aucun accès au panel pour un joueur sans permission admin.access.
- Administrateur, Modérateur et Rédacteur sont créés par migration, éditables et non attribués automatiquement.
- Les rôles contiennent des droits par action : lecture, création, modification, suppression/archivage, publication, import et attribution. Les permissions des prochains modules sont marquées À venir : elles ne rendent pas ces outils disponibles.
- Un administrateur délégué ne peut modifier/archiver un rôle contenant des permissions qu’il ne possède pas, ni ajouter des permissions hors de ses droits, ni attribuer/retirer un rôle supérieur. Les rôles supérieurs déjà attribués restent intacts lors des autres changements.
- L’archivage est réversible et réservé aux rôles sans compte attribué. Retirer les attributions avant d’archiver. Le nom reste réservé ; restauration possible dans la liste des rôles archivés.
- Contrôles serveur à chaque requête ; relire l’autorisation dans la transaction sous verrou commun pour les modifications de rôles, attributions et profils holo. Vérification de l’origine des requêtes mutantes ; jamais de confiance dans les cases cochées côté client.
- Révision des rôles et état attendu des attributions : un changement simultané refuse l’écrasement et demande de recharger.
- Journal transactionnel, auteur/pseudo, date Europe/Paris, rôle/compte concerné, états avant/après, liste des comptes affectés par un changement de rôle. Le journal n’a aucune action de modification ou suppression.
- Les historiques holo restent dans leur table existante ; le journal de l’équipe couvre les rôles et attributions dans cette première tranche.
- Pour ouvrir un outil : admin.access et sa permission de lecture. Pour attribuer des rôles : users.read et roles.assign. Pour gérer les rôles via l’interface : roles.read et droits de création/modification/archivage souhaités.
- Routes : /admin, /admin/roles, /admin/comptes, /admin/journal et /admin/holo. Navigation filtrée selon les permissions.
- API : /api/admin/roles et /api/admin/users ; comptes paginés par 20, journal par 30, recherche par pseudo ; aucun e-mail ou secret d’authentification exposé dans les listes.
- Migration : 0003_add_admin_roles. Sauvegarder la base avant application.
- La configuration générale et la disponibilité du catalogue sont désormais disponibles. La modération, les imports, l’économie, les actualités et événements restent à développer et à cadrer.

## Disponibilité du jeu — 1 octobre 2026

Le module /admin/configuration permet de gérer la maintenance, l’ouverture des inscriptions et leurs messages. Tous les rôles d’équipe actifs accèdent au jeu complet en maintenance, avec leurs permissions habituelles pour le panel. Les sauvegardes sont journalisées. Voir CONFIGURATION.md pour les règles confirmées et les limites de la validation.


## Défauts propres aux exemplaires — décisions du 2 octobre 2026

- Séparer la définition du catalogue et chaque exemplaire possédé : identifiant unique, propriétaire, finition et métadonnées de défauts propres à cet exemplaire.
- Tirer les défauts à l’ouverture du booster côté serveur, puis enregistrer définitivement leurs paramètres. La consultation ne doit jamais refaire le tirage ni changer l’apparence.
- Un défaut est extrêmement rare ; plusieurs défauts peuvent se cumuler, avec une probabilité encore bien plus faible. Aucun taux numérique ni plafond de cumul validé à ce stade.
- Pour une découpe montrant une partie d’une carte voisine, choisir cette voisine dans le même set. La carte voisine sert au rendu et n’est pas un second exemplaire attribué au joueur. Les règles précises de voisinage restent à définir.
- Conserver les images originales et composer le rendu depuis les métadonnées persistantes : type, paramètres de découpe/impression, référence de la voisine et graine si nécessaire. Les champs et leur validation seront arrêtés lors de l’implémentation.
- Afficher le nom des défauts dans les informations de l’exemplaire. Aucune animation spéciale lors de sa révélation ; le défaut reste visible sur la carte révélée normalement.
- Aucun changement du prix de revente de base en pièces ou gemmes à cause d’un défaut. Une valeur supérieure peut être demandée librement par les collectionneurs dans leurs échanges ; aucune cote automatique prévue.
- Prévoir dans l’administration une prévisualisation et la création manuelle d’exemplaires spéciaux, avec permission dédiée et journalisation. Cet outil et cette permission ne sont pas encore implémentés.
- Catalogue : Bougli confirme une exclusion individuelle par carte dans un set actif, tout en conservant sa visibilité publique. Le statut du set et l’autorisation de la carte devront tous deux permettre l’obtention. Aucun statut existant modifié pour ce cadrage.

Ces décisions cadrent des fonctionnalités futures : aucune table d’exemplaires, mécanique d’ouverture, attribution de défauts ou création manuelle n’a été livrée à ce stade.


## Disponibilité du catalogue — 2 octobre 2026

Module /admin/catalogue : activation des sets et exclusions individuelles des cartes, recherche, pagination, permissions catalogue.read / catalogue.activate / catalogue.edit et journal avant/après. La migration 0005 ajoute les exceptions et révisions. Les imports et la création/suppression restent à venir. Voir CATALOGUE_ADMIN.md pour le fonctionnement et les limites ; aucun moteur de boosters n’est encore disponible.


## Atelier de défauts — 2 octobre 2026

/admin/defauts permet les essais sur un exemplaire de démonstration : défauts cumulables, voisine du même set, rendu recto/dos rotatif, comparaison avec le scan et export/import de scénarios. Permission dédiée defects.preview ; aucune création ou attribution de carte possédée. Le laboratoire n’enregistre pas de mutation de données de jeu et n’ajoute donc pas d’action au journal. Les futures créations manuelles devront être autorisées et journalisées. Voir DEFAUTS_EXEMPLAIRES.md.


## Fiches complètes avant activation — 2 octobre 2026

Chaque carte du set doit posséder : nom, numéro, rareté, illustrateur, image présente et au moins une finition disponible. Une valeur vide ou « Non renseigné » n’est pas considérée complète. Toutes les cartes comptent, y compris les cartes exclues individuellement. Le bouton d’activation et son API bloquent les sets incomplets ; le helper d’éligibilité du futur moteur applique aussi cette règle.

Depuis /admin/catalogue, ouvrir les cartes du set puis « Compléter la fiche ». Les quatre textes et les finitions peuvent être corrigés avec catalogue.edit. Les brouillons incomplets sont autorisés et restent consultables. Une modification qui rend un set actif incomplet le désactive dans la même transaction, avec auteur et motif au journal. Compléter le dernier champ n’active pas le set automatiquement : catalogue.activate reste nécessaire pour l’action explicite.

L’image peut être ajoutée seulement si elle manque : PNG, JPEG ou WebP statique, 8 Mo maximum à l’envoi, décodage borné et normalisation PNG. Aucun scan existant n’est écrasé. Le dossier d’assets existant doit être disponible et accessible en écriture sur le VPS. Révision et contrôle des permissions partagés avec les corrections de texte ; ajout journalisé. Aucun fichier supprimé n’est restauré automatiquement.

Migration 0006_add_catalogue_cards : corrections dans catalogue_cards, distinctes du manifeste et des fiches importées. Les lecteurs du catalogue fusionnent ces données à chaque requête ; les nouvelles entrées pourront être ajoutées par le futur import sans recompilation du manifeste. Les images originales restent intactes. Les fichiers de source avec _local ne sont pas exposés par l’API publique.

Les finitions renseignées décrivent les versions disponibles, sans inventer de probabilité d’obtention. Les options holo de la modal restent des aperçus visuels. Les prix ne font pas partie des six champs obligatoires convenus. Aucun booster ou exemplaire n’est créé par cet éditeur.

## Tarifs des cartes — 0.0.14

Module /admin/prix : tarifs généraux par rareté et finition, exceptions par carte, pièces/gemmes indépendantes, révisions et journal. Accessible avec economy.read ; modifications avec economy.edit. Aucun droit automatiquement attribué aux rôles existants. Bougli utilise son statut protégé. Voir PRIX_CARTES.md. Les boosters et récompenses restent à développer.


## Mise à jour : finition unique et boosters

Une seule finition par carte ; les fiches ambiguës restent à définir manuellement. Tarifs individuels limités à cette finition. Module de composition par set, cadeaux et ouverture décrit dans BOOSTERS.md. Les mentions anciennes de versions multiples et de boosters à venir ci-dessus constituent le contexte historique.

## Actualités — CMS 0.0.22
Module /admin/actualites : éditeur visuel par blocs, bibliothèque d’images, aperçu, historique, publication immédiate ou programmée, corbeille et restauration. Couverture facultative ; description alternative obligatoire. Permissions news.read/create/edit/delete/publish séparées. Les modifications restent en brouillon avant validation. Voir CMS_ACTUALITES.md.

