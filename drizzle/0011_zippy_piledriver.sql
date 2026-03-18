CREATE TABLE `rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`hits` integer DEFAULT 0 NOT NULL,
	`reset_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `chapters` ADD `updated_at` integer;--> statement-breakpoint
CREATE INDEX `chapter_updated_at_idx` ON `chapters` (`updated_at`);