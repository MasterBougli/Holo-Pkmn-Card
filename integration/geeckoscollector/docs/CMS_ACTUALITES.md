# CMS des actualités — cadrage, 5 octobre 2026
Statut : développement autorisé par Bougli, version prévue 0.0.22.
## Choix confirmés
Éditeur visuel ; brouillons et prévisualisation ; publication immédiate ou programmée ; accueils public et connecté et page article publique ; bibliothèque d’images réutilisables et textes alternatifs ; historique et restauration ; corbeille restaurable ; couverture facultative.
Permissions news.read/create/edit/delete/publish séparées et configurables. À sa demande, Eublepharis possède le rôle Rédacteur existant, y compris suppression/publication. Attribution journalisée ; autres rôles cumulés.
## Hypothèses de développement annoncées
Titre, résumé, couverture, contenu par blocs et lien facultatif, sans catégories pour cette première livraison. Modifier un article publié crée un brouillon ; publication existante conservée jusqu’à validation. Pas de commentaires ni de notifications envoyées.
## Parcours et règles
Liste admin, création, édition, aperçu, historique, restauration comme brouillon, publier/programmer/dépublier, corbeille et restauration sans republication automatique. Éditeur par blocs (paragraphes gras/italiques, titres, listes, citations, liens et images), aperçu dans le rendu réel. Aucun HTML saisi ou exécuté. Champs simples, titre et contenu requis pour publier.
Les publications programmées conservent un instantané approuvé indépendant du brouillon. Elles deviennent visibles à la date choisie lors de la lecture serveur : aucun cron supplémentaire. Europe/Paris ; heures inexistantes ou ambiguës aux changements d’heure refusées avec conseil.
## Données et sécurité
PostgreSQL : articles, révisions et médias. Révision optimiste, transactions/verrou partagé avec permissions, contrôles d’origine et journal. Les rédacteurs ne peuvent changer publication/calendrier sans news.publish. Restauration de version : uniquement le brouillon.
Images PNG/JPEG/WebP statiques, 8 Mo maximum, pixels décodés bornés, normalisation WebP sans métadonnées, identifiants générés ; aucune récupération de liens distants. Les médias privés/brouillons restent protégés et deviennent publics seulement lorsqu’un article visible les référence. Bibliothèque conservée pour les anciennes versions.
## Livraison et limites
Migration additive 0012, sauvegarde privée avant application, compilation bornée uniquement VPS. Aucun article de démonstration publié. Accueils vides adaptés. Retour arrière : build précédent, tables conservées. Pas de dépendance ajoutée ; sharp déjà utilisé par l’éditeur de cartes.
Vérifications seulement selon autorisation utilisateur ; compilation et revue du code ; ne pas annoncer de tests exécutés sans preuve. Référence initiale des décisions : docs/ADMINISTRATION.md.

### État de livraison — 5 octobre 2026
Compilation finale Webpack, TypeScript et génération des pages réussies sur VPS. Migration appliquée après sauvegarde privée. Mise en ligne non effectuée : validation explicite de Bougli demandée par le contrôle automatique de déploiement. Le site actif reste en 0.0.21. Aucun article créé ni publié ; parcours CMS et import d’image réels à vérifier après mise en ligne. Sources de l’intégration préparées en 0.0.22.

