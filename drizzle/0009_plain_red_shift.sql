CREATE TABLE `chapter_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`chapter_id` integer NOT NULL,
	`paragraph_index` integer,
	`content` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `chapter_comment_chapter_idx` ON `chapter_comments` (`chapter_id`);--> statement-breakpoint
CREATE INDEX `chapter_comment_paragraph_idx` ON `chapter_comments` (`chapter_id`,`paragraph_index`);--> statement-breakpoint
CREATE INDEX `chapter_comment_user_idx` ON `chapter_comments` (`user_id`);