CREATE TABLE `accounts` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` varchar(255),
	`name` varchar(255),
	`description` varchar(255),
	`created_at` datetime,
	`updated_at` datetime,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` varchar(255),
	`content` varchar(255),
	`created_at` datetime,
	`updated_at` datetime,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`)
);
