# GeeckosCollector — sources 0.0.43

Source de l’application et de l’intégration Pokémon Cards CSS, sous GPL-3.0. Effets originaux : Simon Goellner (@simeydotme), https://github.com/simeydotme/pokemon-cards-css ; adaptation : MasterBougli.

Cette version comprend la suppression directe des raretés, le classeur personnel et partagé, les favoris, la progression et les cartes manquantes, ainsi que la configuration des récompenses de collection. La distribution de ces récompenses reste à implémenter.

Les dossiers app, components, lib, drizzle et scripts contiennent les sources correspondantes. Le dossier geeckoscollector conserve l’ancienne intégration à titre historique. Les effets et textures originaux sont à la racine du dépôt.

Utiliser Node 22 : npm ci, puis npm run build. Configurer séparément les variables d’environnement et les ressources du jeu ; aucun secret, donnée de compte ou illustration du jeu n’est fourni. Appliquer les migrations avant l’activation des fonctionnalités qui en dépendent. Conserver la licence et les crédits lors de toute redistribution.