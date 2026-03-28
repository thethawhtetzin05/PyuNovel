ALTER TABLE `novels` ADD `scheduled_hour` integer DEFAULT 18 NOT NULL;--> statement-breakpoint
ALTER TABLE `novels` DROP COLUMN `scheduled_start_date`;