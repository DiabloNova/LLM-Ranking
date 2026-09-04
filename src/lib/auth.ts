import { getSession } from "@/services/auth/session";

export interface AuthContextResult {
  userId: string;
  workspaceId: string;
}

/**
 * Resolves the user identity and workspace context strictly from the server-side
 * secure HTTP-only session cookies.
 *
 * @returns {Promise<AuthContextResult | null>} The authenticated user's IDs, or null if unauthenticated.
 */
export async function getAuthContext(): Promise<AuthContextResult | null> {
  const session = await getSession();

  if (!session || !session.user || session.status !== "authenticated") {
    return null;
  }

  return {
    userId: session.user.id,
    workspaceId: session.user.workspaceId,
  };
}
