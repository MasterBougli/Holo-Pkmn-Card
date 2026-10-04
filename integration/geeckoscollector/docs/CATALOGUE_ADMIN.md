# Gestion administrative du catalogue

## Règles confirmées — 2 octobre 2026

- Un set actif autorise l’obtention des cartes qui ne sont pas exclues individuellement.
- Un set inactif et ses cartes restent consultables dans le catalogue public.
- Une exclusion individuelle reste enregistrée même si le set devient inactif, puis actif.
- Ces changements concernent les futures obtentions ; ils ne retirent pas les exemplaires possédés et ne modifient pas leurs tarifs de revente.
- Les profils holo et leurs aperçus n’autorisent pas une finition ou une carte à l’obtention.

## Module

/admin/catalogue propose une recherche par nom, code ou série, un filtre actif/inactif et une pagination de 24 sets. Sélectionner un set affiche son état et ses cartes, avec recherche par nom, numéro ou rareté et filtre des exclusions. Les actions explicites activent/désactivent un set ou ajoutent/retirent l’exclusion d’une carte. La lecture seule reste possible selon les permissions.

Aucun statut n’est basculé automatiquement lors de l’installation. Les exceptions absentes signifient « suit le set ». Le catalogue public continue à afficher les cartes exclues sans exposer le panneau administratif.

## Permissions et sauvegarde

- Ouvrir le module et lire ses données : admin.access + catalogue.read.
- Activer ou désactiver un set : admin.access + catalogue.activate.
- Exclure ou réautoriser une carte : admin.access + catalogue.edit. Cette permission permet aussi les corrections des fiches et l’ajout d’un scan manquant.
- Contrôle côté serveur, vérification de l’origine et validation de l’appartenance de la carte au manifeste du set.
- Verrou transactionnel commun avec les rôles et autres écritures administratives ; relecture des droits et révisions pour refuser l’écrasement d’une modification concurrente.
- Historique avant/après dans le journal, avec auteur, set ou carte, date. Un enregistrement sans changement n’ajoute pas une fausse action.

## Données

Migration 0005_add_card_availability : révision sur game_sets, exceptions dans card_availability, clé card_id, référence set_code, exclusion et révision. Les définitions et images du catalogue importé restent intactes. Sauvegarder la base avant migration.

lib/catalogue-eligibility.ts fournit le filtrage des sets actifs et des cartes non exclues. Le futur moteur de boosters devra l’utiliser dans sa transaction d’attribution pour respecter une disponibilité cohérente. Ce helper ne crée ni booster ni exemplaire. Les contrôles de maintenance et les autres règles d’accès devront aussi être appliqués côté serveur.

## Suite

Les imports, la création/suppression de sets et cartes, les boosters et les exemplaires avec défauts restent à construire. Les finitions disponibles peuvent être renseignées dans les fiches. Les défauts sont cadrés dans ADMINISTRATION.md ; aucun taux numérique ne doit être inventé.

## Cadrage du prochain module d’import

Bougli choisit une recherche automatique des sets et cartes manquants, suivie d’une validation manuelle avant import. Aucun import automatique sans validation. Fréquence hebdomadaire confirmée le 2 octobre 2026. Cette recherche programmée n’est pas encore implémentée.


## Fiches complètes avant activation — 2 octobre 2026

Chaque carte du set doit posséder : nom, numéro, rareté, illustrateur, image présente et au moins une finition disponible. Une valeur vide ou « Non renseigné » n’est pas considérée complète. Toutes les cartes comptent, y compris les cartes exclues individuellement. Le bouton d’activation et son API bloquent les sets incomplets ; le helper d’éligibilité du futur moteur applique aussi cette règle.

Depuis /admin/catalogue, ouvrir les cartes du set puis « Compléter la fiche ». Les quatre textes et les finitions peuvent être corrigés avec catalogue.edit. Les brouillons incomplets sont autorisés et restent consultables. Une modification qui rend un set actif incomplet le désactive dans la même transaction, avec auteur et motif au journal. Compléter le dernier champ n’active pas le set automatiquement : catalogue.activate reste nécessaire pour l’action explicite.

L’image peut être ajoutée seulement si elle manque : PNG, JPEG ou WebP statique, 8 Mo maximum à l’envoi, décodage borné et normalisation PNG. Aucun scan existant n’est écrasé. Le dossier d’assets existant doit être disponible et accessible en écriture sur le VPS. Révision et contrôle des permissions partagés avec les corrections de texte ; ajout journalisé. Aucun fichier supprimé n’est restauré automatiquement.

Migration 0006_add_catalogue_cards : corrections dans catalogue_cards, distinctes du manifeste et des fiches importées. Les lecteurs du catalogue fusionnent ces données à chaque requête ; les nouvelles entrées pourront être ajoutées par le futur import sans recompilation du manifeste. Les images originales restent intactes. Les fichiers de source avec _local ne sont pas exposés par l’API publique.

Les finitions renseignées décrivent les versions disponibles, sans inventer de probabilité d’obtention. Les options holo de la modal restent des aperçus visuels. Les prix ne font pas partie des six champs obligatoires convenus. Aucun booster ou exemplaire n’est créé par cet éditeur.


## Mise à jour : finition unique et boosters

Une seule finition par carte ; les fiches ambiguës restent à définir manuellement. Tarifs individuels limités à cette finition. Module de composition par set, cadeaux et ouverture décrit dans BOOSTERS.md. Les mentions anciennes de versions multiples et de boosters à venir ci-dessus constituent le contexte historique.
