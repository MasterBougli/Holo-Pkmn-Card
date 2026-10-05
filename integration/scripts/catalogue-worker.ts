import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { asc,eq,inArray,sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { importJobs,importSchedule } from "@/lib/catalogue-import-schema";
import { discoverCatalogue } from "@/lib/catalogue-discovery";
import { executeCatalogueImport } from "@/lib/catalogue-import-executor";
export function nextWeeklyRun(after:Date,weekday:number,hour:number){
 const days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
 const formatter=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Paris",weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
 const next=new Date(Math.ceil((after.getTime()+60000)/60000)*60000);
 for(let i=0;i<8*24*60;i++,next.setUTCMinutes(next.getUTCMinutes()+1)){
  const parts=formatter.formatToParts(next),part=(type:string)=>parts.find(p=>p.type===type)?.value;
  if(part("weekday")===days[weekday]&&Number(part("hour"))===hour&&part("minute")==="00")return next;
 }
 throw new Error("Prochaine recherche introuvable.");
}
async function run(){
 const client=new Client({connectionString:process.env.DATABASE_URL});await client.connect();client.on("error",()=>process.exit(1));
 const result=await client.query("select pg_try_advisory_lock(748291035) as acquired");
 if(!result.rows[0]?.acquired){await client.end();throw new Error("Un service de catalogue est déjà actif.");}
 // Interrupted tasks resume from their persisted report/import; existing cards are always skipped.
 await db.update(importJobs).set({status:"queued",summary:"Reprise après interruption."}).where(eq(importJobs.status,"running"));
 while(true){
  await db.update(importSchedule).set({heartbeat:new Date()});
  const [schedule]=await db.select().from(importSchedule).limit(1);
  const [job]=await db.select().from(importJobs).where(eq(importJobs.status,"queued")).orderBy(asc(importJobs.createdAt)).limit(1);
  if(job){
   await db.update(importJobs).set({status:"running"}).where(eq(importJobs.id,job.id));
   const heartbeat=setInterval(()=>{void db.update(importSchedule).set({heartbeat:new Date()}).catch(()=>{});},30000);
   try{const outcome=job.kind==="scan"?await discoverCatalogue(job.id):await executeCatalogueImport(job.id);await db.update(importJobs).set({...outcome,finishedAt:new Date()}).where(eq(importJobs.id,job.id));}
   catch(error){console.error("Catalogue : tâche interrompue.");await db.update(importJobs).set({status:"failed",summary:error instanceof Error?error.message:"Tâche impossible.",finishedAt:new Date()}).where(eq(importJobs.id,job.id));}
   finally{clearInterval(heartbeat);}
  }else if(schedule&&schedule.nextRun<=new Date()){
   await db.transaction(async tx=>{
    await tx.execute(sql.raw("select pg_advisory_xact_lock(748291034)"));
    const busy=await tx.select().from(importJobs).where(inArray(importJobs.status,["queued","running"])).limit(1);
    if(!busy.length){await tx.insert(importJobs).values({id:randomUUID(),kind:"scan",actorName:"Recherche hebdomadaire"});await tx.update(importSchedule).set({nextRun:nextWeeklyRun(new Date(),schedule.weekday,schedule.hour)}).where(eq(importSchedule.id,schedule.id));}
   });
  }else await new Promise(resolve=>setTimeout(resolve,15000));
  await client.query("select 1");
 }
}
run().catch(()=>{console.error("Catalogue : service arrêté.");process.exit(1);});
