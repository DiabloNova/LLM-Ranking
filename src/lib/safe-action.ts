import { getAuthContext, AuthContextResult } from "@/lib/auth";

/**
 * Standard error thrown when a secure action is called without proper authentication
 * or tenant context.
 */
export class UnauthorizedActionError extends Error {
  constructor(message: string = "Unauthorized: Missing authentication or workspace context") {
    super(message);
    this.name = "UnauthorizedActionError";
  }
}

/**
 * A secure wrapper for Next.js Server Actions that require an input payload.
 * It enforces authentication and injects the resolved user and workspace context
 * before executing the provided business logic handler.
 *
 * @param handler The business logic to execute. Receives the input and the authentication context.
 * @returns A callable server action.
 */
export function secureServerAction<TInput, TOutput>(
  handler: (input: TInput, ctx: AuthContextResult) => Promise<TOutput>
): (input: TInput) => Promise<TOutput> {
  return async (input: TInput): Promise<TOutput> => {
    const ctx = await getAuthContext();

    if (!ctx || !ctx.userId || !ctx.workspaceId) {
      throw new UnauthorizedActionError();
    }

    return handler(input, ctx);
  };
}

/**
 * A secure wrapper for Next.js Server Actions that do not require any input.
 *
 * @param handler The business logic to execute. Receives only the authentication context.
 * @returns A callable server action.
 */
export function secureServerActionNoInput<TOutput>(
  handler: (ctx: AuthContextResult) => Promise<TOutput>
): () => Promise<TOutput> {
  return async (): Promise<TOutput> => {
    const ctx = await getAuthContext();

    if (!ctx || !ctx.userId || !ctx.workspaceId) {
      throw new UnauthorizedActionError();
    }

    return handler(ctx);
  };
}

/**
 * A secure wrapper for Next.js Route Handlers (API routes).
 * It enforces authentication and injects the context before executing the route logic.
 * If authentication fails, it immediately returns a 401 Unauthorized Response.
 *
 * @param handler The route handler business logic.
 * @returns A standard Next.js Route Handler function.
 */
export function secureRouteHandler<TContext = unknown>(
  handler: (request: Request, ctx: AuthContextResult, routeContext: TContext) => Promise<Response> | Response
) {
  return async (request: Request, routeContext: TContext): Promise<Response> => {
    const ctx = await getAuthContext();

    if (!ctx || !ctx.userId || !ctx.workspaceId) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Missing authentication or workspace context",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return handler(request, ctx, routeContext);
  };
}
