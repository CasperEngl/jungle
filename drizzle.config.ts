import { serverEnv } from "./src/env.server";
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/app/planetscale/schema.ts",
  out: "./drizzle",
  driver: "mysql2",
  dbCredentials: {
    connectionString: serverEnv.PLANETSCALE_URL,
  },
} satisfies Config;
