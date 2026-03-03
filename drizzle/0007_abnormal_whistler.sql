PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_novels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` text NOT NULL,
	`slug` text NOT NULL,
	`english_title` text NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`description` text,
	`cover_url` text,
	`tags` text NOT NULL,
	`status` text DEFAULT 'ongoing',
	`views` integer DEFAULT 0 NOT NULL,
	`price` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_novels`("id", "owner_id", "slug", "english_title", "title", "author", "description", "cover_url", "tags", "status", "views", "price", "created_at", "updated_at", "deleted_at") SELECT "id", "owner_id", "slug", "english_title", "title", "author", "description", "cover_url", "tags", "status", "views", "price", "created_at", "updated_at", "deleted_at" FROM `novels`;--> statement-breakpoint
DROP TABLE `novels`;--> statement-breakpoint
ALTER TABLE `__new_novels` RENAME TO `novels`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `novels_slug_unique` ON `novels` (`slug`);--> statement-breakpoint
CREATE INDEX `owner_idx` ON `novels` (`owner_id`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `novels` (`slug`);--> statement-breakpoint
CREATE INDEX `novels_created_at_idx` ON `novels` (`created_at`);--> statement-breakpoint
CREATE INDEX `novels_updated_at_idx` ON `novels` (`updated_at`);--> statement-breakpoint
CREATE INDEX `novels_views_idx` ON `novels` (`views`);