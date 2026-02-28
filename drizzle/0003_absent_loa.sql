CREATE TABLE `announcements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`icon` text,
	`is_active` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE INDEX `announcement_active_idx` ON `announcements` (`is_active`);--> statement-breakpoint
CREATE INDEX `announcement_created_at_idx` ON `announcements` (`created_at`);