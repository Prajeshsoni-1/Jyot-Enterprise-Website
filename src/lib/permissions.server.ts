import {
  calculateEffectivePermissions,
  hasPermission,
  normalizeRole,
  type AccountStatus,
  type PermissionAction,
  type Role,
  type UserPermissionOverrides,
} from "./permissions";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface EffectiveAdminUser {
  userId: string;
  email: string | null;
  name: string | null;
  role: Role;
  status: AccountStatus;
  isOwner: boolean;
  isTeam: boolean;
  overrides: UserPermissionOverrides;
  effectivePermissions: Set<string>;
  rawRoles: string[];
}

export interface SecurityContext {
  supabase: any;
  userId: string;
  claims?: Record<string, unknown>;
}

/**
 * Loads and resolves the effective permissions and status for the current user.
 */
export async function getEffectiveUser(ctx: SecurityContext): Promise<EffectiveAdminUser> {
  const userId = ctx.userId;
  const email = ((ctx.claims as any)?.email as string | undefined) ?? null;

  // 1. Fetch database user_roles
  const { data: roleRows, error: rolesError } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (rolesError) {
    throw new Error("Could not verify your access. Please sign in again.");
  }

  const rawRoles = (roleRows ?? []).map((r: { role: string }) => r.role);
  const isTeam = rawRoles.length > 0;

  // 2. Fetch user auth metadata via supabaseAdmin
  let appMeta: any = {};
  let userMeta: any = {};
  try {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authUser?.user) {
      appMeta = authUser.user.app_metadata ?? {};
      userMeta = authUser.user.user_metadata ?? {};
    }
  } catch {
    // fallback to claims if service role is restricted
    appMeta = (ctx.claims as any)?.app_metadata ?? {};
    userMeta = (ctx.claims as any)?.user_metadata ?? {};
  }

  // 3. Resolve role & status
  let explicitRole = (appMeta.role as string | undefined)?.toLowerCase();
  // If appMeta has no role, but user has 'admin' in user_roles:
  // If this is the very first or sole admin in user_roles, treat them as owner
  if (!explicitRole && rawRoles.includes("admin")) {
    const { count } = await ctx.supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if (count === 1) {
      explicitRole = "owner";
    } else {
      explicitRole = "admin";
    }
  }

  const role: Role = normalizeRole(explicitRole || rawRoles[0]);
  const status: AccountStatus = appMeta.status === "inactive" ? "inactive" : "active";
  const isOwner = role === "owner";

  // 4. Resolve permission overrides
  const overrides: UserPermissionOverrides = {};
  if (appMeta.permissions && typeof appMeta.permissions === "object") {
    Object.assign(overrides, appMeta.permissions);
  }

  // Optional database user_permissions table check
  try {
    const { data: dbPerms } = await ctx.supabase
      .from("user_permissions")
      .select("module, action, granted")
      .eq("user_id", userId);
    if (dbPerms && Array.isArray(dbPerms)) {
      for (const p of dbPerms) {
        overrides[`${p.module}.${p.action}`] = p.granted;
      }
    }
  } catch {
    // If user_permissions table is not yet migrated, appMeta overrides are used
  }

  const effectivePermissions = calculateEffectivePermissions(role, overrides);

  // 5. Fetch name from profile
  const { data: profile } = await ctx.supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  const name = profile?.full_name ?? (userMeta.full_name as string) ?? (email ? email.split("@")[0] : null);

  return {
    userId,
    email,
    name,
    role,
    status,
    isOwner,
    isTeam,
    overrides,
    effectivePermissions,
    rawRoles,
  };
}

/**
 * Enforces server-side authorization: throws 403 error if the user is inactive,
 * not on the team, or lacks the specified permission.
 */
