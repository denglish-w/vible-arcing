CREATE TABLE `attribution` (
	`seq` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`creator` text NOT NULL,
	`license` text NOT NULL,
	`license_url` text NOT NULL,
	`statement` text NOT NULL,
	`modified` integer NOT NULL,
	`modifications` text NOT NULL,
	`url` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `books` (
	`code` text PRIMARY KEY NOT NULL,
	`seq` integer NOT NULL,
	`chapter_count` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `books_seq_unique` ON `books` (`seq`);--> statement-breakpoint
CREATE TABLE `build` (
	`id` integer PRIMARY KEY NOT NULL,
	`format` integer NOT NULL,
	`edition` text NOT NULL,
	`macula_commit` text NOT NULL,
	`ingest_hash` text NOT NULL,
	CONSTRAINT "build_single_row" CHECK("build"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE `chapters` (
	`book` text NOT NULL,
	`chapter` integer NOT NULL,
	`word_count` integer NOT NULL,
	PRIMARY KEY(`book`, `chapter`),
	FOREIGN KEY (`book`) REFERENCES `books`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `words` (
	`id` text PRIMARY KEY NOT NULL,
	`book` text NOT NULL,
	`chapter` integer NOT NULL,
	`verse` integer NOT NULL,
	`seq` integer NOT NULL,
	`text` text NOT NULL,
	`after` text NOT NULL,
	`lemma` text NOT NULL,
	`gloss` text,
	`pos` text NOT NULL,
	`person` text,
	`number` text,
	`gender` text,
	`case` text,
	`tense` text,
	`voice` text,
	`mood` text,
	`degree` text
);
--> statement-breakpoint
CREATE INDEX `words_book_chapter_seq` ON `words` (`book`,`chapter`,`seq`);--> statement-breakpoint
CREATE UNIQUE INDEX `words_book_seq` ON `words` (`book`,`seq`);