DROP INDEX `chapter_status_published_at_idx`;--> statement-breakpoint
CREATE INDEX `chapter_status_published_at_idx` ON `chapters` (`status`,`published_at`,`novel_id`,`id`,`title`,`sort_index`);