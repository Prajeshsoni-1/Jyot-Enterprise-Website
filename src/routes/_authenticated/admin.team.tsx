"use client";

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Edit2,
  KeyRound,
  Lock,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  X,
} from "lucide-react";
import {
  listAccounts,
  createAdminUser,
  updateAdminUser,
  setUserPermissions,
  setUserStatus,
  triggerPasswordReset,
  deleteAdminUser,
} from "@/lib/admin.functions";
import { fetchClientAccounts } from "@/lib/admin-client";
import {
  PERMISSION_MODULES,
  ROLE_DEFAULTS,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ALL_PERMISSION_KEYS,
  type Role,
  type AccountStatus,
  type PermissionCategory,
} from "@/lib/permissions";
import {
  Panel,
  Loading,
  ErrorState,
  formatDate,
  ConfirmModal,
  PageHeader,
  StatCard,
} from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/team")({
  component: TeamManagementPage,
});

const ROLE_OPTIONS: Role[] = ["owner", "admin", "manager", "staff"];

const CATEGORY_TITLES: Record<PermissionCategory, string> = {
  CONTENT: "Content & Publishing",
  BUSINESS: "Business Operations & CRM",
  WEBSITE: "Website & Search Optimization",
  SYSTEM: "System Administration & Security",
};

interface AccountItem {
  id: string;
  email: string | null;
  name: string;
  role: Role;
  status: AccountStatus;
  createdAt: string;
  lastSignInAt: string | null;
  overrides: Record<string, boolean>;
  effectivePermissions: string[];
  permissionCount: number;
  hasOverrides: boolean;
  isSelf: boolean;
  isOwner: boolean;
}

