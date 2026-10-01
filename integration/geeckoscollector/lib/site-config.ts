export type SiteConfigFields={
 maintenanceEnabled:boolean;maintenanceMessage:string;
 registrationsEnabled:boolean;registrationMessage:string;
};
export type SiteConfiguration=SiteConfigFields&{revision:number;updatedAt:string};
export const defaultSiteConfig:SiteConfigFields={
 maintenanceEnabled:false,
 maintenanceMessage:"Le jeu est momentanément en maintenance. Les pages publiques restent accessibles. Reviens bientôt pour continuer ta collection.",
 registrationsEnabled:true,
 registrationMessage:"Les inscriptions sont momentanément fermées. Les comptes existants peuvent toujours se connecter.",
};
export function validSiteConfig(value:unknown):value is SiteConfigFields{
 if(!value||typeof value!=="object")return false;
 const config=value as SiteConfigFields;
 return typeof config.maintenanceEnabled==="boolean"&&typeof config.registrationsEnabled==="boolean"
 &&[config.maintenanceMessage,config.registrationMessage].every(message=>typeof message==="string"&&message.trim().length>=5&&message.length<=800&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(message));
}
export type SiteAvailability=SiteConfigFields&{canPlay:boolean};
