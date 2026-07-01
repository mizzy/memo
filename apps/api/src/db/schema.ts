import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const vaults = sqliteTable("vaults", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const memos = sqliteTable("memos", {
  id: text("id").primaryKey(),
  vaultId: text("vault_id")
    .notNull()
    .references(() => vaults.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
