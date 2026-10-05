import {eventClaims} from "./event-reward-schema";
import { pgTable,text,varchar,jsonb,integer,timestamp,index,uniqueIndex,check,boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth-schema";
import { gameSets } from "./catalogue-schema";
import type { BoosterComposition,OwnedCard } from "./booster-types";
export const boosterConfigs=pgTable("booster_configs",{
 setCode:varchar("set_code",{length:12}).primaryKey().references(()=>gameSets.code,{onDelete:"restrict"}),
 composition:jsonb("composition").$type<BoosterComposition>().notNull(),
 revision:integer("revision").notNull().default(1),updatedBy:text("updated_by").notNull(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
});
export const boosterGrants=pgTable("booster_grants",{
 id:text("id").primaryKey(),actorId:text("actor_id").notNull(),userId:text("user_id").notNull().references(()=>user.id,{onDelete:"cascade"}),
 setCode:varchar("set_code",{length:12}).notNull().references(()=>gameSets.code,{onDelete:"restrict"}),quantity:integer("quantity").notNull(),
 reason:text("reason").notNull(),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[check("booster_grant_quantity",sql`${t.quantity} between 1 and 100`)]);
export const playerBoosters=pgTable("player_boosters",{
 id:text("id").primaryKey(),userId:text("user_id").notNull().references(()=>user.id,{onDelete:"cascade"}),
 grantId:text("grant_id").notNull().references(()=>boosterGrants.id,{onDelete:"cascade"}),
 setCode:varchar("set_code",{length:12}).notNull().references(()=>gameSets.code,{onDelete:"restrict"}),
 openedAt:timestamp("opened_at",{withTimezone:true}),composition:jsonb("composition").$type<BoosterComposition>(),
 configRevision:integer("config_revision"),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[index("player_boosters_user_idx").on(t.userId,t.createdAt)]);
export const ownedCards=pgTable("owned_cards",{
 id:text("id").primaryKey(),userId:text("user_id").notNull().references(()=>user.id,{onDelete:"cascade"}),
 boosterId:text("booster_id").references(()=>playerBoosters.id,{onDelete:"cascade"}),
 acquisitionSource:text("acquisition_source").$type<"booster"|"event_reward">().notNull().default("booster"),rewardClaimId:text("reward_claim_id").references(()=>eventClaims.id,{onDelete:"cascade"}),
 cardId:text("card_id").notNull(),setCode:varchar("set_code",{length:12}).notNull().references(()=>gameSets.code,{onDelete:"restrict"}),
 position:integer("position").notNull(),snapshot:jsonb("snapshot").$type<OwnedCard>().notNull(),
 favorite:boolean("favorite").notNull().default(false),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[check("owned_cards_provenance",sql`(${t.acquisitionSource}='booster' AND ${t.boosterId} IS NOT NULL AND ${t.rewardClaimId} IS NULL) OR (${t.acquisitionSource}='event_reward' AND ${t.boosterId} IS NULL AND ${t.rewardClaimId} IS NOT NULL)`),uniqueIndex("owned_cards_reward_position_idx").on(t.rewardClaimId,t.position),uniqueIndex("owned_cards_booster_position").on(t.boosterId,t.position),index("owned_cards_user_idx").on(t.userId,t.createdAt),index("owned_cards_user_card_idx").on(t.userId,t.cardId),index("owned_cards_circulation_idx").on(t.setCode,t.cardId)]);
