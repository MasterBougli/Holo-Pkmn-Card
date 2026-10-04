# Gestion des raretés

Administration > Raretés permet de créer, renommer et supprimer les raretés. Les fiches choisissent une seule rareté dans cette liste, commune aux prix et couleurs de révélation.

## Suppression et remplacement

Une rareté utilisée nécessite un remplacement. Choisir la priorité des tarifs (pièces et gemmes) et des effets configurés. Une monnaie non renseignée reprend la valeur disponible de l’autre rareté ; zéro reste explicite.

Les compositions actuelles sont réattribuées. Les choix identiques sont regroupés en additionnant leurs poids. Si la limite est dépassée, ajuster les compositions avant la suppression.

Les anciens libellés deviennent des correspondances d’import. Les fichiers source ne sont pas réécrits. Les exemplaires déjà obtenus et compositions figées des boosters attribués conservent leur historique.

## Imports et permissions

Un libellé inconnu rend la fiche incomplète jusqu’au choix d’une rareté connue ou à sa création. Un set incomplet reste inactif. Aucune fusion sémantique automatique de raretés proches.

Permissions distinctes : consultation, création, modification et suppression. Réattribuer des cartes nécessite catalogue.edit ; modifier les compositions ou couleurs nécessite boosters.edit ; transférer des prix nécessite economy.read et economy.edit. Les rôles existants ne reçoivent pas automatiquement ces permissions.

Les opérations sont transactionnelles, journalisées et protégées contre les modifications concurrentes. Recharger si le contexte a changé.

## Installation

Appliquer la migration 0011_game_rarities puis exécuter scripts/seed-rarities.mjs dans l’environnement de l’application. Le script initialise une liste vide depuis les libellés existants et regroupe uniquement les clés équivalentes (casse, espaces, accents). Une liste déjà initialisée est conservée.
