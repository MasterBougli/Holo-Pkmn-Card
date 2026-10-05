import { randomUUID } from "node:crypto";
import { desc,eq,and,inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { importJobs,discoveryItems,importSchedule } from "@/lib/catalogue-import-schema";
import { adminAudit } from "@/lib/admin-schema";
import { AdminError,lockAdminAccess } from "@/lib/admin-authorisation";
import { codePattern,tcgdexPattern,type ImportRequest } from "@/lib/catalogue-import-types";
type Actor={id:string;name:string;username?:string|null};
export async function readImportDashboard(reportId?:string){
 const jobs=await db.select().from(importJobs).orderBy(desc(importJobs.createdAt)).limit(30);
 const report=reportId?jobs.find(job=>job.id===reportId&&job.kind==="scan"):jobs.find(job=>job.kind==="scan");
 const items=report?await db.select().from(discoveryItems).where(eq(discoveryItems.reportId,report.id)):[];
 const [schedule]=await db.select().from(importSchedule).limit(1);
 return {jobs,reportId:report?.id??null,items:items.map(item=>item.data).sort((a,b)=>b.missing-a.missing||a.name.localeCompare(b.name)),schedule:schedule??null};
}
export async function queueCatalogueJob(actor:Actor,body:Record<string,unknown>){
 const kind=body.kind;
 if(kind!=="scan"&&kind!=="import")throw new AdminError("Action invalide.",400);
 return db.transaction(async tx=>{
  await lockAdminAccess(tx,actor.id,"catalogue.import");
  const [active]=await tx.select().from(importJobs).where(inArray(importJobs.status,["queued","running"])).limit(1);
  if(active)throw new AdminError("Une tâche est déjà en cours. Attends sa fin avant de continuer.",409);
  let payload:ImportRequest|null=null;
  if(kind==="import"){
   const {reportId,sourceCode,localCode,tcgdexId}=body;
   if(typeof reportId!=="string"||typeof sourceCode!=="string"||typeof localCode!=="string"||!codePattern.test(localCode)||typeof tcgdexId!=="string"||(tcgdexId!==""&&!tcgdexPattern.test(tcgdexId))||body.confirm!==true)throw new AdminError("Confirme un code interne et une correspondance valides.",400);
   const [report]=await tx.select().from(importJobs).where(eq(importJobs.id,reportId)).limit(1);
   const [item]=await tx.select().from(discoveryItems).where(and(eq(discoveryItems.reportId,reportId),eq(discoveryItems.sourceCode,sourceCode))).limit(1);
   if(!report||!item||!["complete","partial"].includes(report.status)||!item.data.complete||!item.data.cards.length)throw new AdminError("Checklist incomplète : relance la recherche avant cet import.",409);
   if(Date.now()-report.createdAt.getTime()>8*24*3600000)throw new AdminError("Rapport trop ancien. Relance la recherche.",409);
   payload={reportId,sourceCode,localCode,tcgdexId,confirm:true};
  }
  const [job]=await tx.insert(importJobs).values({id:randomUUID(),kind,actorId:actor.id,actorName:actor.username??actor.name,payload}).returning();
  await tx.insert(adminAudit).values({actorId:actor.id,actorName:actor.username??actor.name,action:kind==="scan"?"catalogue.scan":"catalogue.import.request",targetName:payload?.sourceCode??"Catalogue",after:{importSummary:payload?"Import validé : "+payload.sourceCode+" → "+payload.localCode+" · "+(payload.tcgdexId||"Informations à compléter"):"Recherche demandée",jobId:job.id}});
  return job;
 });
}
