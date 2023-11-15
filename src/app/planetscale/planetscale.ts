import * as schema from "@/app/planetscale/schema";
import { serverEnv } from "@/env.server";
import { connect } from "@planetscale/database";
import {
  InferSelectModel,
  and,
  desc,
  eq,
  inArray,
  lt,
  or,
  sql,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/planetscale-serverless";
import ms from "ms";
import { z } from "zod";
import jwt from "jsonwebtoken";

export function hashPageToken(timestamp: number) {
  return jwt.sign({ timestamp }, serverEnv.JWT_SECRET);
}

export function parsePageToken(token: string) {
  const decoded = z
    .object({
      timestamp: z.number(),
    })
    .safeParse(jwt.verify(token, serverEnv.JWT_SECRET));

  if (decoded.success) {
    return decoded.data.timestamp;
  }

  return null;
}

// create the connection
const connection = connect({
  url: process.env.PLANETSCALE_URL,
});

export const planetscale = drizzle(connection, { schema });

type UserInteraction = {
  likes: number;
  comments: number;
  shares: number;
};

export function createPaginatedSchema<ItemType extends z.ZodTypeAny>(
  items: ItemType,
) {
  return z.object({
    items: z.array(items),
    nextPageToken: z.string().nullable(),
    previousPageToken: z.string().nullable(),
  });
}

export type PaginatedSchema<T extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof createPaginatedSchema<T>>
>;

function selectUserBrandManagers(userId: string) {
  return planetscale
    .select()
    .from(schema.brandManagersTable)
    .where(eq(schema.brandManagersTable.clerkUserId, userId));
}

function selectUserCreatorManagers(userId: string) {
  return planetscale
    .select()
    .from(schema.creatorManagersTable)
    .where(eq(schema.creatorManagersTable.clerkUserId, userId));
}

async function selectUserBrands(userId: string) {
  return planetscale
    .select()
    .from(schema.brandsTable)
    .where(eq(schema.brandsTable.brandId, selectUserBrandManagers(userId)));
}

async function selectUserCreators(userId: string) {
  return planetscale
    .select()
    .from(schema.creatorsTable)
    .where(
      eq(schema.creatorsTable.creatorId, selectUserCreatorManagers(userId)),
    );
}

const countSchema = z.coerce.string().default("0");

export async function getUserInteractionsForPosts(postIds: number[]) {
  const interactions = new Map<number, UserInteraction>();

  const promises = postIds.map(async (postId) => {
    const likesPromise = planetscale
      .select({
        count: sql`CAST(COUNT(${schema.likesTable.likeId}) as UNSIGNED)`,
      })
      .from(schema.likesTable)
      .where(eq(schema.likesTable.postId, postId))
      .execute();

    const commentsPromise = planetscale
      .select({
        count: sql`CAST(COUNT(${schema.commentsTable.commentId}) as UNSIGNED)`,
      })
      .from(schema.commentsTable)
      .where(eq(schema.commentsTable.postId, postId))
      .execute();

    const sharesPromise = planetscale
      .select({
        count: sql`CAST(COUNT(${schema.sharesTable.shareId}) as UNSIGNED)`,
      })
      .from(schema.sharesTable)
      .where(eq(schema.sharesTable.postId, postId))
      .execute();

    const [likes, comments, shares] = await Promise.allSettled([
      likesPromise,
      commentsPromise,
      sharesPromise,
    ]);

    interactions.set(postId, {
      likes:
        likes.status === "fulfilled"
          ? parseInt(countSchema.parse(likes.value[0]?.count), 10)
          : 0,
      comments:
        comments.status === "fulfilled"
          ? parseInt(countSchema.parse(comments.value[0]?.count), 10)
          : 0,
      shares:
        shares.status === "fulfilled"
          ? parseInt(countSchema.parse(shares.value[0]?.count), 10)
          : 0,
    });
  });

  await Promise.allSettled(promises);

  return interactions;
}

export function calculateScore(options: {
  post: InferSelectModel<typeof schema.postsTable>;
  interactions: UserInteraction;
}) {
  const recencyScore =
    (new Date().getTime() - options.post.createdAt.getTime()) / ms("1d");

  const engagementScore =
    options.interactions.likes +
    options.interactions.comments * 2 +
    options.interactions.shares * 3; // weighted score

  return engagementScore / (recencyScore + 1); // Adding 1 to avoid division by zero
}

export async function getPostsFromFollowedBrandsAndCreators(options: {
  userId: string;
  lastTimestamp: number;
  pageSize: number;
}) {
  // Fetch the user's follows
  const follows = await planetscale
    .select({
      followableId: schema.followsTable.followableId,
    })
    .from(schema.followsTable)
    .where(eq(schema.followsTable.clerkUserId, options.userId))
    .execute();

  // Extract the IDs of the followed brands and creators
  const followableIds = follows.map((follow) => follow.followableId);

  // Fetch the posts
  const posts = await planetscale
    .select()
    .from(schema.postsTable)
    .where(
      followableIds.length > 0
        ? or(
            inArray(schema.postsTable.brandId, followableIds),
            inArray(schema.postsTable.creatorId, followableIds),
          )
        : sql`1 = 0`,
    )
    .where(lt(schema.postsTable.createdAt, new Date(options.lastTimestamp))) // Only fetch posts created before the lastTimestamp
    .orderBy(desc(schema.postsTable.createdAt))
    .limit(options.pageSize)
    .execute();

  return posts;
}

// Function to follow an entity (brand or creator)
export async function followEntity(options: {
  clerkUserId: InferSelectModel<typeof schema.followsTable>["clerkUserId"];
  followableId: InferSelectModel<typeof schema.followsTable>["followableId"];
  followableType: InferSelectModel<
    typeof schema.followsTable
  >["followableType"];
}) {
  await planetscale
    .insert(schema.followsTable)
    .values({
      clerkUserId: options.clerkUserId,
      followableId: options.followableId,
      followableType: options.followableType,
    })
    .execute();
}

// Function to unfollow an entity (brand or creator)
export async function unfollowEntity(options: {
  clerkUserId: InferSelectModel<typeof schema.followsTable>["clerkUserId"];
  followableId: InferSelectModel<typeof schema.followsTable>["followableId"];
  followableType: InferSelectModel<
    typeof schema.followsTable
  >["followableType"];
}) {
  await planetscale
    .delete(schema.followsTable)
    .where(
      and(
        eq(schema.followsTable.clerkUserId, options.clerkUserId),
        eq(schema.followsTable.followableId, options.followableId),
        eq(schema.followsTable.followableType, options.followableType),
      ),
    )
    .execute();
}
