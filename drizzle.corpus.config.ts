import { defineConfig } from "drizzle-kit";

// corpus.sqlite: rebuilt from ingest output by scripts/seed-corpus.ts.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema/corpus.ts",
  out: "./drizzle/corpus",
  strict: true,
});
