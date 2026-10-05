export const permissionGroups = [
 {label:"Administration",future:false,items:[["admin.access","Ouvrir l’administration"],["audit.read","Consulter le journal"]]},
 {label:"Rôles et comptes",future:false,items:[["roles.read","Voir les rôles"],["roles.create","Créer un rôle"],["roles.edit","Modifier les rôles et permissions"],["roles.delete","Archiver un rôle"],["roles.assign","Attribuer et retirer des rôles"],["users.read","Consulter les comptes"]]},
 {label:"Raretés",future:false,items:[["rarities.read","Consulter les raretés"],["rarities.create","Créer une rareté"],["rarities.edit","Modifier les raretés"],["rarities.delete","Supprimer et remplacer une rareté"]]},
 {label:"Apparence des cartes",future:false,items:[["holo.read","Voir les réglages holo"],["holo.edit","Modifier les réglages holo"]]},
 {label:"Défauts des exemplaires",future:false,items:[["defects.preview","Utiliser l’atelier de simulation des défauts"]]},
 {label:"Configuration",future:false,items:[["config.read","Lire la configuration"],["config.edit","Modifier la configuration"]]},
 {label:"Disponibilité du catalogue",future:false,items:[["catalogue.read","Consulter le catalogue administrateur"],["catalogue.activate","Activer et désactiver des sets"]]},
 {label:"Cartes du catalogue",future:false,items:[["catalogue.edit","Compléter les fiches et gérer les exclusions"]]},
 {label:"Imports du catalogue",future:false,items:[["catalogue.import","Rechercher et valider les imports"]]},
 {label:"Création du catalogue",future:true,items:[["catalogue.create","Créer des sets et cartes"],["catalogue.delete","Supprimer des sets et cartes"]]},
 {label:"Actualités",future:false,items:[["news.read","Voir les actualités administrateur"],["news.create","Créer une actualité"],["news.edit","Modifier une actualité"],["news.delete","Supprimer une actualité"],["news.publish","Publier et dépublier une actualité"]]},
 {label:"Événements",future:true,items:[["events.read","Voir les événements administrateur"],["events.create","Créer un événement"],["events.edit","Modifier un événement"],["events.delete","Supprimer un événement"],["events.publish","Publier et arrêter un événement"]]},
 {label:"Tarifs des cartes",future:false,items:[["economy.read","Voir les tarifs"],["economy.edit","Modifier les tarifs"]]},
 {label:"Boosters",future:false,items:[["boosters.grant","Offrir des boosters aux joueurs"],["boosters.read","Voir les boosters"],["boosters.create","Créer un booster"],["boosters.edit","Modifier un booster"],["boosters.delete","Supprimer un booster"]]},
 {label:"Modération",future:true,items:[["users.edit","Modifier les profils joueurs"],["users.moderate","Modérer les comptes"]]},
] as const;
export const permissionKeys = permissionGroups.flatMap(group=>group.items.map(([key])=>key));
export type AdminPermission = typeof permissionKeys[number];
export const permissionLabels:Record<string,string> = Object.fromEntries(permissionGroups.flatMap(group=>group.items.map(([key,label])=>[key,label])));
export type AdminAccess = {superAdmin:boolean;permissions:AdminPermission[]};
export function can(access:AdminAccess,key:AdminPermission){return access.superAdmin||access.permissions.includes(key);}
export function canDelegate(access:AdminAccess,permissions:readonly string[]){return access.superAdmin||permissions.every(key=>access.permissions.includes(key as AdminPermission));}
export function validPermissions(value:unknown):value is AdminPermission[]{
 return Array.isArray(value)&&value.length<=permissionKeys.length&&new Set(value).size===value.length&&value.every(key=>typeof key==="string"&&permissionKeys.includes(key as AdminPermission));
}
export type AdminRoleView = {id:string;name:string;description:string;permissions:AdminPermission[];revision:number;archived:boolean;members:number};
