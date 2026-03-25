CREATE INDEX `chapter_novel_id_idx` ON `chapters` (`novel_id`);--> statement-breakpoint
CREATE INDEX `collection_user_novel_idx` ON `collections` (`user_id`,`novel_id`);--> statement-breakpoint
CREATE INDEX `novels_author_idx` ON `novels` (`author`);--> statement-breakpoint
CREATE INDEX `novels_status_idx` ON `novels` (`status`);