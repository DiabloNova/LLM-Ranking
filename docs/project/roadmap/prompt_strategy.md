# JULES PROMPTING STRATEGY & GUARDRAILS[span_2](start_span)[span_2](end_span)
**A Comprehensive Guide for Managing AI-Assisted Development**[span_3](start_span)[span_3](end_span)

## 1. Understanding Jules's Limitations[span_4](start_span)[span_4](end_span)
To get production-ready code from Jules, you must build prompts that respect its inherent technical limitations:[span_5](start_span)[span_5](end_span)
*   **Context Window Decay:** If a session lasts too long or includes too many files, Jules will "forget" earlier instructions or architectural rules.[span_6](start_span)[span_6](end_span)
*   **Output Truncation:** Asking for too much code in a single prompt results in cut-off files or placeholder comments (e.g., `// ... rest of the code`).[span_7](start_span)[span_7](end_span)
*   **Cascading Errors:** If Jules makes a wrong assumption in step 1, steps 2 through 10 will be fundamentally flawed.[span_8](start_span)[span_8](end_span)
*   **The "Mock" Trap:** By default, AI assistants prefer to generate mock data or fake UI components to quickly satisfy a prompt. This creates massive technical debt.[span_9](start_span)[span_9](end_span)

## 2. The Micro-Session Framework[span_10](start_span)[span_10](end_span)
To mitigate these limitations, follow the **Micro-Session Framework**:[span_11](start_span)[span_11](end_span)
1.  **One Task = One Session:** Never combine database schema changes, API route creation, and UI development in the same prompt.[span_12](start_span)[span_12](end_span)
2.  **Clear Boundaries:** Explicitly list which files Jules is allowed to read and which it is allowed to write.[span_13](start_span)[span_13](end_span)
3.  **Immediate Verification:** After Jules completes a micro-task, test it locally. Only proceed to the next prompt if the code works. If it fails, use the same session to debug. Once fixed, close the session and start a new one for the next task.[span_14](start_span)[span_14](end_span)

## 3. The Perfect Prompt Formula[span_15](start_span)[span_15](end_span)
Every prompt given to Jules should follow this exact structure:[span_16](start_span)[span_16](end_span)

**[CONTEXT]**[span_17](start_span)[span_17](end_span)
*Briefly state what we are doing and reference the Master Rules.*[span_18](start_span)[span_18](end_span)
Example: "We are executing Session 1.1 of Phase 1. Please review `JULES_MASTER_RULES.md` before proceeding.[span_19](start_span)"[span_19](end_span)

**[OBJECTIVE]**[span_20](start_span)[span_20](end_span)
*State the exact, single outcome desired.*[span_21](start_span)[span_21](end_span)
Example: "Create the Drizzle ORM schema for the 'Workspaces' table.[span_22](start_span)"[span_22](end_span)

**[ALLOWED FILES]**[span_23](start_span)[span_23](end_span)
*List exactly what Jules can touch.*[span_24](start_span)[span_24](end_span)
Example:[span_25](start_span)[span_25](end_span)
"- Read: `database/schema/users.ts`[span_26](start_span)[span_26](end_span)
- Write: `database/schema/workspaces.ts`[span_27](start_span)"[span_27](end_span)

**[GUARDRAILS / CONSTRAINTS]**[span_28](start_span)[span_28](end_span)
*Block bad habits.*[span_29](start_span)[span_29](end_span)
Example: "Do not use mock data. Ensure strict TypeScript types. Use UUIDs for IDs.[span_30](start_span)"[span_30](end_span)

**[EXPECTED OUTPUT]**[span_31](start_span)[span_31](end_span)
*Tell Jules how to finish.*[span_32](start_span)[span_32](end_span)
Example: "Output the complete `workspaces.ts` file. Do not write any tests or UI components.[span_33](start_span)"[span_33](end_span)

---

## 4. Anti-Patterns (What NOT to do)[span_34](start_span)[span_34](end_span)
*   ❌ "Build the billing dashboard." *(Too vague, too large)*[span_35](start_span)[span_35](end_span)
*   ❌ "Fix the bugs in the auth flow." *(Requires reading too much context)*[span_36](start_span)[span_36](end_span)
*   ❌ "Create the UI for the audit report." *(Jules will generate mock data. Instead, build the DB first, then the API, then the UI).*[span_37](start_span)[span_37](end_span)
