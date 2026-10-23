import { defineConfig } from "drizzle-kit";

// app.sqlite: users' saved work, migrated by scripts/migrate-app.ts.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema/app.ts",
  out: "./drizzle/app",
  strict: true,
});
