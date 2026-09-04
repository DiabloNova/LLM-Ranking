# Stage 0
Task: Establish a read-only evidence baseline. Do not modify any file, database, migration, schema, RLS policy, or application code.

Repository:
https://github.com/DiabloNova/seorchable

Steps:
1. Clone the repository into a fresh directory.
2. Record:
   git branch --show-current
   git rev-parse HEAD
   git status --porcelain
3. List all files under:
   database/drizzle/
   database/drizzle/meta/
   database/migrations/
4. Inspect:
   package.json
   src/core/database/migrator.ts
   database/schema/
5. Determine which directory is used by the migration runner.
6. Determine whether database/migrations is active, legacy, duplicated, or unresolved.
7. Do not connect to the existing Neon database.
8. If a disposable database is unavailable, stop and report BLOCKED.

Required output:
- Branch
- Commit SHA
- Working-tree status
- Complete migration file inventory
- Canonical migration path
- Competing or legacy migration paths
- Drizzle dependencies and scripts
- Evidence sources
- Risks
- Modified files: none
- Tests: none
- Final status: BASELINE VERIFIED or BLOCKED

# Stage 1
Task: Produce a complete read-only schema and migration reconciliation report. Do not modify any file or database.

Inspect:
- database/schema/
- database/drizzle/0000_reflective_loa.sql
- database/drizzle/meta/
- database/migrations/*.sql
- src/core/database/migrator.ts

Steps:
1. Extract every TypeScript table definition.
2. Extract every CREATE TABLE statement from database/drizzle.
3. Extract every CREATE TABLE statement from database/migrations.
4. Preserve every source occurrence; do not silently remove duplicates.
5. Canonicalize table names and produce one row per unique table.
6. For each table report:
   - Table name
   - TypeScript source
   - Drizzle SQL source
   - Legacy SQL source
   - Canonical status
   - Tenant column
   - RLS evidence
   - Foreign-key evidence
7. Reconcile the counts 32, 36, 52, 53, and 57.
8. Identify schema-only tables.
9. Identify migration-only tables.
10. Identify duplicate or conflicting table definitions.
11. Compare types, nullability, defaults, indexes, foreign keys, enums, checks, and tenant columns.

Required output:
- Complete table-by-table inventory
- Exact count reconciliation
- Exact mismatch list
- Unresolved items
- Evidence paths and line numbers
- Modified files: none

# Stage 2
Task: Determine the single authoritative migration strategy. Do not delete, rename, move, merge, or modify any migration file.

Inspect:
- database/drizzle/
- database/drizzle/meta/
- database/migrations/
- src/core/database/migrator.ts
- package.json
- drizzle configuration files, if present

Steps:
1. Confirm which directory src/core/database/migrator.ts executes.
2. Determine whether database/drizzle/0000_reflective_loa.sql creates the complete schema.
3. Determine whether database/migrations/0001 through 0014 are duplicated, incomplete, conflicting, or independent.
4. Compare table creation order and foreign-key dependencies.
5. Compare RLS definitions between both migration paths.
6. Determine whether both paths can safely exist in the repository.
7. Do not guess the intended architecture.
8. Do not modify files.

Required output:
- Recommended canonical migration directory
- Technical justification
- Complete duplicate/conflict matrix
- Dependency-order findings
- Required future cleanup actions
- Evidence paths and line numbers
- Final status: VERIFIED or BLOCKED

# Stage 3
Task: Align the canonical Drizzle schema with the verified table inventory on a separate branch.

Safety requirements:
1. Do not connect to the existing Neon database.
2. Do not use a non-disposable database.
3. Stop immediately if DATABASE_URL points to production or a database containing application tables.
4. Do not perform unrelated refactoring.

Allowed files:
- database/schema/index.ts
- database/schema/*.ts
- drizzle.config.*
- package.json, only for required Drizzle dependencies
- The repository lockfile

Steps:
1. Use the approved table inventory from Stage 1.
2. Define every canonical table in valid Drizzle ORM syntax.
3. Align columns, types, nullability, defaults, indexes, foreign keys, enums, and check constraints.
4. Explicitly document whether each table uses organization_id or tenant_id.
5. Do not infer missing columns.
6. Do not change repository behavior in this stage.
7. Run the schema generation command.
8. Review the generated SQL for destructive operations.
9. Stop if generated SQL drops data, drops tables, or changes columns destructively without explicit authorization.

Required output:
- Complete file diff
- Generated migration files
- Dependency changes
- Commands executed
- Exit status for every command
- Destructive-operation review
- Compatibility risks
- Final status: READY FOR REVIEW or BLOCKED

# Stage 4
Task: Execute the canonical migration against a disposable empty PostgreSQL database.

Safety requirements:
1. Never connect to the existing Neon database.
2. The target must be a new PostgreSQL container or a new Neon branch.
3. Record the exact target type and PostgreSQL version.
4. Stop if the database is not empty.

Before migration, execute and record:

SELECT current_database(), current_user, version();

SELECT count(*)
FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog', 'information_schema');

SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name;

Steps:
1. Prove that no application tables exist.
2. Run:
   npm run db:migrate
3. Record complete command output and exit status.
4. Inspect the migration tracking table.
5. List every created table.
6. Validate all foreign keys, indexes, enums, checks, and extensions.
7. Run the migration a second time.
8. Record whether the second run is idempotent.
9. Do not modify migration files during execution.

Required output:
- Exact database target
- Empty-database proof
- Migration command
- Complete migration output
- Exit status
- Migration tracking result
- Complete table inventory
- Foreign-key validation
- Second-run result
- Failures and unresolved risks

# Stage 5
Task: Verify runtime RLS and FORCE ROW LEVEL SECURITY behavior on the disposable database.

Prerequisite:
- Stage 4 must have completed successfully.
- Stop if the migration did not complete successfully.

Steps:
1. Query RLS state:

SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

2. Query all policies:

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

3. For every tenant-scoped table, report:
   - RLS enabled
   - FORCE RLS enabled
   - Policy name
   - Command
   - Roles
   - USING expression
   - WITH CHECK expression
4. Create two test tenants using the approved test procedure.
5. Verify that tenant A cannot read tenant B rows.
6. Verify that tenant A cannot insert rows for tenant B.
7. Verify that tenant A cannot update tenant B rows.
8. Verify that tenant A cannot delete tenant B rows.
9. Run tests with the application role and the table-owner role separately.
10. Do not add or modify RLS policies during this stage.

Required output:
- Complete RLS matrix
- Complete policy inventory
- Exact USING and WITH CHECK expressions
- FORCE RLS state
- Roles tested
- Isolation test commands
- Isolation test output
- Failed security cases
- Unresolved risks

# Stage 6
Task: Prevent unsafe use of db:push against production or non-empty databases.

Allowed files:
- package.json
- drizzle.config.*
- scripts/database/*
- Tests for the guard
- Documentation directly related to database commands

Steps:
1. Inspect the current db:push implementation.
2. Add a fail-closed guard that rejects:
   - NODE_ENV=production
   - Explicit production database markers
   - A database containing application tables
   - Missing ALLOW_DB_PUSH=true
3. Never log DATABASE_URL or credentials.
4. Keep db:migrate as the deployment migration command.
5. Permit db:push only when:
   - NODE_ENV is development or test
   - The database is disposable
   - The database is empty
   - ALLOW_DB_PUSH=true
6. Add positive and negative tests.

Required behavior:
- Production: exit 1
- Production-like DATABASE_URL: exit 1
- Non-empty database: exit 1
- Missing ALLOW_DB_PUSH: exit 1
- Development + empty database + ALLOW_DB_PUSH=true: allowed
- Secrets must never appear in logs

Required output:
- Exact diff
- Guard implementation
- Test commands
- Exit status for every test
- Security implications
- Modified files
- Remaining risks

# Stage 7
Task: Correct tenant-context and PostgreSQL connection behavior with minimal changes.

Allowed files:
- src/core/database/tenant-context/index.ts
- src/features/admin/infrastructure/persistence/postgres/index.ts
- Direct tests for these modules

Steps:
1. Record the complete diff of both files against the approved baseline commit.
2. Map every proposed change to a specific audit finding.
3. Ensure tenant-scoped queries fail when no tenant transaction is active.
4. Keep app.current_tenant_id transaction-local.
5. Ensure leased clients are released on success, failure, rollback, and nested transaction paths.
6. Preserve nested transaction and savepoint behavior, or add tests proving the replacement behavior.
7. Prevent implicit system-context creation.
8. Make production database failures fail closed.
9. Do not use in-memory stores or mock clients as successful production behavior.
10. Do not create or modify tables, migrations, or RLS policies.

Required tests:
- Missing tenant context
- Empty tenant ID
- Wrong tenant context
- Cross-tenant query rejection
- Rollback behavior
- Client release on success
- Client release on failure
- Nested context
- Savepoint rollback
- No session-variable leakage
- Production failure behavior

Required output:
- Complete diff for both files
- Reason for each change
- Backward-compatibility analysis
- Test commands and exit statuses
- Security implications
- Remaining risks

# Stage 8
Task: Replace verified mock or random data paths with real persistence incrementally.

Prerequisites:
- Use only tables and repositories verified in earlier stages.
- Do not modify any unverified path.
- Do not guess missing schema or repository behavior.

Allowed files:
- Only routes, services, repositories, and direct tests listed in the approved mock-data inventory
- No schema or migration files

Steps:
1. Locate every Math.random value, hardcoded response, and in-memory fallback.
2. Classify each occurrence as:
   - Intentionally static content
   - Database-backed feature
   - Blocked due to missing evidence
3. Preserve documentation and intentionally static marketing content.
4. Replace only verified database-backed mock paths.
5. Preserve authorization and tenant context.
6. Convert unsafe production fallbacks to fail-closed errors.
7. Add tests for success, authorization failure, tenant isolation, and database failure.
8. If any dependency is unclear, stop that item and report BLOCKED.

Required output for every changed path:
- Route or service
- Previous data source
- New repository or query
- Canonical table
- Tenant boundary
- Authorization behavior
- Error behavior
- Test command and exit status
- Remaining limitations

# Stage 9
Task: Execute the complete quality and security verification gate.

Do not report a check as passed without recording its command, output summary, and exit status.

Run:
1. The repository package installation command matching the lockfile.
2. npx tsc --noEmit
3. npm run lint
4. npm test, if available
5. npm run test:acquisition
6. All tenant-isolation tests
7. All RLS tests
8. npm run db:generate -- --check, if supported
9. npm run db:migrate against a disposable empty PostgreSQL database
10. Run the migration a second time
11. Run the db:push guard tests
12. Run the pre-commit checks, if configured
13. Run integration tests, if configured
14. Run schema reflection or schema validation checks, if configured

For every command record:
- Exact command
- Target environment
- Exit status
- Relevant stdout
- Relevant stderr
- Root cause of failure
- Whether the failure existed before remediation or was introduced by remediation

Do not modify code except to fix a directly observed failure from this stage. Any such fix must be separately reported with a diff.

# Stage 10
Task: Produce the final reconciliation report. Do not modify the repository or database.

The report must answer all eight reviewer objections:

1. Exact before/after RLS table diff.
2. Exact reconciliation of all table counts.
3. Complete inventory of database/migrations, database/drizzle, and database/drizzle/meta.
4. Evidence that the canonical migration executes successfully on a disposable empty PostgreSQL database.
5. Runtime RLS policy evidence, including policy names, roles, commands, USING expressions, WITH CHECK expressions, and FORCE RLS state.
6. Evidence that db:push is development-only and blocked against production or non-empty databases.
7. Complete diff for:
   src/features/admin/infrastructure/persistence/postgres/index.ts
   src/core/database/tenant-context/index.ts
8. Exact commands, outputs, and exit statuses for typecheck, lint, unit tests, integration tests, schema reflection, migration generation, migration execution, and pre-commit checks.

Rules:
- Every claim must include a source file, commit SHA, command output, or database query output.
- Mark unsupported claims as UNVERIFIED.
- Mark failed checks as FAILED.
- Do not use COMPLETE, PASSED, APPROVED, or PRESERVED without evidence.
- List unresolved risks separately.
- List every modified file.
- List every migration created or changed.
- List every database target used.
- List every test and its exit status.

The final status must be exactly one of:
APPROVAL READY
APPROVAL BLOCKED
REMEDIATION FAILED

