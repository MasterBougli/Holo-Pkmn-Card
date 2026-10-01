import { pgTable,varchar,text,jsonb,timestamp,primaryKey,integer } from "drizzle-orm/pg-core";
import { gameSets } from "@/lib/catalogue-schema";
import type { AppearanceOverrides } from "@/lib/card-appearance";
export const holoProfiles=pgTable("holo_profiles",{
 setCode:varchar("set_code",{length:12}).notNull().references(()=>gameSets.code,{onDelete:"cascade"}),
 cardId:text("card_id").notNull().default(""),
 settings:jsonb("settings").$type<AppearanceOverrides>().notNull().default({}),
 updatedBy:text("updated_by").notNull(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},table=>[primaryKey({columns:[table.setCode,table.cardId]})]);

export const holoProfileHistory=pgTable("holo_profile_history",{
 id:integer("id").primaryKey().generatedAlwaysAsIdentity(),
 setCode:varchar("set_code",{length:12}).notNull(),
 cardId:text("card_id").notNull().default(""),
 previous:jsonb("previous").$type<AppearanceOverrides|null>(),
 settings:jsonb("settings").$type<AppearanceOverrides>().notNull(),
 actorId:text("actor_id").notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
});
