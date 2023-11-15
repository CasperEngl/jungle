"use server";

import * as schema from "@/app/planetscale/schema";
import { InferSelectModel } from "drizzle-orm";
import invariant from "tiny-invariant";
import {
  parsePageToken,
  getPostsFromFollowedBrandsAndCreators,
  getUserInteractionsForPosts,
  calculateScore,
  generatePageToken,
  PaginatedResult,
} from "./planetscale";

export async function generateFeed(options: {
  userId?: string;
  pageToken: string | null;
  pageSize: number;
}) {
  invariant(options.userId, "User ID is required");

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

  let scoredPosts = posts
    .map((post) => ({
      ...post,
      score: calculateScore({
        post,
        interactions: interactions.get(post.postId) || {
          likes: 0,
          comments: 0,
          shares: 0,
        },
      }),
    }))
    .toSorted((a, b) => b.score - a.score);

  let nextPageToken: string | null = null;
  if (scoredPosts.length > options.pageSize) {
    const lastPostTimestamp =
      scoredPosts?.[options.pageSize - 1]?.createdAt.getTime();

    invariant(lastPostTimestamp, "Invalid last post timestamp");

    nextPageToken = generatePageToken(lastPostTimestamp);

    scoredPosts = scoredPosts.slice(0, options.pageSize);
  }

  return {
    items: scoredPosts,
    nextPageToken,
    previousPageToken: options.pageToken,
  } satisfies PaginatedResult<InferSelectModel<typeof schema.postsTable>>;
}
