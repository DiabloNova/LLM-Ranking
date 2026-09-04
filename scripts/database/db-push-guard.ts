import { Client } from "pg";

export interface GuardEnvironment {
  NODE_ENV?: string;
  APP_ENV?: string;
  ENVIRONMENT?: string;
  DATABASE_ENV?: string;
  DB_ENV?: string;
  ALLOW_DB_PUSH?: string;
  DISPOSABLE_DB?: string;
  DATABASE_URL?: string;
}

export interface GuardOptions {
  env?: GuardEnvironment;
  clientFactory?: (connectionString: string) => {
    connect: () => Promise<void>;
    query: (text: string) => Promise<{ rows: any[] }>;
    end: () => Promise<void>;
  };
}

export function sanitizeErrorMessage(msg: string, dbUrl?: string): string {
  let sanitized = msg;
  if (dbUrl) {
    sanitized = sanitized.split(dbUrl).join("[REDACTED_DATABASE_URL]");
  }
  // Redact any postgres:// or postgresql:// URLs
  sanitized = sanitized.replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, "[REDACTED_DATABASE_URL]");
  // Redact password parameters or user:pass patterns
  sanitized = sanitized.replace(/:[^:@\s]+@/g, ":[REDACTED_PASSWORD]@");
  return sanitized;
}

export async function validateDbPushGuard(options: GuardOptions = {}): Promise<{ allowed: boolean; reason: string }> {
  const env = options.env || process.env;
  const nodeEnv = env.NODE_ENV;

  // 1. Environment Validation: Must be development or test
  if (!nodeEnv || (nodeEnv !== "development" && nodeEnv !== "test")) {
    return {
      allowed: false,
      reason: `db:push blocked: NODE_ENV must be explicitly set to 'development' or 'test'. Current: '${nodeEnv || "undefined"}'.`,
    };
  }

  // 2. Explicit Production Markers
  const prodMarkers = [
    { key: "NODE_ENV", val: env.NODE_ENV },
    { key: "APP_ENV", val: env.APP_ENV },
    { key: "ENVIRONMENT", val: env.ENVIRONMENT },
    { key: "DATABASE_ENV", val: env.DATABASE_ENV },
    { key: "DB_ENV", val: env.DB_ENV },
  ];

  for (const marker of prodMarkers) {
    if (marker.val && marker.val.toLowerCase() === "production") {
      return {
        allowed: false,
        reason: `db:push blocked: production marker detected in environment (${marker.key}=${marker.val}).`,
      };
    }
  }

  // 3. DATABASE_URL presence
  const dbUrl = env.DATABASE_URL;
  if (!dbUrl || dbUrl.trim() === "") {
    return {
      allowed: false,
      reason: "db:push blocked: DATABASE_URL environment variable is missing or empty.",
    };
  }

  // 4. Production-Like DATABASE_URL Detection
  const lowerUrl = dbUrl.toLowerCase();
  const prodKeywords = [
    "neon.tech",
    "prod",
    "production",
    "aws.rds.amazonaws.com",
    "cockroachlabs.cloud",
    "supabase.co",
    "fly.dev",
    "railway.app",
    "render.com",
  ];

  for (const keyword of prodKeywords) {
    if (lowerUrl.includes(keyword)) {
      return {
        allowed: false,
        reason: `db:push blocked: DATABASE_URL appears to point to a production or managed cloud cluster (detected '${keyword}').`,
      };
    }
  }

  // 5. Require Explicit Authorization ALLOW_DB_PUSH=true
  if (env.ALLOW_DB_PUSH !== "true") {
    return {
      allowed: false,
      reason: `db:push blocked: ALLOW_DB_PUSH=true is required. Current: '${env.ALLOW_DB_PUSH || "undefined"}'.`,
    };
  }

  // 6. Require Explicit Disposable Database Condition
  if (env.DISPOSABLE_DB !== "true") {
    return {
      allowed: false,
      reason: `db:push blocked: DISPOSABLE_DB=true is required to prove the target database is explicitly disposable. Current: '${env.DISPOSABLE_DB || "undefined"}'.`,
    };
  }

  // 7. Verify Database Emptiness via catalog query
  try {
    const client = options.clientFactory
      ? options.clientFactory(dbUrl)
      : new Client({ connectionString: dbUrl, connectionTimeoutMillis: 5000 });

    await client.connect();
    try {
      const queryText = `
        SELECT count(*)::int as table_count
        FROM information_schema.tables
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      `;
      const res = await client.query(queryText);
      const tableCount = res.rows[0]?.table_count ?? 0;

      if (tableCount > 0) {
        return {
          allowed: false,
          reason: `db:push blocked: database is not empty (contains ${tableCount} existing table(s)). db:push is permitted only on empty disposable databases.`,
        };
      }
    } finally {
      await client.end();
    }
  } catch (err: any) {
    const rawError = err?.message || String(err);
    const safeError = sanitizeErrorMessage(rawError, dbUrl);
    return {
      allowed: false,
      reason: `db:push blocked: unable to inspect database catalog to verify emptiness. Details: ${safeError}`,
    };
  }

  // 8. Final Authorization Predicate Passed
  return {
    allowed: true,
    reason: "All db:push safety checks passed successfully (development/test environment, disposable target, empty database, explicit ALLOW_DB_PUSH=true).",
  };
}

// CLI Execution Wrapper
if (require.main === module) {
  validateDbPushGuard()
    .then((result) => {
      if (!result.allowed) {
        console.error(result.reason);
        process.exit(1);
      }
      console.log(result.reason);
      process.exit(0);
    })
    .catch((err) => {
      console.error(`db:push blocked: unexpected guard error. Details: ${sanitizeErrorMessage(err?.message || String(err))}`);
      process.exit(1);
    });
}
