import { can, type AdminAccess, type AdminPermission } from "./admin-permissions";
type AdminSection = { href: string; label: string; permission: AdminPermission };
export const adminGroups: { id: string; label: string; description: string; sections: AdminSection[] }[] = [
 {id:"cards",label:"Cartes et sets",description:"Fiches, prix, raretés, effets et imports du catalogue.",sections:[
  {href:"/admin/catalogue",label:"Sets et cartes",permission:"catalogue.read"},
  {href:"/admin/prix",label:"Tarifs généraux",permission:"economy.read"},
  {href:"/admin/raretes",label:"Raretés",permission:"rarities.read"},
  {href:"/admin/holo",label:"Effets holo",permission:"holo.read"},
  {href:"/admin/defauts",label:"Simulation des défauts",permission:"defects.preview"},
  {href:"/admin/imports",label:"Imports",permission:"catalogue.read"}]},
 {id:"rewards",label:"Boosters et récompenses",description:"Composer les boosters, offrir des cadeaux et préparer les récompenses.",sections:[
  {href:"/admin/boosters",label:"Boosters et cadeaux",permission:"boosters.read"},
  {href:"/admin/recompenses-collection",label:"Récompenses de collection",permission:"collectionRewards.read"}]},
 {id:"content",label:"Actualités et événements",description:"Préparer et publier le contenu du jeu.",sections:[
  {href:"/admin/actualites",label:"Actualités",permission:"news.read"},
  {href:"/admin/evenements",label:"Événements",permission:"events.read"}]},
 {id:"team",label:"Équipe",description:"Comptes, rôles, permissions et suivi des actions.",sections:[
  {href:"/admin/comptes",label:"Comptes",permission:"users.read"},
  {href:"/admin/roles",label:"Rôles et permissions",permission:"roles.read"},
  {href:"/admin/journal",label:"Journal d’actions",permission:"audit.read"}]},
 {id:"settings",label:"Réglages du jeu",description:"Disponibilité du jeu et réglages globaux.",sections:[
  {href:"/admin/configuration",label:"Configuration",permission:"config.read"}]}
];
export function visibleAdminGroups(access:AdminAccess){
 return adminGroups.map(group=>({...group,sections:group.sections.filter(section=>can(access,section.permission))})).filter(group=>group.sections.length>0);
}
