CREATE TABLE `collections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`novel_id` integer NOT NULL,
	`last_read_chapter_id` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`novel_id`) REFERENCES `novels`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`last_read_chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_novel_unique_idx` ON `collections` (`user_id`,`novel_id`);--> statement-breakpoint
CREATE INDEX `collection_user_idx` ON `collections` (`user_id`);--> statement-breakpoint
CREATE INDEX `collection_novel_idx` ON `collections` (`novel_id`);