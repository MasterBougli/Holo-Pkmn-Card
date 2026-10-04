import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { playerPreferences, type AccessibilityPreferences } from "@/lib/player-schema";

const allowed={
  theme:["clair","sombre"],colorAid:["aucune","rouge-vert","bleu-jaune","monochrome"],
  contrast:["standard","renforce"],textSize:["petit","normal","grand","tres-grand"],
  font:["systeme","atkinson","inclusive","open-dyslexic"],motion:["systeme","normal","reduites","desactivees"],
} as const;
function valid(value:unknown):value is AccessibilityPreferences{
  if(!value||typeof value!=="object")return false;const setting=value as Record<string,unknown>;
  return Object.entries(allowed).every(([key,options])=>options.includes(setting[key] as never));
}
export async function PATCH(request:Request){
  const origin=request.headers.get("origin"),expected=new URL(process.env.BETTER_AUTH_URL??request.url).origin;if(origin!==expected)return NextResponse.json({error:"Origin refused"},{status:403});
  const session=await auth.api.getSession({headers:await headers()});if(!session)return NextResponse.json({error:"Unauthenticated"},{status:401});
  let value:unknown;try{value=await request.json()}catch{return NextResponse.json({error:"Invalid body"},{status:400})}
  if(!valid(value))return NextResponse.json({error:"Invalid preferences"},{status:400});
  await db.insert(playerPreferences).values({userId:session.user.id,accessibility:value}).onConflictDoUpdate({target:playerPreferences.userId,set:{accessibility:value,updatedAt:new Date()}});
  return NextResponse.json({ok:true});
}
export async function GET(){
  const session=await auth.api.getSession({headers:await headers()});if(!session)return NextResponse.json({error:"Unauthenticated"},{status:401});
  const [record]=await db.select({preferences:playerPreferences.accessibility}).from(playerPreferences).where(eq(playerPreferences.userId,session.user.id)).limit(1);
  return NextResponse.json({preferences:record?.preferences??null});
}
