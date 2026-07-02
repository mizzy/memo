CREATE TABLE `folders` (
	`id` text PRIMARY KEY NOT NULL,
	`vault_id` text NOT NULL,
	`parent_id` text,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`vault_id`) REFERENCES `vaults`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parent_id`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `memos` ADD `folder_id` text REFERENCES folders(id);