"use server";

import { selectPostSchema } from "@/app/planetscale/planetscale.schema";
import invariant from "tiny-invariant";
import {
  PaginatedSchema,
  calculateScore,
  createPaginatedSchema,
  getPostsFromFollowedBrandsAndCreators,
  getUserInteractionsForPosts,
  hashPageToken,
  parsePageToken,
} from "./planetscale";
import { z } from "zod";

export async function generateFeed(options: {
  userId?: string;
  nextPageToken: string | null;
  pageSize: number;
}) {
  invariant(options.userId, "User ID is required");

  const lastTimestamp = options.nextPageToken
    ? parsePageToken(options.nextPageToken)
    : Date.now();

  invariant(lastTimestamp, "Invalid page token");

  let posts = await getPostsFromFollowedBrandsAndCreators({
    userId: options.userId,
    lastTimestamp,
    pageSize: options.pageSize,
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

  console.table({
    scoredPosts: scoredPosts.length,
    pageSize: options.pageSize,
    pageToken: options.nextPageToken,
  });

  let nextPageToken: string | null = null;

  if (scoredPosts.length > options.pageSize) {
    const lastPostTimestamp =
      scoredPosts?.[options.pageSize - 1]?.createdAt.getTime();

    invariant(lastPostTimestamp, "Invalid last post timestamp");

    nextPageToken = hashPageToken(lastPostTimestamp);

    scoredPosts = scoredPosts.slice(0, options.pageSize);
  }

  return createPaginatedSchema(
    selectPostSchema.extend({
      score: z.number(),
    }),
  ).parse({
    items: scoredPosts,
    nextPageToken,
    previousPageToken: options.nextPageToken,
  });
}
