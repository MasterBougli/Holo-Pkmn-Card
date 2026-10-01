import { NextResponse } from "next/server";
import { AdminError } from "@/lib/admin-access";
export async function adminBody(request:Request):Promise<Record<string,unknown>>{
 const expected=new URL(process.env.BETTER_AUTH_URL??request.url).origin;
 if(request.headers.get("origin")!==expected)throw new AdminError("Origine refusée.");
 if(Number(request.headers.get("content-length")??0)>32768)throw new AdminError("Données trop volumineuses.",413);
 const text=await request.text();
 if(text.length>32768)throw new AdminError("Données trop volumineuses.",413);
 let body;try{body=JSON.parse(text);}catch{throw new AdminError("Données invalides.",400);}
 if(!body||typeof body!=="object"||Array.isArray(body))throw new AdminError("Données invalides.",400);
 return body;
}
export function adminFailure(error:unknown){
 if(error instanceof AdminError)return NextResponse.json({error:error.message},{status:error.status});
 if((error as {code?:string})?.code==="23505"||(error as {cause?:{code?:string}})?.cause?.code==="23505")
  return NextResponse.json({error:"Ce nom de rôle existe déjà."},{status:409});
 console.error("Administration : opération impossible.");
 return NextResponse.json({error:"Opération impossible. Réessaie."},{status:500});
}
