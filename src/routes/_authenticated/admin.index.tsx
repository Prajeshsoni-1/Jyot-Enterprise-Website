"use client";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  ArrowRight,
  Bell,
  Briefcase,
  Building2,
  CalendarClock,
  Clock,
  FileCheck2,
  FileText,
  Flame,
  Globe,
  HelpCircle,
  Inbox,
  Layers,
  ListChecks,
  Phone,
  Plus,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { getAdminDashboard, getAdminSession } from "@/lib/admin.functions";
import { getCrmMetrics } from "@/lib/crm.functions";
import { getUnreadNotificationCount } from "@/lib/notifications.functions";
import { supabase } from "@/integrations/supabase/client";
import { fetchClientDashboard, fetchClientCrmMetrics } from "@/lib/admin-client";
import {
  DIVISION_LABEL,
  EmptyState,
  ErrorState,
  Loading,
  Panel,
  PriorityPill,
  StatCard,
  StatusPill,
  formatDate,
  formatDay,
} from "@/components/admin/ui";
import { QuickAddCustomerModal, QuickAddLeadModal } from "@/components/admin/QuickAddModals";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

const DEFAULT_STATS = {
  total: 0,
  newCount: 0,
  highPriority: 0,
  pendingFollowUps: 0,
  upcomingBookings: 0,
  customers: 0,
  careerApplications: 0,
  assigned: 0,
  contacted: 0,
  qualified: 0,
  followUp: 0,
  proposal: 0,
  won: 0,
  lost: 0,
  unassigned: 0,
  publishedContent: 0,
  draftContent: 0,
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const navigate = useNavigate();
  const fetchDashboard = useServerFn(getAdminDashboard);
  const fetchCrm = useServerFn(getCrmMetrics);
  const fetchUnreadCount = useServerFn(getUnreadNotificationCount);
  const fetchSession = useServerFn(getAdminSession);

  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      try {
        const res = await fetchDashboard({ data: undefined });
        if (res && res.stats && typeof res.stats.total === "number") {
          return res;
        }
      } catch (err) {
        console.warn("[admin.dashboard] Server function unavailable, using direct Supabase client:", err);
      }
      return await fetchClientDashboard();
    },
    retry: false,
  });

  const session = useQuery({
    queryKey: ["admin", "session"],
    queryFn: async () => {
      try {
        const res = await fetchSession({ data: undefined });
        if (res && res.userId) return res;
      } catch {
        // Fall back to client session
      }
      const { data: u } = await supabase.auth.getUser();
      return {
        userId: u?.user?.id,
        email: u?.user?.email,
        name: u?.user?.user_metadata?.full_name || u?.user?.email?.split("@")[0] || "Team",
      };
    },
    staleTime: 60_000,
  });

  const crmMetrics = useQuery({
    queryKey: ["admin", "crm-metrics"],
    queryFn: async () => {
      try {
        const res = await fetchCrm({ data: undefined });
        if (res && typeof res.customers === "number") {
          return res;
        }
      } catch (err) {
        console.warn("[admin.crm-metrics] Server function unavailable, using direct Supabase client:", err);
      }
      return await fetchClientCrmMetrics();
    },
    retry: false,
  });

  const unreadNotifs = useQuery({
    queryKey: ["admin", "notifications-unread-count"],
    queryFn: async () => {
      try {
        const res = await fetchUnreadCount({ data: undefined });
        if (res && typeof res.count === "number") return res;
      } catch {
        // Fall back to client count
      }
      const { count } = await supabase
        .from("admin_notifications")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
      return { count: count ?? 0 };
    },
    staleTime: 10_000,
  });

  if (isLoading) return <Loading label="Loading live dashboard figures…" />;
  if (isError)
    return <ErrorState message="Could not load the dashboard." onRetry={() => refetch()} />;

  const s = data?.stats ?? DEFAULT_STATS;
  const crm = crmMetrics.data;
  const userName = session.data?.name || session.data?.email?.split("@")[0] || "Team";
  const recentLeads = data?.recent ?? [];
  const highPriorityLeads = data?.highPriority ?? [];
  const followUpsTodayLeads = data?.followUpsToday ?? [];
  const upcomingBookingsList = data?.upcomingBookings ?? [];

  return (
    <div className="space-y-8">
      {/* 1. Executive Greeting Header & Quick Actions Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
              {getGreeting()}, {userName}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold dark:bg-emerald-950/40 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Workspace
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Here's what's happening with Jyot Enterprise today.
          </p>
        </div>

        {/* Existing Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setLeadModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" /> Add Lead
          </button>
          <button
            onClick={() => setCustomerModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-ink hover:bg-secondary transition shadow-2xs active:scale-[0.98]"
          >
            <UserPlus className="h-3.5 w-3.5 text-emerald-600" /> Add Customer
          </button>
          <Link
            to="/admin/bookings"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-ink hover:bg-secondary transition shadow-2xs active:scale-[0.98]"
          >
            <CalendarClock className="h-3.5 w-3.5 text-indigo-600" /> New Booking
          </Link>
          <Link
            to="/admin/tasks"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-ink hover:bg-secondary transition shadow-2xs active:scale-[0.98]"
          >
            <ListChecks className="h-3.5 w-3.5 text-amber-600" /> Create Task
          </Link>
        </div>
      </div>

      {/* 2. Top-tier Executive KPI Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Key Business Metrics
          </h2>
          <span className="text-xs text-muted-foreground">Updated in real-time</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Leads"
            value={s.total}
            hint="All registered inquiries"
            icon={Inbox}
            accent="primary"
            onClick={() => navigate({ to: "/admin/enquiries" })}
          />
          <StatCard
            label="New Leads"
            value={s.newCount}
            hint="Awaiting first response"
            icon={Flame}
            accent="amber"
            onClick={() => navigate({ to: "/admin/enquiries", search: { status: "new" } as any })}
          />
          <StatCard
            label="Active Customers"
            value={crm?.customers ?? s.customers}
            hint={`${crm?.newCustomers ?? 0} new clients this month`}
            icon={Building2}
            accent="emerald"
            onClick={() => navigate({ to: "/admin/customers" })}
          />
          <StatCard
            label="Upcoming Bookings"
            value={s.upcomingBookings}
            hint="Consultations scheduled"
            icon={CalendarClock}
            accent="indigo"
            onClick={() => navigate({ to: "/admin/bookings" })}
          />
        </div>
      </section>

      {/* 3. Operational Pulse KPI Cards */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Operations & Attention Required
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Follow-ups Due"
            value={crm?.followUpsDueToday ?? s.pendingFollowUps}
            hint={`${crm?.followUpsOverdue ?? 0} overdue tasks`}
            icon={Clock}
            accent={(crm?.followUpsDueToday ?? s.pendingFollowUps) > 0 ? "rose" : undefined}
            onClick={() => navigate({ to: "/admin/followups" })}
          />
          <StatCard
            label="Open Tasks"
            value={crm?.openTasks ?? 0}
            hint="Active team assignments"
            icon={ListChecks}
            onClick={() => navigate({ to: "/admin/tasks" })}
          />
          <StatCard
            label="Documents Under Review"
            value={crm?.pendingDocumentReviews ?? 0}
            hint="Uploaded files pending sign-off"
            icon={FileCheck2}
            onClick={() => navigate({ to: "/admin/documents" })}
          />
          <StatCard
            label="Website Content"
            value={s.publishedContent ?? 0}
            hint={`${s.draftContent ?? 0} drafts being edited`}
            icon={Globe}
            onClick={() => navigate({ to: "/admin/website" })}
          />
        </div>
      </section>

      {/* 4. Lead Pipeline Stage Filter Pills */}
      <Panel
        title="Enquiry Pipeline Stages"
        subtitle="Quickly drill down by active stage"
      >
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            to="/admin/enquiries"
            search={{ status: "new" }}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3.5 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition shadow-2xs"
          >
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            New ({s.newCount})
          </Link>
          <Link
            to="/admin/enquiries"
            search={{ priority: "High" }}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition shadow-2xs dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300"
          >
            <Flame className="h-3.5 w-3.5 text-rose-600" /> High Priority ({s.highPriority})
          </Link>
          <Link
            to="/admin/enquiries"
            search={{ assignment: "unassigned" }}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-ink hover:bg-secondary transition shadow-2xs"
          >
            Unassigned ({s.unassigned})
          </Link>
          <Link
            to="/admin/enquiries"
            search={{ status: "contacted" }}
            className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50/80 px-3.5 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition shadow-2xs dark:bg-sky-950/30 dark:border-sky-800 dark:text-sky-300"
          >
            Contacted ({s.contacted})
          </Link>
          <Link
            to="/admin/enquiries"
            search={{ status: "qualified" }}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition shadow-2xs dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300"
          >
            Qualified ({s.qualified})
          </Link>
          <Link
            to="/admin/enquiries"
            search={{ status: "proposal" }}
            className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50/80 px-3.5 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition shadow-2xs dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-300"
          >
            Proposal ({s.proposal})
          </Link>
          <Link
            to="/admin/enquiries"
            search={{ status: "won" }}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition shadow-2xs dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
          >
            Won Deals ({s.won})
          </Link>
        </div>
      </Panel>

      {/* 5. Actionable Lists Grid (2 Columns) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Enquiries */}
        <Panel
          title="Recent Enquiries"
          subtitle="Latest prospective clients across all practices"
          action={
            <Link
              to="/admin/enquiries"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <LeadList rows={recentLeads} empty="No enquiries registered yet." />
        </Panel>

        {/* High Priority Enquiries */}
        <Panel
          title="High Priority Leads"
          subtitle="Mandates flagged for rapid turnaround"
          action={
            <Link
              to="/admin/enquiries"
              search={{ priority: "High" }}
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <LeadList rows={highPriorityLeads} empty="No open high-priority enquiries." />
        </Panel>

        {/* Follow-ups Due Today */}
        <Panel
          title="Follow-ups Due Today"
          subtitle="Scheduled client check-ins and commitments"
          action={
            <Link
              to="/admin/followups"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              Open Follow-ups <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <LeadList rows={followUpsTodayLeads} empty="Nothing due today." />
        </Panel>

        {/* Upcoming Appointments */}
        <Panel
          title="Upcoming Appointments"
          subtitle="Booked consultations from the live site"
          action={
            <Link
              to="/admin/bookings"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              Calendar view <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {upcomingBookingsList.length === 0 ? (
            <EmptyState
              title="No upcoming appointments"
              body="Consultations booked through the website wizard appear here."
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {upcomingBookingsList.map((b: any) => (
                <li key={b.id} className="flex items-center gap-3.5 py-3.5 transition hover:bg-secondary/30 rounded-xl px-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <CalendarClock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/admin/enquiries/$id"
                      params={{ id: b.id }}
                      className="text-sm font-bold text-ink hover:text-primary truncate block"
                    >
                      {b.name}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground mt-0.5">
                      {b.service ?? "Consultation"} · {b.contactMethod ?? "Any channel"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-ink bg-secondary px-3 py-1 rounded-full border border-border/80">
                    {formatDay(b.date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Modals for 1-click creation */}
      <QuickAddLeadModal
        isOpen={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        onSuccess={(id) => navigate({ to: "/admin/enquiries/$id", params: { id } })}
      />

      <QuickAddCustomerModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSuccess={(id) => navigate({ to: "/admin/customers/$id", params: { id } })}
      />
    </div>
  );
}

function LeadList({ rows, empty }: { rows: any[]; empty: string }) {
  if (rows.length === 0) return <EmptyState title={empty} />;
  return (
    <ul className="divide-y divide-border/60">
      {rows.map((r) => {
        const initials = (r.name || "U")
          .split(" ")
          .map((w: string) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return (
          <li
            key={r.id}
            className="group flex flex-wrap items-center gap-3.5 py-3.5 px-2 rounded-xl transition hover:bg-secondary/40"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-xs text-ink border border-border">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                to="/admin/enquiries/$id"
                params={{ id: r.id }}
                className="text-sm font-bold text-ink group-hover:text-primary transition-colors truncate block"
              >
                {r.name}
              </Link>
              <p className="truncate text-xs text-muted-foreground mt-0.5">
                <span className="font-mono text-[0.7rem] text-muted-foreground/80">{r.reference}</span> ·{" "}
                <span className="font-medium text-ink/80">{DIVISION_LABEL[r.division] ?? r.division}</span> ·{" "}
                {formatDate(r.createdAt)}
              </p>
            </div>
            {r.phone ? (
              <a
                href={`tel:${r.phone}`}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-emerald-600 hover:border-emerald-300 transition"
                aria-label={`Call ${r.name}`}
                title={`Call ${r.phone}`}
              >
                <Phone className="h-3.5 w-3.5" />
              </a>
            ) : null}
            <PriorityPill value={r.priority} />
            <StatusPill value={r.status} />
          </li>
        );
      })}
    </ul>
  );
}
