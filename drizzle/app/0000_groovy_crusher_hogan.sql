CREATE TABLE `analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`book` text NOT NULL,
	`start_word_id` text NOT NULL,
	`end_word_id` text NOT NULL,
	`passage_label` text NOT NULL,
	`edition` text NOT NULL,
	`doc_version` integer NOT NULL,
	`doc` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `diagrams` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`book` text NOT NULL,
	`start_word_id` text NOT NULL,
	`end_word_id` text NOT NULL,
	`passage_label` text NOT NULL,
	`edition` text NOT NULL,
	`doc_version` integer NOT NULL,
	`doc` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
