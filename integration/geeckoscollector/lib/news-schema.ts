import {pgTable,text,jsonb,integer,timestamp,index} from "drizzle-orm/pg-core";
import type {NewsContent} from "./news-types";
export const newsArticles=pgTable("news_articles",{
 id:text("id").primaryKey(),slug:text("slug").notNull().unique(),draft:jsonb("draft").$type<NewsContent>().notNull(),
 published:jsonb("published").$type<NewsContent>(),publishedAt:timestamp("published_at",{withTimezone:true}),
 scheduled:jsonb("scheduled").$type<NewsContent>(),scheduledAt:timestamp("scheduled_at",{withTimezone:true}),
 archivedAt:timestamp("archived_at",{withTimezone:true}),revision:integer("revision").notNull().default(1),
 createdBy:text("created_by").notNull(),updatedBy:text("updated_by").notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow()
},t=>[index("news_visible_idx").on(t.archivedAt,t.scheduledAt,t.publishedAt)]);
export const newsVersions=pgTable("news_versions",{
 id:text("id").primaryKey(),articleId:text("article_id").notNull().references(()=>newsArticles.id),revision:integer("revision").notNull(),
 content:jsonb("content").$type<NewsContent>().notNull(),action:text("action").notNull(),actorId:text("actor_id").notNull(),actorName:text("actor_name").notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow()
},t=>[index("news_versions_article_idx").on(t.articleId,t.revision)]);
export const newsMedia=pgTable("news_media",{
 id:text("id").primaryKey(),filename:text("filename").notNull(),name:text("name").notNull(),alt:text("alt").notNull(),width:integer("width").notNull(),height:integer("height").notNull(),
 createdBy:text("created_by").notNull(),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow()
});
