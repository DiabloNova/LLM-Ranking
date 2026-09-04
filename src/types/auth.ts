export type UserRole = "super_admin" | "workspace_admin" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  workspaceId: string;
}

export interface Session {
  user: User | null;
  expiresAt: string | null;
  status: "authenticated" | "unauthenticated" | "loading";
}
