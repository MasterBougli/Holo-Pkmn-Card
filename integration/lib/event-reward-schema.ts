import {pgTable,text,jsonb,timestamp,bigint,uniqueIndex,check} from "drizzle-orm/pg-core";
import {sql} from "drizzle-orm";
import {user} from "./auth-schema";
import {gameEvents} from "./event-schema";
import type {EventReward} from "./event-types";
export const eventClaims=pgTable("event_claims",{
 id:text("id").primaryKey(),userId:text("user_id").notNull().references(()=>user.id,{onDelete:"cascade"}),
 eventId:text("event_id").notNull().references(()=>gameEvents.id,{onDelete:"restrict"}),target:text("target").notNull(),
 rewards:jsonb("rewards").$type<EventReward[]>().notNull(),outcome:jsonb("outcome").$type<{cardIds:string[];boosterIds:string[];coins:string;gems:string}>().notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow()
},t=>[uniqueIndex("event_claim_once_idx").on(t.userId,t.eventId,t.target)]);
export const playerWallets=pgTable("player_wallets",{
 userId:text("user_id").primaryKey().references(()=>user.id,{onDelete:"cascade"}),
 coins:bigint("coins",{mode:"bigint"}).notNull().default(sql`0`),gems:bigint("gems",{mode:"bigint"}).notNull().default(sql`0`),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow()
},t=>[check("player_wallet_nonnegative",sql`${t.coins}>=0 AND ${t.gems}>=0`)]);
export const walletEntries=pgTable("wallet_entries",{
 id:text("id").primaryKey(),userId:text("user_id").notNull().references(()=>user.id,{onDelete:"cascade"}),
 claimId:text("claim_id").notNull().references(()=>eventClaims.id,{onDelete:"cascade"}),
 coins:bigint("coins",{mode:"bigint"}).notNull(),gems:bigint("gems",{mode:"bigint"}).notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow()
},t=>[uniqueIndex("wallet_entry_claim_once_idx").on(t.claimId)]);
