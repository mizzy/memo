import {
  sqliteTable,
  text,
  type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";

export const vaults = sqliteTable("vaults", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const folders = sqliteTable("folders", {
  id: text("id").primaryKey(),
  vaultId: text("vault_id")
    .notNull()
    .references(() => vaults.id),
  parentId: text("parent_id").references(
    (): AnySQLiteColumn => folders.id
  ),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const memos = sqliteTable("memos", {
  id: text("id").primaryKey(),
  vaultId: text("vault_id")
    .notNull()
    .references(() => vaults.id),
  folderId: text("folder_id").references(() => folders.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
