import { pgTable, text, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  connectionId: text("connection_id").notNull().unique(),
  isSharing: boolean("is_sharing").notNull().default(false)
});

export const insertConnectionSchema = createInsertSchema(connections).pick({
  connectionId: true,
  isSharing: true
});

export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type Connection = typeof connections.$inferSelect;

export interface TabInfo {
  id: number;
  url: string;
  title: string;
  favIconUrl?: string;
}

export interface TabSyncMessage {
  type: 'tabSync';
  tabs: TabInfo[];
  senderId: string;
}

export interface ConnectionMessage {
  type: 'connect' | 'register';
  connectionId: string;
  senderId?: string;
}
