import {and,eq,gte,lt,count,isNull} from "drizzle-orm";
import {db} from "./db";
import {gameEvents} from "./event-schema";
import {eventClaims} from "./event-reward-schema";
import {playerBoosters,ownedCards} from "./booster-schema";
import {newsUuid} from "./news-types";
import {AdminError} from "./admin-authorisation";
type Connection=Pick<typeof db,"select">;
export async function playerEventProgress(userId:string,id:string,connection:Connection=db){
 if(!newsUuid(id))throw new AdminError("Événement invalide.",400);
 const [event]=await connection.select().from(gameEvents).where(and(eq(gameEvents.id,id),isNull(gameEvents.archivedAt))).limit(1);
 if(!event?.published||!event.startsAt||!event.endsAt)throw new AdminError("Événement introuvable.",404);
 const claims=await connection.select({target:eventClaims.target}).from(eventClaims).where(and(eq(eventClaims.userId,userId),eq(eventClaims.eventId,id)));
 const claimed=new Set(claims.map(c=>c.target));
 const window=and(eq(playerBoosters.userId,userId),gte(playerBoosters.openedAt,event.startsAt),lt(playerBoosters.openedAt,event.endsAt));
 const objectives=[];
 for(const o of event.published.objectives){
  const where=and(window,o.setCode?eq(playerBoosters.setCode,o.setCode):undefined);
  let value:number;
  if(o.kind==="boosters"){const [row]=await connection.select({value:count()}).from(playerBoosters).where(where);value=row.value;}
  else{const [row]=await connection.select({value:count()}).from(ownedCards).innerJoin(playerBoosters,eq(ownedCards.boosterId,playerBoosters.id)).where(and(where,eq(ownedCards.cardId,o.cardId),eq(ownedCards.acquisitionSource,"booster")));value=row.value;}
  objectives.push({id:o.id,kind:o.kind,quantity:o.quantity,current:Math.min(o.quantity,value),complete:value>=o.quantity,claimed:claimed.has(o.id)});
 }
 return {id:event.id,kind:event.published.kind,startsAt:event.startsAt,endsAt:event.endsAt,objectives,complete:event.published.kind==="playable"&&objectives.length>0&&objectives.every(o=>o.complete),finalClaimed:claimed.has("final")};
}
