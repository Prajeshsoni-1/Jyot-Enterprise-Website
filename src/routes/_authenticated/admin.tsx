"use client";

import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  Building2,
  CalendarClock,
  Clock,
  FileCheck2,
  Inbox,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  PanelsTopLeft,
  Search,
  Settings2,
  ShieldCheck,
  Users,
  X,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const userInitials = (data.name || data.email || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navLinkClass =
    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-secondary/70 hover:text-ink";
  const navLinkActive = {
    className:
      "bg-primary/10 text-primary font-bold shadow-2xs hover:bg-primary/15 hover:text-primary",
  };

  const NavigationMenu = ({ isMobile = false }: { isMobile?: boolean }) => (
    <nav className="flex flex-col gap-6 py-2">
      <div>
        <p className="px-3 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground/80">
          Core Operations
        </p>
        <div className="mt-2 space-y-1">
          <Link
            to="/admin"
            activeOptions={{ exact: true }}
            activeProps={navLinkActive}
            className={navLinkClass}
            onClick={() => isMobile && setSidebarOpen(false)}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0 transition-colors group-hover:text-primary" />
            <span>Dashboard</span>
          </Link>

          {canViewLeads && (
            <Link
              to="/admin/enquiries"
              activeProps={navLinkActive}
              className={navLinkClass}
              onClick={() => isMobile && setSidebarOpen(false)}
            >
              <Inbox className="h-4 w-4 shrink-0 transition-colors group-hover:text-primary" />
              <span>Leads</span>
            </Link>
          )}

          {canViewCustomers && (
            <Link
              to="/admin/customers"
              activeProps={navLinkActive}
              className={navLinkClass}
              onClick={() => isMobile && setSidebarOpen(false)}
            >
              <Building2 className="h-4 w-4 shrink-0 transition-colors group-hover:text-primary" />
              <span>Customers</span>
            </Link>
          )}

          {canViewBookings && (
            <Link
              to="/admin/bookings"
              activeProps={navLinkActive}
              className={navLinkClass}
              onClick={() => isMobile && setSidebarOpen(false)}
            >
              <CalendarClock className="h-4 w-4 shrink-0 transition-colors group-hover:text-primary" />
              <span>Bookings</span>
            </Link>
          )}

          {canViewFollowups && (
            <Link
              to="/admin/followups"
              activeProps={navLinkActive}
              className={navLinkClass}
              onClick={() => isMobile && setSidebarOpen(false)}
            >
              <Clock className="h-4 w-4 shrink-0 transition-colors group-hover:text-primary" />
              <span>Follow-ups</span>
            </Link>
          )}

          {canViewTasks && (
            <Link
              to="/admin/tasks"
              activeProps={navLinkActive}
              className={navLinkClass}
              onClick={() => isMobile && setSidebarOpen(false)}
            >
              <ListChecks className="h-4 w-4 shrink-0 transition-colors group-hover:text-primary" />
              <span>Tasks</span>
            </Link>
          )}
        </div>
      </div>

      <div>
        <p className="px-3 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground/80">
          Files & Media
        </p>
        <div className="mt-2 space-y-1">
          {canViewDocs && (
            <Link
              to="/admin/documents"
              activeProps={navLinkActive}
              className={navLinkClass}
              onClick={() => isMobile && setSidebarOpen(false)}
            >
              <FileCheck2 className="h-4 w-4 shrink-0 transition-colors group-hover:text-primary" />
              <span>Documents</span>
            </Link>
          )}
        </div>
      </div>

      <div>
        <p className="px-3 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground/80">
          Platform & System
        </p>
        <div className="mt-2 space-y-1">
          {canViewWebsite && (
            <Link
              to="/admin/website"
              activeProps={navLinkActive}
              className={navLinkClass}
              onClick={() => isMobile && setSidebarOpen(false)}
            >
              <PanelsTopLeft className="h-4 w-4 shrink-0 transition-colors group-hover:text-primary" />
              <span>Website / CMS</span>
            </Link>
          )}

          {canViewTeam && (
            <Link
              to="/admin/team"
              activeProps={navLinkActive}
              className={navLinkClass}
              onClick={() => isMobile && setSidebarOpen(false)}
            >
              <Users className="h-4 w-4 shrink-0 transition-colors group-hover:text-primary" />
              <span>Team</span>
            </Link>
          )}

          <Link
            to="/admin/website/settings"
            search={{ tab: "brand" }}
            activeProps={navLinkActive}
            className={navLinkClass}
            onClick={() => isMobile && setSidebarOpen(false)}
          >
            <Settings2 className="h-4 w-4 shrink-0 transition-colors group-hover:text-primary" />
            <span>Settings</span>
          </Link>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-background text-foreground flex flex-col">
      {/* 1. Mobile Off-Canvas Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 2. Mobile Off-Canvas Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border p-5 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="shrink-0" onClick={() => setSidebarOpen(false)}>
              <Logo />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-ink transition"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="h-[calc(100vh-14rem)] overflow-y-auto pr-1">
            <NavigationMenu isMobile />
          </div>
        </div>

        {/* Mobile User Profile Footer */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-ink">{data.name || data.email}</p>
                <span className="inline-block text-[0.65rem] font-semibold text-muted-foreground uppercase">
                  {data.role}
                </span>
              </div>
            </div>
            <button
              onClick={signOut}
              className="rounded-full p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-40 border-r border-border/80 bg-card">
        <div className="flex flex-col flex-1 min-h-0 justify-between">
          <div className="flex flex-col flex-1 p-5 overflow-y-auto">
            {/* Branding Header */}
            <div className="flex items-center justify-between pb-5 border-b border-border/60">
              <Link to="/" className="shrink-0">
                <Logo />
              </Link>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[0.62rem] font-bold text-primary border border-primary/20">
                Admin OS
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="mt-4 flex-1">
              <NavigationMenu />
            </div>
          </div>

          {/* Desktop User Profile Card */}
          <div className="p-4 border-t border-border/70 bg-secondary/30">
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-xs border border-primary/30">
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-ink leading-tight">
                    {data.name || data.email?.split("@")[0]}
                  </p>
                  <span
                    className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[0.62rem] font-bold uppercase tracking-wider ${
                      data.role === "owner"
                        ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                        : data.role === "admin"
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {data.role}
                  </span>
                </div>
              </div>
              <button
                onClick={signOut}
                className="rounded-full p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition shrink-0"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 4. Top Header + Main Content Area (Offset for Desktop Sidebar) */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/80 bg-background/95 backdrop-blur px-4 sm:px-6 shadow-2xs">
          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-ink transition"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Quick Search Bar */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2.5 rounded-full border border-border/80 bg-secondary/40 px-3.5 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:bg-background hover:text-ink transition shadow-2xs w-48 sm:w-64 md:w-80"
              title="Search admin (Ctrl+K)"
            >
              <Search className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate">Quick search…</span>
              <kbd className="ml-auto hidden sm:inline-block rounded bg-background px-1.5 py-0.5 text-[0.65rem] font-bold text-muted-foreground border border-border">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Notification Center */}
            <NotificationCenter />

            {/* User Profile Quick Menu */}
            <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-border/60">
              <div className="text-right">
                <p className="text-xs font-bold text-ink leading-none">
                  {data.name || data.email}
                </p>
                <span className="text-[0.68rem] text-muted-foreground capitalize">
                  {data.role} access
                </span>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/25">
                {userInitials}
              </div>
            </div>

            <button
              onClick={signOut}
              className="inline-flex sm:hidden items-center gap-1.5 rounded-full border border-border p-2 text-xs font-semibold text-ink hover:bg-secondary transition"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Global Modal & Toaster Elements */}
        <AdminQuickSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        <Toaster richColors position="top-right" />

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
