import { planetscale } from "./planetscale";
import {
  brandManagersTable,
  brandsTable,
  commentsTable,
  creatorManagersTable,
  creatorsTable,
  likesTable,
  postsTable,
  sharesTable,
} from "./schema";
import { faker } from "@faker-js/faker";
import { InferInsertModel } from "drizzle-orm";
import invariant from "tiny-invariant";

type BrandManager = InferInsertModel<typeof brandManagersTable>;
type Brand = InferInsertModel<typeof brandsTable>;
type Creator = InferInsertModel<typeof creatorsTable>;
type CreatorManager = InferInsertModel<typeof creatorManagersTable>;
type Post = InferInsertModel<typeof postsTable>;
type Like = InferInsertModel<typeof likesTable>;
type Share = InferInsertModel<typeof sharesTable>;
type Comment = InferInsertModel<typeof commentsTable>;

// Create arrays for each table
const brandManagers: BrandManager[] = [];
const brands: Brand[] = [];
const creators: Creator[] = [];
const creatorManagers: CreatorManager[] = [];
const posts: Post[] = [];
const likes: Like[] = [];
const shares: Share[] = [];
const comments: Comment[] = [];

// Seed data for brands table
for (let i = 0; i < 10; i++) {
  brands.push({
    brandId: faker.number.int(),
    name: faker.company.name(),
    commercialInfo: faker.company.catchPhrase(),
    description: faker.company.buzzPhrase(),
    logo: faker.image.url(),
    websiteUrl: faker.internet.url(),
  });
}

// Seed data for brandManagers table
for (let i = 0; i < 10; i++) {
  const brand = brands[i];

  invariant(brand?.brandId, "brandId should be defined");

  brandManagers.push({
    brandManagerId: faker.number.int(),
    clerkUserId: faker.string.uuid(),
    brandId: brand.brandId,
  });
}

// Seed data for creators table
for (let i = 0; i < 10; i++) {
  creators.push({
    creatorId: faker.number.int(),
    name: faker.person.fullName(),
    bio: faker.lorem.paragraph(),
    portfolio: faker.internet.url(),
    insights: faker.lorem.paragraph(),
    interests: faker.lorem.paragraph(),
  });
}

// Seed data for creatorManagers table
for (let i = 0; i < 10; i++) {
  const creator = creators[i];

  invariant(creator?.creatorId, "creatorId should be defined");

  creatorManagers.push({
    creatorManagerId: faker.number.int(),
    clerkUserId: faker.string.uuid(),
    creatorId: creator.creatorId,
  });
}

// Seed data for posts table
for (let i = 0; i < 10; i++) {
  const brand = faker.helpers.arrayElement(brands);
  const creator = faker.helpers.arrayElement(creators);
  const authorType = faker.helpers.arrayElement(["brand", "creator"]);

  posts.push({
    postId: faker.number.int(),
    content: faker.lorem.paragraph(),
    authorClerkUserId: faker.string.uuid(),
    ...(authorType === "brand"
      ? {
          brandId: brand.brandId,
        }
      : null),
    ...(authorType === "creator"
      ? {
          creatorId: creator.creatorId,
        }
      : null),
    mediaUrl: faker.image.url(),
    publishedAt: faker.date.past(),
  });
}

// Seed data for likes table
for (let i = 0; i < 10_000; i++) {
  const post = faker.helpers.arrayElement(posts);

  invariant(post.postId, "postId should be defined");

  likes.push({
    likeId: faker.number.int(),
    postId: post.postId,
    clerkUserId: faker.string.uuid(),
  });
}

// Seed data for shares table
for (let i = 0; i < 1_000; i++) {
  const post = faker.helpers.arrayElement(posts);

  invariant(post.postId, "postId should be defined");

  shares.push({
    shareId: faker.number.int(),
    postId: post.postId,
    clerkUserId: faker.string.uuid(),
  });
}

// Seed data for comments table
for (let i = 0; i < 5_000; i++) {
  const post = faker.helpers.arrayElement(posts);

  invariant(post.postId, "postId should be defined");

  comments.push({
    commentId: faker.number.int(),
    postId: post.postId,
    clerkUserId: faker.string.uuid(),
    text: faker.lorem.paragraph(),
  });
}

// Insert data into database tables
async function seed() {
  await planetscale.insert(brandManagersTable).values(brandManagers).execute();
  await planetscale.insert(brandsTable).values(brands).execute();
  await planetscale.insert(creatorsTable).values(creators).execute();
  await planetscale
    .insert(creatorManagersTable)
    .values(creatorManagers)
    .execute();
  await planetscale.insert(postsTable).values(posts).execute();
  await planetscale.insert(likesTable).values(likes).execute();
  await planetscale.insert(sharesTable).values(shares).execute();
  await planetscale.insert(commentsTable).values(comments).execute();
}

seed();
