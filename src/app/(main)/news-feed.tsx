"use client";

import { generateFeed } from "@/app/planetscale/generate-feed";
import { PaginatedSchema } from "@/app/planetscale/planetscale";
import { selectPostSchema } from "@/app/planetscale/planetscale.schema";
import { postsTable } from "@/app/planetscale/schema";
import { Container } from "@/components/Container";
import { FormattedDate } from "@/components/FormattedDate";
import { useAuth, useUser } from "@clerk/nextjs";
import { useInfiniteQuery } from "@tanstack/react-query";
import { InferSelectModel } from "drizzle-orm";
import Link from "next/link";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import invariant from "tiny-invariant";

export function NewsFeed(props: {
  initialFeed: PaginatedSchema<typeof selectPostSchema>;
}) {
  const { userId } = useAuth();
  const [ref, inView] = useInView();

  const { fetchNextPage, ...feedQuery } = useInfiniteQuery({
    enabled: !!userId,
    queryKey: ["feed"],
    initialData: {
      pages: [props.initialFeed],
      pageParams: [props.initialFeed.nextPageToken],
    },
    initialPageParam: props.initialFeed.nextPageToken,
    queryFn: async ({ pageParam }) => {
      console.table({ pageParam });

      invariant(userId, "No user ID found");

      const newData = await generateFeed({
        pageSize: 10,
        nextPageToken: pageParam,
        userId: userId,
      });

      console.table({ newData });

      return newData;
    },
    getPreviousPageParam: (firstPage) => firstPage?.previousPageToken,
    getNextPageParam: (lastPage) => lastPage?.nextPageToken,
  });

  useEffect(() => {
    console.table({ inView });
    if (inView) {
      fetchNextPage();
    }
  }, [fetchNextPage, inView]);

  return (
    <div className="divide-y divide-slate-100 sm:mt-4 lg:mt-8 lg:border-t lg:border-slate-100">
      {feedQuery.data?.pages
        .flatMap((page) => page.items)
        .map((post) => <PostEntry key={post.postId} post={post} />)}

      <div ref={ref}></div>
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
