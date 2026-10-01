import { headers } from "next/headers";
import { auth } from "@/lib/auth";
export function isAdminUser(id:string){return (process.env.ADMIN_USER_IDS??"").split(",").map(value=>value.trim()).filter(Boolean).includes(id);}
export async function getAdminSession(){
 const session=await auth.api.getSession({headers:await headers()});
 return session&&isAdminUser(session.user.id)?session:null;
}
