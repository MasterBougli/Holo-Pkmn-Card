# Tarifs de revente des cartes

## Réglages livrés

L'administration propose /admin/prix. Deux valeurs indépendantes en pièces et en gemmes sont configurables pour chaque rareté et finition : normale, holographique, reverse et full art. Les raretés sont celles du catalogue ; les variations de casse et d'accents désignent le même tarif.

Une exception peut être enregistrée pour une carte précise et une finition. Chaque monnaie suit séparément cette priorité :

1. Tarif particulier renseigné pour la carte.
2. Tarif général de sa rareté et de sa finition.
3. « À définir » si aucun tarif ne s'applique.

Un champ vide signifie « À définir » dans la grille générale et « reprendre le tarif général » dans une exception. Zéro est une valeur explicite et ne déclenche pas l'héritage. Aucun montant proposé dans ECONOMIE.md n'est renseigné automatiquement. Les montants sont des entiers compris entre 0 et 1 000 000 000.

## Parcours

- Choisir Par rareté ou Exception par carte.
- Pour une carte, choisir son set puis rechercher son nom, numéro ou rareté.
- Saisir les deux valeurs de chaque finition et enregistrer.
- Les tarifs actuellement appliqués restent visibles sous chaque finition ; un brouillon ne les modifie pas.
- Annuler revient aux valeurs chargées. Recharger obtient les valeurs actuelles et demande d'abandonner un brouillon si nécessaire.
- « Effacer les deux tarifs » ou « Reprendre les tarifs généraux » prépare un changement qui ne s'applique qu'après Enregistrer.

Le catalogue administratif propose un lien direct vers les tarifs d'une carte. La fiche publique affiche les deux prix pour les finitions réellement renseignées comme disponibles. Les aperçus visuels holo restent indépendants : choisir un effet décoratif ne crée pas une version vendable ni son prix.

## Permissions et suivi

- admin.access + economy.read : consulter le module.
- admin.access + economy.edit : enregistrer les tarifs ; economy.read permet d'ouvrir l'écran.
- Droits relus dans la transaction sous le verrou administratif partagé.
- Révisions vérifiées pour les quatre finitions ; conflit explicite si un autre membre a enregistré entre-temps.
- Journal avant/après avec auteur, date et montants par finition. Pas de journal pour un enregistrement sans effet.
- Les règles remises à vide restent enregistrées avec leur révision pour empêcher le retour silencieux d'anciens brouillons.
- Contrôle d'origine et taille de requête bornée pour l'API. Les réponses publiques ne contiennent ni auteur ni historique privé.

Migration 0008_add_card_prices ; aucune valeur initiale. Le stockage est indépendant de l'import et des fiches de métadonnées.

## Règles conservées

Les défauts d'impression, de découpe et leur cumul ne modifient pas le tarif de base. Les offres des joueurs lors des échanges pourront différer. Les tarifs ne sont pas requis pour activer un set : son activation reste conditionnée aux six informations obligatoires de toutes ses cartes.

Le module configure et affiche les prix. Le moteur de vente, les soldes, les échanges et les boosters restent à développer ; aucun débit ni crédit de joueur n'est créé par cet écran.


## Livraison du 4 octobre 2026

Migration appliquée après sauvegarde privée de la base. Compilation Webpack/TypeScript réussie et module consulté avec Bougli. Aucun tarif renseigné par l'agent. Prix publics Noeunoeuf 30C-001 : réponse 200, version normale disponible, montants null affichés À définir. Enregistrement réel, conflits et héritage avec des montants renseignés restent à essayer lors de l'équilibrage ; aucune suite de tests ajoutée ou exécutée.

Compilation sur ce VPS : conteneur 2304 Mo RAM, 3584 Mo RAM+swap, CPU 1, coeur réservé, NODE_OPTIONS=--max-old-space-size=640, RAYON_NUM_THREADS=1, NEXT_TELEMETRY_DISABLED=1 ; worker arrêté. Next conserve cpus=1, webpackMemoryOptimizations, webpackBuildWorker et cache désactivé ; parallelism=1 limite aussi les traitements Webpack. Les essais à 2048 Mo ont atteint la limite du conteneur, sans arrêt du VPS. Garde de réserve : interrompre le seul build si RAM disponible <256 Mo et swap libre <128 Mo simultanément.


## Accès carte par carte

Le module ouvre directement « Par carte ». Sélectionner le set et la carte, saisir ses prix en pièces et gemmes pour chaque finition, puis enregistrer. Chaque carte conserve ses propres montants ; un champ vide reprend le tarif général de sa rareté. La fiche de carte propose aussi « Régler les prix de cette carte » avec la permission economy.read.


## Mise à jour : finition unique et boosters

Une seule finition par carte ; les fiches ambiguës restent à définir manuellement. Tarifs individuels limités à cette finition. Module de composition par set, cadeaux et ouverture décrit dans BOOSTERS.md. Les mentions anciennes de versions multiples et de boosters à venir ci-dessus constituent le contexte historique.
