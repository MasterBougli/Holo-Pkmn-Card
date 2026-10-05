# Événements — cadrage du 5 octobre 2026

## Décisions confirmées
- Deux formes : annonces datées et événements jouables avec objectifs et récompenses.
- Objectifs jouables : ouvrir des boosters et obtenir des cartes précises.
- Seuls les boosters ouverts et cartes obtenues pendant l’événement comptent. La collection déjà possédée avant le début ne donne pas de progression.
- Récompenses : boosters, cartes précises, pièces et gemmes, par objectif et finales.
- Récupération manuelle via le bouton « Récupérer » dans la page de l’événement.
- Participation automatique dès le début de l’événement.
- Cadrage par questions successives ; configuration laissée à l’équipe de Bougli.

## En cours de décision
Sources d’acquisition des cartes comptées ; calendrier et gestion des modifications ; délai de récupération après la fin ; consequences des échanges.

## Contraintes de développement
Les progrès seront calculés côté serveur à partir des ouvertures et exemplaires enregistrés. Chaque attribution devra être persistante, journalisée et idempotente, y compris après interruption. Aucun événement ni montant de récompense créé automatiquement. Les permissions events.read/create/edit/delete/publish sont réservées avec un premier module d’annonces et de préparation des défis ; le moteur de récompenses reste à développer.

Les actualités constituent un CMS distinct. Le lien éventuel entre une actualité et un événement reste à cadrer.

Décision complémentaire : récompense possible par objectif et récompense finale lorsque tous les objectifs sont terminés, configurables pour chaque événement.


## Première tranche — 0.0.24, préparée pour compilation
Administration /admin/evenements et API /api/admin/events. Brouillons, publication des annonces datées, dépublication, archivage restaurable sans republication. Edition d’une annonce publiée indépendante de la version visible. Révision anti-écrasement, origine contrôlée, droits par action et journal transactionnel.
Pages /evenements et /evenements/[id], navigation et deux accueils liés aux annonces visibles. Statuts À venir, En cours et Terminé ; dates Europe/Paris, fin après début, heures ambiguës ou inexistantes refusées.
Défis : préparer des objectifs d’ouverture de boosters (tous les sets ou set précis) et d’obtention d’une carte précise, quantités et récompenses par objectif/finales. Références catalogue vérifiées au serveur. La publication des défis est refusée tant que progression et récupération ne sont pas livrées ; aucun bouton de récupération fictif ni attribution de monnaie. Les montants saisis sont seulement des configurations de brouillon.
Limites de saisie : 20 objectifs, 20 récompenses par groupe, quantités positives entières ; 100 cartes/boosters par récompense, 1 000 000 unités de monnaie. Aucun contenu HTML exécuté.
Migration additive 0013_game_events. Aucun événement publié, réglage ou don créé automatiquement. La base ne dispose pas encore du portefeuille et du registre d’attribution nécessaire aux récompenses.

### Compilation de la tranche 0.0.24 confirmée
Build final Webpack, TypeScript et génération des pages réussis sur le VPS. Les annonces et brouillons jouables sont prêts dans le code, pas encore mis en ligne. Migration appliquée après sauvegarde privée. Aucun événement créé ou publié, aucune récompense attribuée ; aucun test fonctionnel ni suite de tests exécuté. La progression, le portefeuille et la récupération des récompenses restent à développer. Les choix sur les acquisitions comptées et les délais après la fin restent à cadrer.


### Suite technique du moteur jouable
Le modèle owned_cards impose encore un booster_id non nul : les cartes de récompense devront recevoir une provenance explicite sans inventer une ouverture. Prévoir un registre unique des récupérations par joueur/événement/objectif, un portefeuille et un journal de mouvements. Les cartes et boosts attribués devront passer par les contrôles de disponibilité du catalogue ; les règles approuvées devront être figées lors de publication d’un défi. Aucune mécanique d’attribution de cette suite n’est exécutée par la tranche 0.0.24.

