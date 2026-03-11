CREATE TABLE `chapter_unlocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`chapter_id` integer NOT NULL,
	`coins_spent` integer NOT NULL,
	`gifted_by_user_id` text,
	`unlocked_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unlock_user_chapter_unique_idx` ON `chapter_unlocks` (`user_id`,`chapter_id`);--> statement-breakpoint
CREATE INDEX `unlock_user_idx` ON `chapter_unlocks` (`user_id`);--> statement-breakpoint
CREATE INDEX `unlock_chapter_idx` ON `chapter_unlocks` (`chapter_id`);--> statement-breakpoint
CREATE TABLE `coin_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'success' NOT NULL,
	`reference` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `coin_transaction_user_idx` ON `coin_transactions` (`user_id`);--> statement-breakpoint
CREATE TABLE `gifts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sender_id` text NOT NULL,
	`writer_id` text NOT NULL,
	`novel_id` integer NOT NULL,
	`gift_type` text NOT NULL,
	`coins_spent` integer NOT NULL,
	`message` text,
	`created_at` integer,
	FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`writer_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`novel_id`) REFERENCES `novels`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `gift_writer_idx` ON `gifts` (`writer_id`);--> statement-breakpoint
CREATE INDEX `gift_novel_idx` ON `gifts` (`novel_id`);--> statement-breakpoint
CREATE TABLE `novel_passes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`novel_id` integer NOT NULL,
	`coins_spent` integer NOT NULL,
	`purchased_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`novel_id`) REFERENCES `novels`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pass_user_novel_unique_idx` ON `novel_passes` (`user_id`,`novel_id`);