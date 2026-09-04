import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || databaseUrl.trim() === "") {
  // A previous version of this file silently fell back to
  // "postgres://postgres:postgres@localhost:5432/postgres" when DATABASE_URL was unset.
  // That meant `drizzle-kit generate` / `push` could silently target a stray local
  // Postgres instance instead of failing loudly, risking a migration being generated
  // against (or pushed to) the wrong database. Fail fast instead.
  throw new Error(
    "drizzle.config.ts: DATABASE_URL is not set. Refusing to fall back to a local default " +
      "connection string; export DATABASE_URL before running any drizzle-kit command."
  );
}

export default defineConfig({
  schema: "./database/schema/index.ts",
  out: "./database/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
