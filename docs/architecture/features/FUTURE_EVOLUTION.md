# Future Platform Evolution Guidelines

This document outlines the clear technical roadmap for integrating Drizzle ORM, orchestrating background processing agents, and scaling to billions of daily tracked queries.

---

## 1. Drizzle ORM Schema Integration

To implement production SQL persistence, follow these steps to link the database schemas:

1. **Schema Translation**: Map the schemas defined in `database/schema/*.ts` into Drizzle syntax.
   Example `database/schema/brand.ts`:
   ```typescript
   import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";
   import { organizationsTable } from "./organization";

   export const brandsTable = pgTable("brands", {
     id: uuid("id").primaryKey().defaultRandom(),
     organizationId: uuid("organization_id").notNull().references(() => organizationsTable.id),
     name: text("name").notNull(),
     description: text("description"),
     website: text("website").notNull(),
     industry: text("industry"),
     country: text("country"),
     createdAt: timestamp("created_at").notNull().defaultNow(),
     updatedAt: timestamp("updated_at").notNull().defaultNow(),
     createdBy: text("created_by").notNull(),
     updatedBy: text("updated_by").notNull(),
     deletedAt: timestamp("deleted_at"),
     version: integer("version").notNull().default(1)
   });
   ```
2. **Repository Adapter**: Create a concrete `DrizzleBrandRepository` implementing the `IBrandRepository` interface defined in `src/features/ai-intelligence/repositories/interfaces.ts`.
3. **Dependency Injection**: Bind the Drizzle repositories in your application shell. The Services will require zero code changes since they depend strictly on the interface signatures!

---

## 2. Background Processing AI Agents

1. **Scheduled Triggers**: Use Cron jobs, BullMQ, or AWS EventBridge scheduler to trigger a scheduled worker at periodic intervals.
2. **Execution Runner**:
   - Query prompts from `IPromptRepository` with high priority.
   - Dispatch queries to LLM model providers (e.g. OpenAI SDK, Anthropic SDK).
   - Capture response text and pipe it directly to `ObservationService.processObservation(...)`.
3. **Event Dispatching**:
   - The process publishes an `AIObservationCapturedEvent`.
   - Dedicated micro-listeners pick up this event to update competitive analytics, rebuild citation networks, and feed marketing dashboards.

---

## 3. High Volume Analytics & Partitioning

1. **PostgreSQL Table Partitioning**: Implement monthly range partitioning on the `visibility_scores` and `ai_observations` tables based on the `executed_at`/`date` columns to ensure rapid query execution as datasets scale.
2. **Index Optimization**: Maintain compound index coverage on `(organization_id, brand_id, executed_at DESC)` to feed historical trend charts efficiently.
3. **NoSQL / Vector Storage Strategy**: For large semantic semantic graphs, sync Wikidata entity maps with specialized Graph/NoSQL databases (like Neo4j or Pinecone), while keeping relational metadata in PostgreSQL for transactional consistency.
