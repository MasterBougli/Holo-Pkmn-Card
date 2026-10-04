# Boosters et exemplaires — 4 octobre 2026
## Décisions confirmées
Une carte du catalogue possède une rareté et une finition uniques : normale, holo, reverse ou full art. Une source proposant plusieurs finitions reste à définir manuellement ; ces fiches bloquent la complétude du set. Une composition par set, commune aux visuels de boosters, configurable dans l'administration. Aucun taux ni composition initialement validé : pas de configuration automatique.
## Administration
/admin/boosters : sélectionner le set, ajouter des groupes de cartes. Chaque groupe contient un nombre de cartes et des choix de rareté pondérés. Une seule rareté constitue une garantie ; le poids relatif définit la probabilité parmi les raretés de ce groupe. Les cartes éligibles d'une rareté sont équiprobables. Les doublons sont possibles. Limites : 30 cartes par booster, 20 groupes, 30 choix par groupe, poids 1 à 1 000 000.
La composition actuelle s'applique à l'ouverture, y compris aux boosters offerts auparavant. Sa révision et son contenu sont figés dans chaque booster ouvert. Les tirages terminés ne changent jamais après une modification de configuration.
Permissions : boosters.read pour consulter, boosters.edit pour configurer, boosters.grant pour offrir. Pas d'attribution automatique de droits aux rôles existants. La permission de cadeau est distincte de la configuration. La création/suppression de types de boosters reste réservée pour une future extension, sans interface actuellement.
Attribution par pseudo de compte vérifié, quantité 1 à 100, motif obligatoire, confirmation et journal. Identifiant de requête stable lors d'une relance réseau ; une requête identique retourne le cadeau existant. Le serveur relit les droits dans la transaction.
Un set doit être actif et toutes ses fiches complètes pour attribuer et ouvrir ses boosters. Chaque rareté configurée doit avoir au moins une carte complète non exclue. Un set inactif reste configurable à partir de ses cartes complètes. Les visuels manquants sont signalés, sans restauration d'assets supprimés.
Aperçu /admin/boosters/apercu?set=CODE : jusqu'à cinq cartes complètes fixes. Aucun tirage, consommation, attribution, prix ni activation. Sert à examiner l'animation.
## Joueur
/boosters : stock réel, probabilités visibles avant ouverture, historique des boosters ouverts, pagination de 24. /collection : exemplaires réels et modal de détail rotative avec leurs défauts. L'accueil connecté affiche le nombre de boosters disponibles et les liens de réserve/classeur.
Ouverture autorisée uniquement au propriétaire connecté, pseudo renseigné et e-mail vérifié. Maintenance appliquée ; membres de l'équipe conservent l'accès convenu.
Tirage CSPRNG côté serveur. Verrou transactionnel commun avec les modifications de catalogue et d'administration. Consommation et création des exemplaires dans la même transaction ; panne avant commit = booster conservé. Relance après commit = même résultat. Unicité booster/position en base. Aucun choix de carte fourni par le navigateur.
Les exemplaires conservent identifiant, carte, set, numéro, rareté, illustrateur, finition, nouveauté au moment de l'ouverture et scénario de défaut. Les scans restent dans le catalogue ; noms/rareté/finition de l'exemplaire sont figés.
Défauts : zéro par défaut, configurable par million de cartes (0 à 1 000 = maximum 0,1 %). Un second tirage au même taux peut ajouter un deuxième défaut distinct, donc cumul bien plus rare. Jusqu'à deux défauts dans cette première version. Cinq types existants réutilisés ; graine, paramètres et carte voisine persistants. Aucun effet spécial de découverte de défaut ni bonus de revente.
## Présentation et accessibilité
Thème clair de table de collection ; paquet métallisé, déchirure, apparition puis retournement manuel des cartes, halos selon la finition et récapitulatif. Bouton Passer l'animation ; paramètres réduits/désactivés ou préférence système donnent directement le résultat. Modal avec défilement interne, focus, Échap, boutons tactiles et alternative clavier ; pas de son ni clignotement rapide. Pas de dépendance supplémentaire.
## Données et livraison
Migration 0009 : journal des fiches ambiguës, remise à zéro de leurs finitions, contrainte de singleton, tables booster_configs / booster_grants / player_boosters / owned_cards et index. Sauvegarde privée avant migration, puis recontrôle des sets actifs ; set incomplet désactivé avec audit.
La correction est appliquée à la lecture des sources brutes aussi : elles ne sont pas réécrites. Les champs variants bruts ne déterminent plus plusieurs finitions de jeu. Tarifs par carte limités à sa finition fixe ; valeurs générales conservées par rareté et finition.
Aucun achat, vente, wallet, cadeau automatique de bienvenue, récompense quotidienne ou échange livré dans ce module. Aucun set automatiquement activé, aucun booster réellement offert par l'agent.
Compilation uniquement sur VPS, worker arrêté, limites documentées dans PRIX_CARTES.md. Pas de test ajouté ou suite de tests exécutée. L'enregistrement effectif d'une composition, l'attribution et l'ouverture de jeu seront à essayer par Bougli avec ses réglages validés. La démonstration n'en constitue pas une validation.

## Ouverture 0.0.17
Visuel choisi parmi les fichiers réellement présents dans Web/Boosters/CODE, de façon stable par booster. Un fichier absent est indiqué sans utiliser un visuel d'un autre set.
Découpe par glissement sur la bande supérieure ; clavier flèches/Fin et bouton Ouvrir sans glisser. Après sauvegarde serveur, bande détachée, paquet qui tombe, éventail de dos de cartes et particules. Premier clic : retournement 3D ; second clic : prochaine carte face cachée. Les découvertes restent consultables dans le carrousel horizontal inférieur.
Modal centrée, en-tête et pied séparés du défilement interne. Réduction des animations et accès clavier conservés. Aucune migration supplémentaire.

## Révélations 0.0.18
Le paquet reste immobile et disparaît par fondu ; la bande de découpe utilise une petite languette rectangulaire, une couture discrète et une zone tactile de 44 px. Les cartes au-delà de Commune/Peu commune ont un contour coloré, un halo et des rayons brefs après retournement. Aucun indice de rareté avant révélation. Les effets sont indépendants des finitions holo et du tirage.
Administration > Boosters et cadeaux > Révélation des cartes rares : activation et couleur hexadécimale par libellé de rareté ; valeurs initiales déterministes, inconnues désactivées tant que non reconnues/configurées. Commune/Peu commune restent sans effet spécial. Permissions boosters.read/edit, contrôle d'origine, validation, verrou, révision indépendante et journal avant/après. Migration 0010 ajoute uniquement deux colonnes dans site_settings. En mouvement réduit, contour fixe et aucun rayon animé.

## Raretés administrables — 0.0.19
La liste commune se gère dans Administration > Raretés. Renommer ou remplacer une rareté met à jour les compositions actuelles, tarifs généraux et couleurs ; les anciens exemplaires et boosters attribués gardent leurs informations figées. Voir docs/RARETES.md.

## Vérification des cadeaux — 0.0.20
Attribution au joueur et au set sélectionnés, relance sans doublon et refus (quantités invalides, permissions, destinataire non vérifié, set inactif/incomplet, composition absente ou rareté sans carte éligible) vérifiés sur le véritable service dans une transaction annulée. Aucun cadeau durable créé par le contrôle. Le formulaire affiche désormais les raisons du blocage et le nom/code du set. Une soumission réussie dans l’interface et une ouverture persistante restent à essayer avec une composition validée et un set actif.

