import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import path from "path";

export async function runMigrations(databaseUrl?: string) {
  // MIGRATION_DATABASE_URL is the documented migration credential (see .env.example and
  // AGENTS.md): migrations routinely need DDL rights that the runtime role must not hold.
  // This runner previously read DATABASE_URL only, which silently executed schema changes
  // with the application's runtime credentials and contradicted that contract.
  // DATABASE_URL is still accepted as a fallback so single-credential local setups work.
  const connectionString =
    databaseUrl || process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "MIGRATION_DATABASE_URL (preferred) or DATABASE_URL must be set to run migrations."
    );
  }

  const pool = new Pool({
    connectionString,
    max: 1,
  });

  try {
    const db = drizzle(pool);
    const migrationsFolder = path.resolve(process.cwd(), "database/drizzle");
    console.log(`[Migration Runner] Executing Drizzle migrations from: ${migrationsFolder}`);

    // Store Drizzle migration metadata table in the 'public' schema to avoid CREATE SCHEMA permission issues on restricted roles
    await migrate(db, {
      migrationsFolder,
      migrationsTable: "__drizzle_migrations",
      migrationsSchema: "public",
    });

    console.log("[Migration Runner] All migrations applied successfully.");
  } finally {
    await pool.end();
  }
}

// Allow direct CLI execution
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[Migration Runner] Migration failed:", err);
      process.exit(1);
    });
}
