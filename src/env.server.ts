import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const serverEnv = createEnv({
  server: {
    APP_SALT: z.string().min(1),
    CLERK_SECRET_KEY: z.string().min(1),
    PLANETSCALE_URL: z.string().url(),
    JWT_SECRET: z.string().min(1),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
