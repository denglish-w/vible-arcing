CREATE TABLE `parse_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`word_id` text NOT NULL,
	`book` text NOT NULL,
	`chapter` integer NOT NULL,
	`verse` integer NOT NULL,
	`surface` text NOT NULL,
	`edition` text NOT NULL,
	`answer` text NOT NULL,
	`source` text NOT NULL,
	`comparisons` text NOT NULL,
	`all_agreed` integer NOT NULL,
	`checked_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `parse_attempts_word_checked` ON `parse_attempts` (`word_id`,`checked_at`);