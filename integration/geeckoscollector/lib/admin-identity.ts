export function isSuperAdmin(id:string){
 return (process.env.ADMIN_USER_IDS??"").split(",").map(value=>value.trim()).filter(Boolean).includes(id);
}
