ALTER TABLE `novels` ADD `is_scheduled_mode` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `novels` ADD `scheduled_start_date` integer;--> statement-breakpoint
ALTER TABLE `novels` ADD `chapters_per_day` integer DEFAULT 1 NOT NULL;