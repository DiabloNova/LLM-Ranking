"use server";

import { requireSession, createSession } from "@/services/auth/session";
import { requireWorkspaceMembership, requireRole } from "@/services/auth/authorization";
import { TenantContextManager } from "@/core/database/tenant-context";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, organizations, organizationMembers, organizationInvitations } from "../../../database/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID, createHash } from "crypto";
import { UserRole } from "@/types/auth";

export async function createWorkspaceAction(name: string) {
  const session = await requireSession();
  if (!session.user) throw new Error("Unauthorized");

  const orgId = randomUUID();
  const orgSlug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${randomUUID().slice(0,4)}`;

  await TenantContextManager.runWithSystemContext(session.user.id, "sys-create-workspace", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    const db = drizzle(client);

    await db.insert(organizations).values({
        id: orgId,
        name,
        slug: orgSlug
    });

    await db.insert(organizationMembers).values({
        organizationId: orgId,
        userId: session.user!.id,
        role: "workspace_admin"
    });
  });

  return { id: orgId, name, slug: orgSlug };
}

export async function listWorkspacesAction() {
  const session = await requireSession();
  if (!session.user) throw new Error("Unauthorized");

  return await TenantContextManager.runWithSystemContext(session.user.id, "sys-list-workspaces", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    const db = drizzle(client);

    const records = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        role: organizationMembers.role
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(eq(organizationMembers.userId, session.user!.id));

    return records;
  });
}

export async function inviteUserAction(workspaceId: string, email: string, role: string) {
  const session = await requireSession();
  if (!session.user) throw new Error("Unauthorized");
  await requireWorkspaceMembership(session.user.id, workspaceId);
  await requireRole("workspace_admin", workspaceId);

  return await TenantContextManager.runWithTenantContext(workspaceId, session.user.id, "ctx-invite-user", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    const db = drizzle(client);

    // Ensure user doesn't already exist in workspace
    const existing = await db
      .select({ id: organizationMembers.id })
      .from(organizationMembers)
      .innerJoin(users, eq(organizationMembers.userId, users.id))
      .where(
        and(
          eq(users.email, email),
          eq(organizationMembers.organizationId, workspaceId)
        )
      )
      .limit(1);

    if (existing.length > 0) throw new Error("User already exists in workspace.");

    const token = randomUUID();
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.insert(organizationInvitations).values({
        organizationId: workspaceId,
        email,
        role,
        tokenHash,
        expiresAt
    });

    return { success: true, token }; // Exposing for tests/dev, normally emailed
  });
}

export async function acceptInvitationAction(token: string) {
  const session = await requireSession();
  if (!session.user) throw new Error("Unauthorized");

  return await TenantContextManager.runWithSystemContext(session.user.id, "sys-accept-invitation", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    const db = drizzle(client);

    const tokenHash = createHash('sha256').update(token).digest('hex');

    // Find invitation
    const invites = await db
      .select()
      .from(organizationInvitations)
      .where(
        and(
          eq(organizationInvitations.tokenHash, tokenHash),
          eq(organizationInvitations.status, "pending")
        )
      )
      .limit(1);

    if (invites.length === 0) throw new Error("Invalid or expired invitation");

    const invite = invites[0];

    if (new Date(invite.expiresAt) < new Date()) {
      await db.update(organizationInvitations).set({ status: "expired" }).where(eq(organizationInvitations.id, invite.id));
      throw new Error("Invitation expired");
    }

    if (invite.email !== session.user!.email) {
      throw new Error("Invitation email does not match authenticated user");
    }

    // Accept it
    await db.insert(organizationMembers).values({
      organizationId: invite.organizationId,
      userId: session.user!.id,
      role: invite.role
    });

    await db.update(organizationInvitations).set({ status: "accepted" }).where(eq(organizationInvitations.id, invite.id));

    return { success: true, workspaceId: invite.organizationId };
  });
}

export async function removeMemberAction(workspaceId: string, memberId: string) {
  const session = await requireSession();
  if (!session.user) throw new Error("Unauthorized");
  await requireWorkspaceMembership(session.user.id, workspaceId);
  await requireRole("workspace_admin", workspaceId);

  return await TenantContextManager.runWithTenantContext(workspaceId, session.user.id, "ctx-remove-member", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    const db = drizzle(client);

    await db.delete(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, workspaceId),
          eq(organizationMembers.userId, memberId)
        )
      );

    return { success: true };
  });
}

export async function updateMemberRoleAction(workspaceId: string, memberId: string, role: string) {
  const session = await requireSession();
  if (!session.user) throw new Error("Unauthorized");
  await requireWorkspaceMembership(session.user.id, workspaceId);
  await requireRole("workspace_admin", workspaceId);

  return await TenantContextManager.runWithTenantContext(workspaceId, session.user.id, "ctx-update-role", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    const db = drizzle(client);

    await db.update(organizationMembers)
      .set({ role })
      .where(
        and(
          eq(organizationMembers.organizationId, workspaceId),
          eq(organizationMembers.userId, memberId)
        )
      );

    return { success: true };
  });
}

export async function switchWorkspaceAction(workspaceId: string) {
  const session = await requireSession();
  if (!session.user) throw new Error("Unauthorized");

  await requireWorkspaceMembership(session.user.id, workspaceId);

  // Re-fetch role for new workspace
  const newRole = await TenantContextManager.runWithSystemContext(session.user.id, "sys-switch-workspace", async () => {
    const client = TenantContextManager.getDbClient();
    if (!client) throw new Error("Failed to get DB client in system context");
    const db = drizzle(client);

    const records = await db
      .select({ role: organizationMembers.role })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, session.user!.id),
          eq(organizationMembers.organizationId, workspaceId)
        )
      )
      .limit(1);

    return records[0].role;
  });

  const updatedUser = {
    ...session.user,
    role: newRole as UserRole,
    workspaceId
  };

  await createSession(updatedUser);
  return { success: true, workspaceId };
}
