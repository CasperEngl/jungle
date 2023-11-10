import * as schema from "@/app/planetscale/schema";
import { serverEnv } from "@/env.server";
import { connect } from "@planetscale/database";
import * as crypto from "crypto";
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
import "server-only";
import invariant from "tiny-invariant";

export function hashPageToken(timestamp: number) {
  return crypto
    .createHmac("sha256", serverEnv.APP_SALT)
    .update(timestamp.toString())
    .digest("hex");
}

export function parsePageToken(token: string) {
  try {
    const [hashedTimestamp, timestamp] = token.split(":");
    if (hashPageToken(parseInt(timestamp, 10)) === hashedTimestamp) {
      return parseInt(timestamp, 10);
    }
    return null;
  } catch {
    return null;
  }
}

export function generatePageToken(timestamp: number) {
  return `${hashPageToken(timestamp)}:${timestamp}`;
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

type PaginatedResult<T> = {
  items: T[];
  nextPageToken: string | null;
};

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

async function getUserInteractionsForPosts(postIds: number[]) {
  const interactions = new Map<number, UserInteraction>();

  const promises = postIds.map(async (postId) => {
    const likesPromise = planetscale
      .select({
        count: sql`CAST(COUNT(${schema.likesTable.likeId}) as int)`,
      })
      .from(schema.likesTable)
      .where(eq(schema.likesTable.postId, postId))
      .execute();

    const commentsPromise = planetscale
      .select({
        count: sql`CAST(COUNT(${schema.commentsTable.commentId}) as int)`,
      })
      .from(schema.commentsTable)
      .where(eq(schema.commentsTable.postId, postId))
      .execute();

    const sharesPromise = planetscale
      .select({
        count: sql`CAST(COUNT(${schema.sharesTable.shareId}) as int)`,
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
      likes: likes.status === "fulfilled" ? likes.value.length : 0,
      comments: comments.status === "fulfilled" ? comments.value.length : 0,
      shares: shares.status === "fulfilled" ? shares.value.length : 0,
    });
  });

  await Promise.allSettled(promises);

  return interactions;
}

function calculateScore(options: {
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

export async function generateFeed(options: {
  userId: string;
  pageToken: string | null;
  pageSize: number;
}) {
  const lastTimestamp = options.pageToken
    ? parsePageToken(options.pageToken)
    : Date.now();

  invariant(lastTimestamp, "Invalid page token");

  let posts = await getPostsFromFollowedBrandsAndCreators({
    userId: options.userId,
    lastTimestamp,
    pageSize: options.pageSize + 1,
  });
  const postIds = posts.map((post) => post.postId);
  const interactions = await getUserInteractionsForPosts(postIds);

  let scoredPosts = posts.map((post) => ({
    ...post,
    score: calculateScore({
      post,
      interactions: interactions.get(post.postId) || {
        likes: 0,
        comments: 0,
        shares: 0,
      },
    }),
  }));

  let sortedScoredPosts = scoredPosts.toSorted((a, b) => b.score - a.score);

  let nextPageToken: string | null = null;
  if (sortedScoredPosts.length > options.pageSize) {
    const lastPostTimestamp =
      sortedScoredPosts[options.pageSize - 1].createdAt.getTime();
    nextPageToken = generatePageToken(lastPostTimestamp);
    sortedScoredPosts = sortedScoredPosts.slice(0, options.pageSize);
  }

  return {
    items: sortedScoredPosts,
    nextPageToken,
  } satisfies PaginatedResult<InferSelectModel<typeof schema.postsTable>>;
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
