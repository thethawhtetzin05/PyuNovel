ALTER TABLE `chapters` ADD `status` text DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE `chapters` ADD `published_at` integer;--> statement-breakpoint
CREATE INDEX `chapter_status_published_at_idx` ON `chapters` (`status`,`published_at`);