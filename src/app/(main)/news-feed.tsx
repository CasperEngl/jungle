"use client";

import { generateFeed } from "@/app/planetscale/generate-feed";
import { PaginatedResult } from "@/app/planetscale/planetscale";
import { postsTable } from "@/app/planetscale/schema";
import { Container } from "@/components/Container";
import { FormattedDate } from "@/components/FormattedDate";
import { useUser } from "@clerk/nextjs";
import { InferSelectModel } from "drizzle-orm";
import Link from "next/link";
import { useState } from "react";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

export function NewsFeed(props: {
  initialFeed: PaginatedResult<InferSelectModel<typeof postsTable>>;
}) {
  const { user } = useUser();
  const [loadMoreRef, inView] = useInView();

  const loadMoreQuery = useInfiniteQuery({
    queryKey: ["loadMore", props.initialFeed.nextPageToken],
    initialPageParam: props.initialFeed.nextPageToken,
    queryFn: async ({ pageParam }) => {
      const newData = await generateFeed({
        pageSize: 10,
        pageToken: pageParam,
        userId: user?.id,
      });

      return newData;
    },
    getPreviousPageParam: (firstPage) => firstPage?.previousPageToken,
    getNextPageParam: (lastPage) => lastPage?.nextPageToken,
  });

  if (inView && !loadMoreQuery.isFetching) {
    loadMoreQuery.fetchNextPage();
  }

  return (
    <div className="divide-y divide-slate-100 sm:mt-4 lg:mt-8 lg:border-t lg:border-slate-100">
      {props.initialFeed.items.map((post) => (
        <PostEntry key={post.postId} post={post} />
      ))}

      <div ref={loadMoreRef}></div>
    </div>
  );
}

function PostEntry({ post }: { post: InferSelectModel<typeof postsTable> }) {
  let date = post.publishedAt ? new Date(post.publishedAt) : null;

  return (
    <article
      aria-labelledby={`post-${post.postId}-title`}
      className="py-10 sm:py-12"
    >
      <Container>
        <div className="flex flex-col items-start">
          {date ? (
            <FormattedDate
              date={date}
              className="order-first font-mono text-sm leading-7 text-slate-500"
            />
          ) : null}

          <p className="mt-1 text-base leading-7 text-slate-700">
            {post.content}
          </p>

          <div className="mt-4 flex items-center gap-4">
            <Link
              href={`/${post.postId}`}
              className="flex items-center text-sm font-bold leading-6 text-pink-500 hover:text-pink-700 active:text-pink-900"
              aria-label={`Read "${post.postId}"`}
            >
              Read more
            </Link>
          </div>
        </div>
      </Container>
    </article>
  );
}