function RoleBadge({ role }: { role: Role }) {
  const styles: Record<Role, string> = {
    owner: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    admin: "bg-primary/15 text-primary border-primary/30",
    manager: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    staff: "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${styles[role] || styles.staff}`}
    >
      {role === "owner" ? (
        <ShieldAlert className="h-3 w-3" />
      ) : role === "admin" ? (
        <ShieldCheck className="h-3 w-3" />
      ) : (
        <Shield className="h-3 w-3" />
      )}
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function StatusBadge({ status }: { status: AccountStatus }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/15 px-2.5 py-0.5 text-xs font-semibold text-destructive">
      <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
      Inactive
    </span>
  );
}

function TeamManagementPage() {
  const queryClient = useQueryClient();
  const fetchAccounts = useServerFn(listAccounts);
  const createUserFn = useServerFn(createAdminUser);
  const updateUserFn = useServerFn(updateAdminUser);
  const setPermsFn = useServerFn(setUserPermissions);
  const setStatusFn = useServerFn(setUserStatus);
  const resetPasswordFn = useServerFn(triggerPasswordReset);
  const deleteUserFn = useServerFn(deleteAdminUser);

  // Filter and search state
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Notifications / feedback banner
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AccountItem | null>(null);
  const [permissionUser, setPermissionUser] = useState<AccountItem | null>(null);
  const [inviteModal, setInviteModal] = useState<{
    email: string;
    name: string;
    link: string | null;
  } | null>(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "accounts"],
    queryFn: async () => {
      try {
        const res = await fetchAccounts({ data: undefined });
        if (res && Array.isArray((res as any).accounts) && (res as any).accounts.length > 0) {
          return res;
        }
      } catch (err) {
        console.warn("[admin.team] Server listAccounts failed, falling back to direct Supabase accounts fetch:", err);
      }
      return fetchClientAccounts();
    },
    retry: false,
  });

  const accounts: AccountItem[] = Array.isArray(data?.accounts)
    ? (data.accounts as unknown as AccountItem[])
    : [];
  const isCallerOwner = Boolean(data?.isCallerOwner);

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (selectedRole !== "all" && acc.role !== selectedRole) return false;
      if (selectedStatus !== "all" && acc.status !== selectedStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = acc.name.toLowerCase().includes(q);
        const matchesEmail = acc.email?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail) return false;
      }
      return true;
    });
  }, [accounts, selectedRole, selectedStatus, search]);

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
  };

  /* ------------------------------ Action Handlers ---------------------------- */

  const handleToggleStatus = (acc: AccountItem) => {
    const nextStatus: AccountStatus = acc.status === "active" ? "inactive" : "active";

    if (acc.isOwner && acc.status === "active" && (data?.ownerCount ?? 1) <= 1) {
      setFeedback({
        tone: "error",
        text: "Safety Restriction: The system's primary/last Owner cannot be deactivated.",
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: nextStatus === "active" ? "Activate User" : "Deactivate User",
      message:
        nextStatus === "active"
          ? `Are you sure you want to activate ${acc.name || acc.email}? They will regain access to Jyot Enterprise Admin desk immediately.`
          : `Are you sure you want to deactivate ${acc.name || acc.email}? They will immediately be locked out of the Jyot Enterprise Admin desk.`,
      confirmLabel: nextStatus === "active" ? "Activate Account" : "Deactivate Account",
      isDestructive: nextStatus === "inactive",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          await setStatusFn({ data: { userId: acc.id, status: nextStatus } });
          setFeedback({
            tone: "ok",
            text: `Account for ${acc.name || acc.email} has been ${nextStatus === "active" ? "activated" : "deactivated"}.`,
          });
          refreshData();
        } catch (err: any) {
          setFeedback({ tone: "error", text: err.message || "Could not update status." });
        }
      },
    });
  };

  const handleTriggerReset = (acc: AccountItem) => {
    setConfirmDialog({
      isOpen: true,
      title: "Generate Password Recovery",
      message: `Generate a secure password reset link for ${acc.name || acc.email}? You will be shown the secure recovery link to copy.`,
      confirmLabel: "Generate Link",
      isDestructive: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await resetPasswordFn({ data: { userId: acc.id } });
          if (res.ok && res.resetLink) {
            setInviteModal({
              email: acc.email || "",
              name: acc.name,
              link: res.resetLink,
            });
          } else {
            setFeedback({
              tone: "ok",
              text: `Password recovery link requested for ${acc.name || acc.email}.`,
            });
          }
          refreshData();
        } catch (err: any) {
          setFeedback({
            tone: "error",
            text: err.message || "Could not generate password reset.",
          });
        }
      },
    });
  };

  const handleDeleteUser = (acc: AccountItem) => {
    if (acc.isOwner && (data?.ownerCount ?? 1) <= 1) {
      setFeedback({
        tone: "error",
        text: "Safety Restriction: The last Owner account cannot be deleted.",
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Delete User Account",
      message: `Are you sure you want to permanently delete ${acc.name || acc.email}? This will remove their credentials, profile, and permissions permanently. This action cannot be undone.`,
      confirmLabel: "Delete User Permanently",
      isDestructive: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          await deleteUserFn({ data: { userId: acc.id } });
          setFeedback({
            tone: "ok",
            text: `User account for ${acc.name || acc.email} was permanently deleted.`,
          });
          refreshData();
        } catch (err: any) {
          setFeedback({ tone: "error", text: err.message || "Could not delete user." });
        }
      },
    });
  };

  if (isLoading) return <Loading label="Loading accounts & permissions…" />;
  if (isError || !data) {
    return (
      <ErrorState
        message="Only authorized administrators can access Team & Permission Management."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <PageHeader
        title="Team & User Management"
        description="Manage admin users, 4-tier role hierarchy (Owner, Admin, Manager, Staff), and granular module permissions."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Enterprise RBAC
          </span>
        }
        actions={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-2xs hover:bg-primary/90 transition shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </button>
        }
      />

      {/* Feedback Banner */}
      {feedback ? (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 rounded-2xl p-4 text-sm transition-all animate-in fade-in ${
            feedback.tone === "ok"
              ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20"
              : "bg-destructive/10 text-destructive border border-destructive/20"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.tone === "ok" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
            )}
            <p className="font-medium">{feedback.text}</p>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-muted-foreground hover:text-ink transition p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Users"
          value={accounts.length}
          hint="Registered admin accounts"
          icon={<Users className="h-5 w-5 text-primary" />}
        />
        <StatCard
          label="Active Accounts"
          value={accounts.filter((a) => a.status === "active").length}
          hint="Operational status active"
          icon={<UserCheck className="h-5 w-5 text-emerald-600" />}
        />
        <StatCard
          label="Administrators"
          value={data.adminCount}
          hint="Admin role privileges"
          icon={<ShieldCheck className="h-5 w-5 text-primary" />}
        />
        <StatCard
          label="System Owners"
          value={data.ownerCount}
          hint="Full enterprise sovereignty"
          icon={<ShieldAlert className="h-5 w-5 text-amber-600" />}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-2xl border border-border bg-background p-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search team members by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-full border border-border bg-secondary/30 text-ink placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-primary"
          >
            <option value="all">All Roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Administrator</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-primary"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {(search || selectedRole !== "all" || selectedStatus !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedRole("all");
                setSelectedStatus("all");
              }}
              className="rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-ink hover:bg-secondary transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Accounts Table */}
      <Panel>
        {filteredAccounts.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-semibold text-ink">No matching accounts found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try adjusting your search or role filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="border-b border-border text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3.5 font-semibold">User</th>
                  <th className="px-3 py-3.5 font-semibold">Role</th>
                  <th className="px-3 py-3.5 font-semibold">Status</th>
                  <th className="px-3 py-3.5 font-semibold">Permissions</th>
                  <th className="px-3 py-3.5 font-semibold">Last Active</th>
                  <th className="px-3 py-3.5 font-semibold">Created</th>
                  <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-secondary/20 transition">
                    {/* User Profile */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {acc.name?.slice(0, 2).toUpperCase() || "JE"}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-ink leading-tight">{acc.name}</p>
                            {acc.isSelf && (
                              <span className="rounded-full bg-secondary px-1.5 py-0.2 text-[0.65rem] font-bold text-muted-foreground">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                            {acc.email || "No email"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-3 py-3.5">
                      <RoleBadge role={acc.role} />
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3.5">
                      <StatusBadge status={acc.status} />
                    </td>

                    {/* Permissions Summary Button */}
                    <td className="px-3 py-3.5">
                      <button
                        onClick={() => setPermissionUser(acc)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-ink hover:border-primary/50 hover:bg-secondary/40 transition"
                      >
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {acc.role === "owner" ? "Full Access (All)" : `${acc.permissionCount} rules`}
                        </span>
                        {acc.hasOverrides && (
                          <span className="rounded-full bg-purple-500/15 px-1.5 py-0.2 text-[0.65rem] font-bold text-purple-700 dark:text-purple-400">
                            Custom
                          </span>
                        )}
                      </button>
                    </td>

                    {/* Last Sign-in */}
                    <td className="px-3 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(acc.lastSignInAt)}
                    </td>

                    {/* Created */}
                    <td className="px-3 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(acc.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Permissions Editor */}
                        <button
                          type="button"
                          onClick={() => setPermissionUser(acc)}
                          title="Configure Granular Permissions"
                          className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-ink transition"
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </button>

                        {/* Edit User Info */}
                        <button
                          type="button"
                          onClick={() => setEditUser(acc)}
                          title="Edit User Details & Role"
                          className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-ink transition"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        {/* Reset Password */}
                        <button
                          type="button"
                          onClick={() => handleTriggerReset(acc)}
                          title="Generate Password Recovery Link"
                          className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-ink transition"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </button>

                        {/* Activate/Deactivate Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(acc)}
                          title={acc.status === "active" ? "Deactivate Account" : "Activate Account"}
                          className={`rounded-full p-2 transition ${
                            acc.status === "active"
                              ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              : "text-emerald-600 hover:bg-emerald-500/10"
                          }`}
                        >
                          {acc.status === "active" ? (
                            <UserX className="h-3.5 w-3.5" />
                          ) : (
                            <UserCheck className="h-3.5 w-3.5" />
                          )}
                        </button>

                        {/* Delete User */}
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(acc)}
                          title="Delete Account"
                          disabled={acc.isOwner && (data?.ownerCount ?? 1) <= 1}
                          className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground gap-2">
          <p>
            Showing <span className="font-semibold text-ink">{filteredAccounts.length}</span> of{" "}
            <span className="font-semibold text-ink">{accounts.length}</span> team accounts.
          </p>
          <p className="flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
            <span>
              Primary Owner protection is active. The last Owner account cannot be deleted or
              deactivated.
            </span>
          </p>
        </div>
      </Panel>

      {/* ---------------------------- Create User Modal ---------------------------- */}
      {isCreateOpen && (
        <CreateUserModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          isCallerOwner={isCallerOwner}
          onCreated={(result) => {
            setIsCreateOpen(false);
            refreshData();
            if (result.inviteLink) {
              setInviteModal({
                email: result.email,
                name: result.name,
                link: result.inviteLink,
              });
            } else {
              setFeedback({
                tone: "ok",
                text: `Account created for ${result.name} (${result.email}).`,
              });
            }
          }}
          onError={(msg) => setFeedback({ tone: "error", text: msg })}
        />
      )}

      {/* ----------------------------- Edit User Modal ----------------------------- */}
      {editUser && (
        <EditUserModal
          user={editUser}
          isOpen={Boolean(editUser)}
          isCallerOwner={isCallerOwner}
          ownerCount={data.ownerCount}
          onClose={() => setEditUser(null)}
          onSaved={() => {
            setEditUser(null);
            refreshData();
            setFeedback({ tone: "ok", text: `Updated account details for ${editUser.name}.` });
          }}
          onError={(msg) => setFeedback({ tone: "error", text: msg })}
        />
      )}

      {/* ------------------------ Permission Editor Modal -------------------------- */}
      {permissionUser && (
        <PermissionEditorModal
          user={permissionUser}
          isOpen={Boolean(permissionUser)}
          onClose={() => setPermissionUser(null)}
          onSaved={() => {
            setPermissionUser(null);
            refreshData();
            setFeedback({
              tone: "ok",
              text: `Updated granular permissions for ${permissionUser.name}.`,
            });
          }}
          onError={(msg) => setFeedback({ tone: "error", text: msg })}
        />
      )}

      {/* ----------------------- Password Invite / Link Modal ---------------------- */}
      {inviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">Account Setup & Password Link</h3>
                <p className="text-xs text-muted-foreground">User: {inviteModal.email}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              The user account was created securely. No plaintext password is saved or exposed in the UI.
              Share this secure, one-time link with the user so they can set their own password:
            </p>

            <div className="rounded-xl border border-border bg-secondary/40 p-3">
              <p className="text-[0.7rem] font-mono text-ink break-all select-all">
                {inviteModal.link || "Invitation sent directly via email."}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {inviteModal.link && (
                <button
                  type="button"
                  onClick={async () => {
                    if (inviteModal.link) {
                      await navigator.clipboard.writeText(inviteModal.link);
                      setFeedback({ tone: "ok", text: "Secure link copied to clipboard!" });
                      setInviteModal(null);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Link & Done
                </button>
              )}
              <button
                type="button"
                onClick={() => setInviteModal(null)}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------- Universal Confirm Modal ------------------------- */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        isDestructive={confirmDialog.isDestructive}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

/* ========================================================================= */
/* CREATE USER MODAL                                                         */
/* ========================================================================= */

function CreateUserModal({
  isOpen,
  onClose,
  isCallerOwner,
  onCreated,
  onError,
}: {
  isOpen: boolean;
  onClose: () => void;
  isCallerOwner: boolean;
  onCreated: (result: { email: string; name: string; inviteLink: string | null }) => void;
  onError: (msg: string) => void;
}) {
  const createUserFn = useServerFn(createAdminUser);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [status, setStatus] = useState<AccountStatus>("active");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Customize initial permissions toggle
  const [customizePerms, setCustomizePerms] = useState(false);
  const [permissionOverrides, setPermissionOverrides] = useState<Record<string, boolean>>({});

  // When role changes, recalculate default permissions
  const effectiveRoleDefaults = useMemo(() => {
    return new Set(ROLE_DEFAULTS[role] ?? []);
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      onError("Please provide both full name and email.");
      return;
    }

    setBusy(true);
    try {
      const res = await createUserFn({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          status,
          password: password.trim() ? password.trim() : undefined,
          permissions: customizePerms ? permissionOverrides : undefined,
        },
      });

      if (res.ok) {
        onCreated({
          name: name.trim(),
          email: email.trim(),
          inviteLink: res.inviteLink,
        });
      }
    } catch (err: any) {
      onError(err.message || "Failed to create user account.");
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-background p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">Create Team Account</h3>
              <p className="text-xs text-muted-foreground">Add a new admin, manager or staff member</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-ink transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Full Name */}
          <div>
            <label className="block font-semibold text-ink mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Priyesh Patel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-secondary/30 px-3 py-2 text-xs text-ink focus:outline-none focus:border-primary"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-semibold text-ink mb-1">Corporate Email Address *</label>
            <input
              type="email"
              required
              placeholder="e.g. priyesh@jyotenterprise.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-secondary/30 px-3 py-2 text-xs text-ink focus:outline-none focus:border-primary"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block font-semibold text-ink mb-1">Role & Authority Tier *</label>
            <select
              value={role}
              onChange={(e) => {
                const newRole = e.target.value as Role;
                setRole(newRole);
              }}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-ink focus:outline-none focus:border-primary"
            >
              {isCallerOwner && (
                <option value="owner">OWNER — Full access, user & permission control</option>
              )}
              <option value="admin">ADMIN — Broad operational & content administration</option>
              <option value="manager">MANAGER — Leads, bookings & operational modules</option>
              <option value="staff">STAFF — Assigned tasks & daily workflows</option>
            </select>
            <p className="mt-1 text-[0.7rem] text-muted-foreground">
              {ROLE_DESCRIPTIONS[role]}
            </p>
          </div>

          {/* Account Status */}
          <div>
            <label className="block font-semibold text-ink mb-1">Account Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AccountStatus)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-ink focus:outline-none focus:border-primary"
            >
              <option value="active">Active (Immediate desk access)</option>
              <option value="inactive">Inactive (Suspended / Deactivated)</option>
            </select>
          </div>

          {/* Temporary Password (Optional) */}
          <div>
            <label className="block font-semibold text-ink mb-1">
              Temporary Password <span className="font-normal text-muted-foreground">(Optional)</span>
            </label>
            <input
              type="password"
              placeholder="Leave blank to generate secure password setup link"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-secondary/30 px-3 py-2 text-xs text-ink focus:outline-none focus:border-primary"
            />
            <p className="mt-1 text-[0.7rem] text-muted-foreground">
              If left blank, a secure one-time password recovery link will be generated for the user to set their own password.
            </p>
          </div>

          {/* Granular Permission Customization Toggle */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-ink">Customize Initial Permissions</p>
                <p className="text-[0.7rem] text-muted-foreground">
                  By default, grants standard permissions for {ROLE_LABELS[role]}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomizePerms(!customizePerms)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  customizePerms
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-ink hover:bg-secondary"
                }`}
              >
                {customizePerms ? "Customizing" : "Customize"}
              </button>
            </div>

            {customizePerms && (
              <div className="mt-3 max-h-48 overflow-y-auto space-y-3 rounded-xl border border-border bg-secondary/20 p-3">
                {PERMISSION_MODULES.map((mod) => (
                  <div key={mod.id} className="space-y-1">
                    <p className="font-bold text-[0.7rem] text-ink">{mod.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {mod.actions.map((act) => {
                        const key = `${mod.id}.${act.action}`;
                        const isGranted =
                          permissionOverrides[key] !== undefined
                            ? permissionOverrides[key]
                            : effectiveRoleDefaults.has(key);

                        return (
                          <label
                            key={act.action}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-background px-2 py-1 text-[0.65rem] cursor-pointer hover:border-primary/40"
                          >
                            <input
                              type="checkbox"
                              checked={isGranted}
                              onChange={(e) => {
                                setPermissionOverrides((prev) => ({
                                  ...prev,
                                  [key]: e.target.checked,
                                }));
                              }}
                              className="rounded border-border text-primary"
                            />
                            <span>{act.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-full border border-border px-4 py-2 font-semibold text-ink hover:bg-secondary disabled:opacity-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {busy ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* EDIT USER MODAL                                                           */
/* ========================================================================= */

function EditUserModal({
  user,
  isOpen,
  isCallerOwner,
  ownerCount,
  onClose,
  onSaved,
  onError,
}: {
  user: AccountItem;
  isOpen: boolean;
  isCallerOwner: boolean;
  ownerCount: number;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const updateUserFn = useServerFn(updateAdminUser);

  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<Role>(user.role);
  const [status, setStatus] = useState<AccountStatus>(user.status);
  const [busy, setBusy] = useState(false);

  const isLastOwner = user.isOwner && ownerCount <= 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLastOwner && role !== "owner") {
      onError("Safety Restriction: Cannot demote the last system Owner.");
      return;
    }
    if (isLastOwner && status === "inactive") {
      onError("Safety Restriction: Cannot deactivate the last system Owner.");
      return;
    }

    setBusy(true);
    try {
      const res = await updateUserFn({
        data: {
          userId: user.id,
          name: name.trim(),
          role,
          status,
        },
      });
      if (res.ok) {
        onSaved();
      }
    } catch (err: any) {
      onError(err.message || "Failed to update user account.");
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Edit2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">Edit User Account</h3>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-ink transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Full Name */}
          <div>
            <label className="block font-semibold text-ink mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-secondary/30 px-3 py-2 text-xs text-ink focus:outline-none focus:border-primary"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block font-semibold text-ink mb-1">Role</label>
            <select
              value={role}
              disabled={isLastOwner}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-ink focus:outline-none focus:border-primary disabled:opacity-50"
            >
              {isCallerOwner && <option value="owner">OWNER</option>}
              <option value="admin">ADMIN</option>
              <option value="manager">MANAGER</option>
              <option value="staff">STAFF</option>
            </select>
            {isLastOwner ? (
              <p className="mt-1 text-[0.7rem] text-amber-600 font-medium">
                This is the system's only Owner account and cannot be changed.
              </p>
            ) : (
              <p className="mt-1 text-[0.7rem] text-muted-foreground">
                {ROLE_DESCRIPTIONS[role]}
              </p>
            )}
          </div>

          {/* Account Status */}
          <div>
            <label className="block font-semibold text-ink mb-1">Status</label>
            <select
              value={status}
              disabled={isLastOwner}
              onChange={(e) => setStatus(e.target.value as AccountStatus)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-ink focus:outline-none focus:border-primary disabled:opacity-50"
            >
              <option value="active">Active (Access enabled)</option>
              <option value="inactive">Inactive (Access suspended)</option>
            </select>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-full border border-border px-4 py-2 font-semibold text-ink hover:bg-secondary disabled:opacity-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {busy ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* GRANULAR PERMISSION EDITOR MODAL                                          */
/* ========================================================================= */

function PermissionEditorModal({
  user,
  isOpen,
  onClose,
  onSaved,
  onError,
}: {
  user: AccountItem;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const setPermsFn = useServerFn(setUserPermissions);

  // Compute initial state based on user's role and existing overrides
  const roleDefaults = useMemo(() => new Set(ROLE_DEFAULTS[user.role] ?? []), [user.role]);

  const [permissionsState, setPermissionsState] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    ALL_PERMISSION_KEYS.forEach((key) => {
      if (user.overrides[key] !== undefined) {
        initial[key] = user.overrides[key];
      } else {
        initial[key] = roleDefaults.has(key);
      }
    });
    return initial;
  });

  const [originalState] = useState<Record<string, boolean>>(() => ({ ...permissionsState }));
  const [busy, setBusy] = useState(false);

  // Check if anything changed
  const isDirty = useMemo(() => {
    return Object.keys(permissionsState).some((k) => permissionsState[k] !== originalState[k]);
  }, [permissionsState, originalState]);

  // Bulk actions
  const handleSelectAll = () => {
    const updated: Record<string, boolean> = {};
    ALL_PERMISSION_KEYS.forEach((k) => {
      updated[k] = true;
    });
    setPermissionsState(updated);
  };

  const handleClearAll = () => {
    const updated: Record<string, boolean> = {};
    ALL_PERMISSION_KEYS.forEach((k) => {
      updated[k] = false;
    });
    setPermissionsState(updated);
  };

  const handleResetToDefaults = () => {
    const updated: Record<string, boolean> = {};
    ALL_PERMISSION_KEYS.forEach((k) => {
      updated[k] = roleDefaults.has(k);
    });
    setPermissionsState(updated);
  };

  const handleToggleModule = (modId: string, grant: boolean) => {
    const mod = PERMISSION_MODULES.find((m) => m.id === modId);
    if (!mod) return;
    setPermissionsState((prev) => {
      const next = { ...prev };
      mod.actions.forEach((a) => {
        next[`${modId}.${a.action}`] = grant;
      });
      return next;
    });
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      const res = await setPermsFn({
        data: {
          userId: user.id,
          permissions: permissionsState,
        },
      });
      if (res.ok) {
        onSaved();
      }
    } catch (err: any) {
      onError(err.message || "Failed to save permissions.");
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-4xl rounded-2xl border border-border bg-background shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border bg-background/95 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-ink">Configure Granular Permissions</h3>
                  <RoleBadge role={user.role} />
                  {isDirty && (
                    <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[0.65rem] font-bold text-amber-700 dark:text-amber-400 animate-pulse">
                      Unsaved Changes
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  User: <span className="font-semibold text-ink">{user.name}</span> ({user.email})
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-ink transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/60">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs font-semibold text-ink hover:bg-secondary transition"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs font-semibold text-ink hover:bg-secondary transition"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-ink hover:bg-secondary transition"
              >
                <RotateCcw className="h-3 w-3" />
                Reset to {ROLE_LABELS[user.role]} Defaults
              </button>
            </div>

            <p className="text-[0.7rem] text-muted-foreground">
              Overrides highlighted with an orange border.
            </p>
          </div>
        </div>

        {/* Scrollable Permissions Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {(["CONTENT", "BUSINESS", "WEBSITE", "SYSTEM"] as PermissionCategory[]).map((category) => {
            const categoryModules = PERMISSION_MODULES.filter((m) => m.category === category);
            if (categoryModules.length === 0) return null;

            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    {CATEGORY_TITLES[category]}
                  </h4>
                  <div className="h-px flex-1 bg-border/60" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {categoryModules.map((mod) => {
                    const allInModSelected = mod.actions.every(
                      (a) => permissionsState[`${mod.id}.${a.action}`],
                    );
                    const anyInModSelected = mod.actions.some(
                      (a) => permissionsState[`${mod.id}.${a.action}`],
                    );

                    return (
                      <div
                        key={mod.id}
                        className="rounded-xl border border-border bg-background p-3.5 space-y-3 shadow-2xs hover:border-border/80 transition"
                      >
                        {/* Module Header */}
                        <div className="flex items-start justify-between gap-2 pb-2 border-b border-border/60">
                          <div>
                            <p className="font-bold text-xs text-ink">{mod.name}</p>
                            <p className="text-[0.68rem] text-muted-foreground leading-snug mt-0.5">
                              {mod.description}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleModule(mod.id, !allInModSelected)}
                            className="shrink-0 text-[0.65rem] font-bold text-primary hover:underline"
                          >
                            {allInModSelected ? "Deselect All" : "Select All"}
                          </button>
                        </div>

                        {/* Action Checkboxes */}
                        <div className="grid grid-cols-2 gap-2">
                          {mod.actions.map((act) => {
                            const key = `${mod.id}.${act.action}`;
                            const isGranted = Boolean(permissionsState[key]);
                            const isRoleDefault = roleDefaults.has(key);
                            const isOverridden = isGranted !== isRoleDefault;

                            return (
                              <label
                                key={act.action}
                                title={act.description}
                                className={`flex items-start gap-2 rounded-lg border p-2 text-xs cursor-pointer transition ${
                                  isOverridden
                                    ? "border-amber-500/40 bg-amber-500/5"
                                    : "border-border/60 bg-secondary/15 hover:bg-secondary/30"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isGranted}
                                  onChange={(e) => {
                                    setPermissionsState((prev) => ({
                                      ...prev,
                                      [key]: e.target.checked,
                                    }));
                                  }}
                                  className="mt-0.5 rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                                />
                                <div className="leading-tight">
                                  <span className="font-semibold text-ink text-[0.72rem] block">
                                    {act.label}
                                  </span>
                                  <span className="text-[0.62rem] text-muted-foreground line-clamp-1">
                                    {act.description}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-background flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {Object.values(permissionsState).filter(Boolean).length} of{" "}
            {ALL_PERMISSION_KEYS.length} permissions granted.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary disabled:opacity-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || !isDirty}
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {busy ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Permissions"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