export async function requirePermission(
  ctx: SecurityContext,
  module: string,
  action: PermissionAction,
): Promise<EffectiveAdminUser> {
  const user = await getEffectiveUser(ctx);

  if (!user.isTeam) {
    throw new Error("Forbidden: your account is not part of the Jyot Enterprise team.");
  }

  if (user.status === "inactive") {
    throw new Error("Forbidden: your account has been deactivated. Please contact an administrator.");
  }

  if (user.isOwner) {
    return user; // Owner has full unrestricted clearance
  }

  if (!hasPermission(user.effectivePermissions, module, action)) {
    throw new Error(`Forbidden: you do not have permission to ${action} ${module}.`);
  }

  return user;
}

/**
 * Enforces Owner Safety and Role Hierarchy guards.
 */
export async function protectOwnerSafety(
  caller: EffectiveAdminUser,
  targetUserId: string,
  newRole?: Role,
  newStatus?: AccountStatus,
  isDelete = false,
) {
  // 1. Fetch target user's current role and status
  let targetRole: Role = "staff";
  let targetStatus: AccountStatus = "active";

  try {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
    if (authUser?.user) {
      const appMeta: any = authUser.user.app_metadata ?? {};
      targetRole = normalizeRole(appMeta.role as string | undefined);
      targetStatus = appMeta.status === "inactive" ? "inactive" : "active";
    }
  } catch {
    // check database user_roles
    const { data: targetRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", targetUserId);
    if (targetRoles && targetRoles.some((r: any) => r.role === "admin")) {
      targetRole = "admin";
    }
  }

  const isTargetOwner = targetRole === "owner";

  // 2. Count total owners
  let totalOwners = 0;
  try {
    const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    totalOwners = (allUsers?.users ?? []).filter((u) => {
      const r = ((u.app_metadata as any)?.role as string | undefined)?.toLowerCase();
      return r === "owner";
    }).length;
  } catch {
    totalOwners = 1;
  }
  if (totalOwners === 0 && isTargetOwner) {
    totalOwners = 1;
  }

  // 3. Last Owner Protection: Cannot delete, demote, or deactivate the last Owner
  if (isTargetOwner) {
    if (isDelete && totalOwners <= 1) {
      throw new Error("Safety Protection: Cannot delete the last remaining Owner account.");
    }
    if (newRole && newRole !== "owner" && totalOwners <= 1) {
      throw new Error("Safety Protection: Cannot demote the last remaining Owner. Promote another Owner first.");
    }
    if (newStatus === "inactive" && totalOwners <= 1) {
      throw new Error("Safety Protection: Cannot deactivate the last remaining Owner account.");
    }

    // Only an Owner can modify an Owner account
    if (!caller.isOwner) {
      throw new Error("Forbidden: only an Owner can modify an Owner account.");
    }
  }

  // 4. Promotion to Owner: Only an Owner can promote someone to Owner
  if (newRole === "owner" && !caller.isOwner) {
    throw new Error("Forbidden: only an Owner can assign the Owner role.");
  }

  // 5. Self-demotion / privilege escalation checks
  if (caller.userId === targetUserId) {
    if (isDelete) {
      throw new Error("Safety Protection: You cannot delete your own active account.");
    }
    if (newStatus === "inactive") {
      throw new Error("Safety Protection: You cannot deactivate your own account.");
    }
    if (caller.isOwner && newRole && newRole !== "owner" && totalOwners <= 1) {
      throw new Error("Safety Protection: You are the last Owner and cannot demote yourself.");
    }
  }
}

/**
 * Logs security and administrative actions to the audit log.
 */
export async function logAdminAudit(
  ctx: SecurityContext,
  targetUserId: string | null,
  action: string,
  detail: any = {},
) {
  try {
    const email = ((ctx.claims as any)?.email as string | undefined) ?? null;
    await ctx.supabase.from("cms_audit_log").insert({
      actor_id: ctx.userId,
      actor_email: email,
      module: "admin_users",
      entity_id: targetUserId,
      entity_slug: targetUserId,
      entity_title: (detail.targetEmail as string) ?? (detail.name as string) ?? "User Account",
      action,
      detail,
    });
  } catch (err) {
    console.error("[AuditLog Error]", err);
  }
}
