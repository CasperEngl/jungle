import {
  brandManagersTable,
  brandsTable,
  commentsTable,
  creatorsTable,
  likesTable,
  postsTable,
  sharesTable,
} from "@/app/planetscale/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const insertBrandManager = createInsertSchema(brandManagersTable);
export const selectBrandManagerSchema = createSelectSchema(brandManagersTable);
export const insertPost = createInsertSchema(postsTable);
export const selectPostSchema = createSelectSchema(postsTable);
export const insertLike = createInsertSchema(likesTable);
export const selectLikeSchema = createSelectSchema(likesTable);
export const insertBrand = createInsertSchema(brandsTable);
export const selectBrandSchema = createSelectSchema(brandsTable);
export const insertShare = createInsertSchema(sharesTable);
export const selectShareSchema = createSelectSchema(sharesTable);
export const insertComment = createInsertSchema(commentsTable);
export const selectCommentSchema = createSelectSchema(commentsTable);
export const insertCreator = createInsertSchema(creatorsTable);
export const selectCreatorSchema = createSelectSchema(creatorsTable);
