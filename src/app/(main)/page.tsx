"use server";


import { NewsFeed } from "@/app/(main)/news-feed";
import { generateFeed } from "@/app/planetscale/generate-feed";
import { createPaginatedSchema } from "@/app/planetscale/planetscale";
import { selectPostSchema } from "@/app/planetscale/planetscale.schema";
import { Container } from "@/components/Container";
import { auth } from "@clerk/nextjs";
import invariant from "tiny-invariant";
import { z } from "zod";

type NextSearchParams = {
  [key: string]: string | string[] | undefined;
};

export default async function Home(props: { searchParams: NextSearchParams }) {
  const { userId } = auth();

  invariant(userId, "No user ID found");

  let feed = await generateFeed({
    userId,
    pageSize: 10,
    nextPageToken: null,
  });

  // const stringifiedFeed = JSON.stringify(feed);
  // const parsedFeed = JSON.parse(stringifiedFeed);

  return (
    <div className="pb-12 pt-16 sm:pb-4 lg:pt-12">
      <Container>
        <h1 className="text-2xl font-bold leading-7 text-slate-900">News</h1>
      </Container>

      <NewsFeed initialFeed={feed} />
    </div>
  );
}
