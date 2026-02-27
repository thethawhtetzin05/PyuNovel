CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`novel_id` integer NOT NULL,
	`rating` integer NOT NULL,
	`comment` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`novel_id`) REFERENCES `novels`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `review_user_novel_unique_idx` ON `reviews` (`user_id`,`novel_id`);--> statement-breakpoint
CREATE INDEX `review_novel_idx` ON `reviews` (`novel_id`);--> statement-breakpoint
CREATE TABLE `volumes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`novel_id` integer NOT NULL,
	`name` text NOT NULL,
	`sort_index` real NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`novel_id`) REFERENCES `novels`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `volume_novel_sort_idx` ON `volumes` (`novel_id`,`sort_index`);--> statement-breakpoint
ALTER TABLE `chapters` ADD `volume_id` integer REFERENCES volumes(id);--> statement-breakpoint
CREATE INDEX `chapter_volume_idx` ON `chapters` (`volume_id`);--> statement-breakpoint
CREATE INDEX `novels_created_at_idx` ON `novels` (`created_at`);--> statement-breakpoint
CREATE INDEX `novels_updated_at_idx` ON `novels` (`updated_at`);--> statement-breakpoint
CREATE INDEX `novels_views_idx` ON `novels` (`views`);