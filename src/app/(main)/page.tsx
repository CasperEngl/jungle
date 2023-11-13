"use server";

import Link from "next/link";

import { Container } from "@/components/Container";
import { FormattedDate } from "@/components/FormattedDate";
import { generateFeed, generatePageToken } from "@/app/planetscale/planetscale";
import { InferSelectModel } from "drizzle-orm";
import { auth } from "@clerk/nextjs";
import invariant from "tiny-invariant";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { LoadMore } from "@/app/planetscale/load-more-posts";
import { postsTable } from "@/app/planetscale/schema";

function PauseIcon(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg aria-hidden="true" viewBox="0 0 10 10" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.496 0a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5H2.68a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5H1.496Zm5.82 0a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5H8.5a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5H7.316Z"
      />
    </svg>
  );
}

function PlayIcon(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg aria-hidden="true" viewBox="0 0 10 10" {...props}>
      <path d="M8.25 4.567a.5.5 0 0 1 0 .866l-7.5 4.33A.5.5 0 0 1 0 9.33V.67A.5.5 0 0 1 .75.237l7.5 4.33Z" />
    </svg>
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

type NextSearchParams = {
  [key: string]: string | string[] | undefined;
};

export default async function Home(props: { searchParams: NextSearchParams }) {
  const { userId } = auth();

  invariant(userId, "No user ID found");

  let feed = await generateFeed({
    userId,
    pageSize: 10,
    pageToken: null,
  });

  async function loadMorePosts() {
    "use server";

    let { pageToken } = props.searchParams;

    if (!userId) return;

    const url = new URL(headers().get("referer")!);

    url.searchParams.set(
      "pageToken",
      pageToken?.toString() ??
        generatePageToken(new Date(feed.items.at(-1)?.createdAt!).getTime()),
    );

    redirect(url.toString());
  }

  return (
    <div className="pb-12 pt-16 sm:pb-4 lg:pt-12">
      <Container>
        <h1 className="text-2xl font-bold leading-7 text-slate-900">News</h1>
      </Container>
      <div className="divide-y divide-slate-100 sm:mt-4 lg:mt-8 lg:border-t lg:border-slate-100">
        {feed.items.map((post) => (
          <PostEntry key={post.postId} post={post} />
        ))}

        {/* <LoadMore onLoad={loadMorePosts} /> */}
      </div>
    </div>
  );
}
