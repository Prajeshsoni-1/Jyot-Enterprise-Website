"use client";

import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  Building2,
  CalendarClock,
  FileCheck2,
  Inbox,
  LayoutDashboard,
  ListChecks,
  LogOut,
  PanelsTopLeft,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { claimFirstAdmin, getAdminSession } from "@/lib/admin.functions";
import { Loading } from "@/components/admin/ui";
import { AdminQuickSearch } from "@/components/admin/AdminQuickSearch";
import { NotificationCenter } from "@/components/admin/NotificationCenter";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/site/Logo";
import { pageMeta } from "@/lib/seo";
import { hasPermission } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: pageMeta({
      title: "Admin Desk — Jyot Enterprise",
      description: "Internal enquiry desk for the Jyot Enterprise team.",
      path: "/admin",
      noindex: true,
    }),
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useServerFn(getAdminSession);
  const claim = useServerFn(claimFirstAdmin);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "session"],
    queryFn: () => session({ data: undefined }),
    retry: false,
  });

  // Automatically sync any offline/buffered visitor leads when admin is authenticated
  useEffect(() => {
    if (!data?.isTeam || data.status === "inactive") return;
    async function syncPending() {
      try {
        if (typeof window === "undefined") return;
        const stored = window.localStorage.getItem("jyot_pending_leads");
        if (!stored) return;
        const pending = JSON.parse(stored);
        if (!Array.isArray(pending) || pending.length === 0) return;

        for (const lead of pending) {
          const { bufferedAt, ...cleanLead } = lead;
          await supabase.from("leads").insert(cleanLead);
        }
        window.localStorage.removeItem("jyot_pending_leads");
        await queryClient.invalidateQueries();
      } catch (err) {
        console.warn("[AdminLayout] Pending lead sync:", err);
      }
    }
    void syncPending();
  }, [data?.isTeam, data?.status, queryClient]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isLoading) return <Loading label="Checking your access…" />;

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-sm font-semibold text-destructive">
          Your session has expired or could not be verified.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <button
            onClick={() => refetch()}
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary"
          >
            Retry
          </button>
          <button
            onClick={signOut}
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
          >
            Sign in again
          </button>
        </div>
      </div>
    );
  }

  if (data.status === "inactive") {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-ink">Account Deactivated</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account ({data.email}) has been deactivated by an administrator. You currently do not have access to the Jyot Enterprise Admin Desk.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Please contact the primary system Owner if you believe this is an error.
        </p>
        <div className="mt-6 flex justify-center">
          <button
            onClick={signOut}
            className="rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (!data.isTeam) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-extrabold text-ink">No desk access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This account ({data.email}) is not part of the Jyot Enterprise team. Ask an administrator
          to grant you access.
        </p>
        {data.adminExists ? (
          <p className="mt-4 text-xs font-medium text-destructive">
            An administrator already exists. Ask them to add your account.
          </p>
        ) : null}
        {claimError ? <p className="mt-4 text-xs text-destructive">{claimError}</p> : null}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {data.adminExists ? null : (
            <button
              disabled={claiming}
              onClick={async () => {
                setClaiming(true);
                setClaimError(null);
                try {
                  const res = await claim({ data: undefined });
                  if (res.claimed) await refetch();
                  else
                    setClaimError("An administrator already exists. Ask them to add your account.");
                } catch {
                  setClaimError("Could not set up the first administrator.");
                } finally {
                  setClaiming(false);
                }
              }}
              className="rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-70"
            >
              {claiming ? "Setting up…" : "Set up as first administrator"}
            </button>
          )}
          <button
            onClick={signOut}
            className="rounded-full border border-border px-5 py-2.5 text-xs font-semibold text-ink hover:bg-secondary"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const userPerms = data.permissions;
  const canViewLeads = hasPermission(userPerms, "enquiries", "view");
  const canViewCustomers = hasPermission(userPerms, "customers", "view");
  const canViewBookings = hasPermission(userPerms, "bookings", "view");
  const canViewTasks = hasPermission(userPerms, "tasks", "view");
  const canViewFollowups = canViewTasks || canViewLeads;
  const canViewDocs =
    hasPermission(userPerms, "downloads", "view") ||
    hasPermission(userPerms, "media", "view") ||
    hasPermission(userPerms, "enquiries", "view");
  const canViewWebsite =
    hasPermission(userPerms, "website", "view") ||
    hasPermission(userPerms, "blogs", "view") ||
    hasPermission(userPerms, "services", "view");
  const canViewTeam =
    hasPermission(userPerms, "system", "view") ||
    hasPermission(userPerms, "system", "manage") ||
    data.role === "owner" ||
    data.role === "admin";

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1536px] items-center gap-2 sm:gap-3 px-3 sm:px-5 lg:px-6 py-2.5">
          <Link to="/" className="shrink-0 mr-1 sm:mr-2">
            <Logo />
          </Link>

          <nav
            aria-label="Admin"
            className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto py-0.5 scrollbar-none"
          >
            <Link
              to="/admin"
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-secondary text-ink font-bold shadow-2xs" }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 xl:px-3 text-xs font-semibold text-muted-foreground hover:text-ink hover:bg-secondary/60 transition whitespace-nowrap"
            >
              <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
            </Link>
            {canViewLeads ? (
              <Link
                to="/admin/enquiries"
                activeProps={{ className: "bg-secondary text-ink font-bold shadow-2xs" }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 xl:px-3 text-xs font-semibold text-muted-foreground hover:text-ink hover:bg-secondary/60 transition whitespace-nowrap"
              >
                <Inbox className="h-3.5 w-3.5" /> Leads
              </Link>
            ) : null}
            {canViewCustomers ? (
              <Link
                to="/admin/customers"
                activeProps={{ className: "bg-secondary text-ink font-bold shadow-2xs" }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 xl:px-3 text-xs font-semibold text-muted-foreground hover:text-ink hover:bg-secondary/60 transition whitespace-nowrap"
              >
                <Building2 className="h-3.5 w-3.5" /> Customers
              </Link>
            ) : null}
            {canViewBookings ? (
              <Link
                to="/admin/bookings"
                activeProps={{ className: "bg-secondary text-ink font-bold shadow-2xs" }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 xl:px-3 text-xs font-semibold text-muted-foreground hover:text-ink hover:bg-secondary/60 transition whitespace-nowrap"
              >
                <CalendarClock className="h-3.5 w-3.5" /> Bookings
              </Link>
            ) : null}
            {canViewFollowups ? (
              <Link
                to="/admin/followups"
                activeProps={{ className: "bg-secondary text-ink font-bold shadow-2xs" }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 xl:px-3 text-xs font-semibold text-muted-foreground hover:text-ink hover:bg-secondary/60 transition whitespace-nowrap"
              >
                <CalendarClock className="h-3.5 w-3.5" /> Follow-ups
              </Link>
            ) : null}
            {canViewTasks ? (
              <Link
                to="/admin/tasks"
                activeProps={{ className: "bg-secondary text-ink font-bold shadow-2xs" }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 xl:px-3 text-xs font-semibold text-muted-foreground hover:text-ink hover:bg-secondary/60 transition whitespace-nowrap"
              >
                <ListChecks className="h-3.5 w-3.5" /> Tasks
              </Link>
            ) : null}
            {canViewDocs ? (
              <Link
                to="/admin/documents"
                activeProps={{ className: "bg-secondary text-ink font-bold shadow-2xs" }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 xl:px-3 text-xs font-semibold text-muted-foreground hover:text-ink hover:bg-secondary/60 transition whitespace-nowrap"
              >
                <FileCheck2 className="h-3.5 w-3.5" /> Documents
              </Link>
            ) : null}
            {canViewWebsite ? (
              <Link
                to="/admin/website"
                activeProps={{ className: "bg-secondary text-ink font-bold shadow-2xs" }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 xl:px-3 text-xs font-semibold text-muted-foreground hover:text-ink hover:bg-secondary/60 transition whitespace-nowrap"
              >
                <PanelsTopLeft className="h-3.5 w-3.5" /> Website
              </Link>
            ) : null}
            {canViewTeam ? (
              <Link
                to="/admin/team"
                activeProps={{ className: "bg-secondary text-ink font-bold shadow-2xs" }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 xl:px-3 text-xs font-semibold text-muted-foreground hover:text-ink hover:bg-secondary/60 transition whitespace-nowrap"
              >
                <Users className="h-3.5 w-3.5" /> Team
              </Link>
            ) : null}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-border bg-background/80 px-2.5 sm:px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-ink transition shadow-2xs"
              title="Search admin (Ctrl+K)"
            >
              <Search className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="hidden xl:inline">Quick Search…</span>
              <span className="hidden sm:inline xl:hidden">Search</span>
              <kbd className="hidden sm:inline-block rounded bg-secondary px-1.5 py-0.5 text-[0.65rem] font-bold text-muted-foreground">
                Ctrl K
              </kbd>
            </button>

            <NotificationCenter />

            <span className="hidden text-right text-[0.7rem] leading-tight text-muted-foreground lg:block max-w-[170px]">
              <span className="truncate block font-medium text-ink">{data.name || data.email}</span>
              <span className="inline-flex items-center gap-1 mt-0.5">
                <span
                  className={`inline-block px-1.5 py-0.2 rounded text-[0.65rem] font-bold uppercase tracking-wider ${
                    data.role === "owner"
                      ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                      : data.role === "admin"
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : data.role === "manager"
                      ? "bg-blue-500/15 text-blue-600 border border-blue-500/30"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {data.role}
                </span>
              </span>
            </span>

            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-ink hover:bg-secondary transition shrink-0"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />{" "}
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <AdminQuickSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <Toaster richColors position="top-right" />

      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <Outlet />
      </div>
    </div>
  );
}
