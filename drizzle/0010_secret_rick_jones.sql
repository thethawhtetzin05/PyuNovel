CREATE TABLE `chapter_comment_votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`comment_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`vote` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`comment_id`) REFERENCES `chapter_comments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_comment_vote_idx` ON `chapter_comment_votes` (`comment_id`,`user_id`);--> statement-breakpoint
ALTER TABLE `chapter_comments` ADD `parent_comment_id` integer REFERENCES chapter_comments(id);--> statement-breakpoint
CREATE INDEX `chapter_comment_parent_idx` ON `chapter_comments` (`parent_comment_id`);