import { sql } from "drizzle-orm";
import {
  bigint,
  datetime,
  index,
  mysqlEnum,
  mysqlTableCreator,
  text,
  varchar,
} from "drizzle-orm/mysql-core";

const mysqlTable = mysqlTableCreator((name) => {
  return `jungle_${name}`;
});

export const brandsTable = mysqlTable("brands", {
  brandId: bigint("brandId", { mode: "number" }).primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }),
  logo: varchar("logo", { length: 255 }),
  websiteUrl: varchar("websiteUrl", { length: 255 }),
  commercialInfo: varchar("commercialInfo", { length: 255 }),
  createdAt: datetime("createdAt")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updatedAt")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const brandManagersTable = mysqlTable("brandManagers", {
  brandManagerId: bigint("brandManagerId", { mode: "number" })
    .primaryKey()
    .autoincrement(),
  clerkUserId: varchar("clerkUserId", { length: 255 }).notNull(),
  brandId: bigint("brandId", { mode: "number" }).notNull(),
});

export const creatorManagersTable = mysqlTable("creatorManagers", {
  creatorManagerId: bigint("creatorManagerId", { mode: "number" })
    .primaryKey()
    .autoincrement(),
  clerkUserId: varchar("clerkUserId", { length: 255 }).notNull(),
  creatorId: bigint("creatorId", { mode: "number" }).notNull(),
});

export const creatorsTable = mysqlTable("creators", {
  creatorId: bigint("creatorId", { mode: "number" })
    .primaryKey()
    .autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  bio: varchar("bio", { length: 255 }),
  portfolio: varchar("portfolio", { length: 255 }),
  insights: varchar("insights", { length: 255 }),
  interests: varchar("interests", { length: 255 }),
  createdAt: datetime("createdAt")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updatedAt")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const postsTable = mysqlTable("posts", {
  postId: bigint("postId", { mode: "number" }).primaryKey().autoincrement(),
  authorClerkUserId: varchar("authorClerkUserId", { length: 255 }),
  brandId: bigint("brandId", { mode: "number" }),
  creatorId: bigint("creatorId", { mode: "number" }),
  content: varchar("content", { length: 255 }).notNull(),
  mediaUrl: varchar("mediaUrl", { length: 255 }),
  publishedAt: datetime("publishedAt"),
  createdAt: datetime("createdAt")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updatedAt")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const likesTable = mysqlTable(
  "likes",
  {
    likeId: bigint("likeId", { mode: "number" }).primaryKey().autoincrement(),
    postId: bigint("postId", { mode: "number" }).notNull(),
    clerkUserId: varchar("clerkUserId", { length: 255 }).notNull(),
    createdAt: datetime("createdAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    idxLikesPostId: index("idx_likes_post_id").on(table.postId),
    idxLikesUserId: index("idx_likes_user_id").on(table.clerkUserId),
  }),
);

export const commentsTable = mysqlTable(
  "comments",
  {
    commentId: bigint("comment_id", { mode: "number" })
      .primaryKey()
      .autoincrement(),
    postId: bigint("post_id", { mode: "number" }),
    parentCommentId: bigint("parent_comment_id", { mode: "number" }),
    clerkUserId: varchar("clerkUserId", { length: 255 }).notNull(),
    text: text("text").notNull(),
    createdAt: datetime("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    idxCommentsPostId: index("idx_comments_post_id").on(table.postId),
    idxCommentsParentCommentId: index("idx_comments_parent_comment_id").on(
      table.parentCommentId,
    ),
    idxCommentsUserId: index("idx_comments_user_id").on(table.clerkUserId),
  }),
);

export const sharesTable = mysqlTable(
  "shares",
  {
    shareId: bigint("share_id", { mode: "number" })
      .primaryKey()
      .autoincrement(),
    postId: bigint("post_id", { mode: "number" }).notNull(),
    clerkUserId: varchar("clerkUserId", { length: 255 }).notNull(),
    createdAt: datetime("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    idxSharesPostId: index("idx_shares_post_id").on(table.postId),
    idxSharesUserId: index("idx_shares_user_id").on(table.clerkUserId),
  }),
);

export const followsTable = mysqlTable(
  "follows",
  {
    followId: bigint("followId", { mode: "number" })
      .primaryKey()
      .autoincrement(),
    clerkUserId: varchar("clerkUserId", { length: 255 }).notNull(),
    followableId: bigint("followableId", { mode: "number" }).notNull(),
    followableType: mysqlEnum("followableType", ["brand", "creator"]).notNull(),
    createdAt: datetime("createdAt")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    idxFollowsUserType: index("idx_follows_user_type").on(
      table.clerkUserId,
      table.followableType,
    ),
    idxFollowsUserId: index("idx_follows_user_id").on(table.clerkUserId),
    idxFollowable: index("idx_followable").on(
      table.followableId,
      table.followableType,
    ),
  }),
);
