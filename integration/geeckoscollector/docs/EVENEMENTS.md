# Événements — cadrage du 5 octobre 2026

## Décisions confirmées
- Deux formes : annonces datées et événements jouables avec objectifs et récompenses.
- Objectifs jouables : ouvrir des boosters et obtenir des cartes précises.
- Seuls les boosters ouverts et cartes obtenues pendant l’événement comptent. La collection déjà possédée avant le début ne donne pas de progression.
- Cadrage par questions successives ; configuration laissée à l’équipe de Bougli.

## En cours de décision
Récompenses par objectif et/ou finales ; types de récompenses ; ciblage des sets et cartes ; inscription et participation ; calendrier et gestion des modifications ; mode de récupération et conséquences des échanges.

## Contraintes de développement
Les progrès seront calculés côté serveur à partir des ouvertures et exemplaires enregistrés. Chaque attribution devra être persistante, journalisée et idempotente, y compris après interruption. Aucun événement ni montant de récompense créé automatiquement. Les permissions events.read/create/edit/delete/publish sont réservées mais le module n’est pas encore disponible.

Les actualités constituent un CMS distinct. Le lien éventuel entre une actualité et un événement reste à cadrer.

Décision complémentaire : récompense possible par objectif et récompense finale lorsque tous les objectifs sont terminés, configurables pour chaque événement.

