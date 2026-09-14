"use client";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Bell,
  Briefcase,
  CalendarClock,
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
import { getAdminDashboard } from "@/lib/admin.functions";
import { getCrmMetrics } from "@/lib/crm.functions";
import { getUnreadNotificationCount } from "@/lib/notifications.functions";
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

function Dashboard() {
  const navigate = useNavigate();
  const fetchDashboard = useServerFn(getAdminDashboard);
  const fetchCrm = useServerFn(getCrmMetrics);
  const fetchUnreadCount = useServerFn(getUnreadNotificationCount);

  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => fetchDashboard({ data: undefined }),
    retry: false,
  });

  const crmMetrics = useQuery({
    queryKey: ["admin", "crm-metrics"],
    queryFn: () => fetchCrm({ data: undefined }),
    retry: false,
  });

  const unreadNotifs = useQuery({
    queryKey: ["admin", "notifications-unread-count"],
    queryFn: () => fetchUnreadCount({ data: undefined }),
    staleTime: 10_000,
  });

  if (isLoading) return <Loading label="Loading live dashboard figures…" />;
  if (isError || !data)
    return <ErrorState message="Could not load the dashboard." onRetry={() => refetch()} />;

  const s = data.stats;
  const crm = crmMetrics.data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">
            Business & Website Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time overview of enquiries, clients, bookings, tasks, and website publishing.
          </p>
        </div>
      </div>

      {/* 1. Quick Actions */}
      <section className="rounded-3xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Quick Actions</p>
          <span className="text-xs text-muted-foreground">Create records in 1-click</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setLeadModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Add Lead
          </button>
          <button
            onClick={() => setCustomerModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary transition"
          >
            <UserPlus className="h-3.5 w-3.5 text-emerald-600" /> Add Customer
          </button>
          <Link
            to="/admin/website/$module/$id"
            params={{ module: "jobs", id: "new" }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary transition"
          >
            <Briefcase className="h-3.5 w-3.5 text-amber-600" /> Add Job
          </Link>
          <Link
            to="/admin/website/$module/$id"
            params={{ module: "products", id: "new" }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary transition"
          >
            <Layers className="h-3.5 w-3.5 text-indigo-600" /> Add Product
          </Link>
          <Link
            to="/admin/website/$module/$id"
            params={{ module: "services", id: "new" }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-600" /> Add Service
          </Link>
          <Link
            to="/admin/website/$module/$id"
            params={{ module: "posts", id: "new" }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary transition"
          >
            <FileText className="h-3.5 w-3.5 text-rose-600" /> Add Blog
          </Link>
          <Link
            to="/admin/website/$module/$id"
            params={{ module: "projects", id: "new" }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary transition"
          >
            <Plus className="h-3.5 w-3.5 text-teal-600" /> Add Portfolio
          </Link>
          <Link
            to="/admin/website/$module/$id"
            params={{ module: "faqs", id: "new" }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary transition"
          >
            <HelpCircle className="h-3.5 w-3.5 text-sky-600" /> Add FAQ
          </Link>
          <Link
            to="/admin/notifications"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary transition"
          >
            <Bell className="h-3.5 w-3.5 text-amber-500" /> Notifications {unreadNotifs.data?.count ? `(${unreadNotifs.data.count})` : ""}
          </Link>
        </div>
      </section>

      {/* 2. Main 8 Clickable Summary Cards */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Attention & Overview
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Unread Alerts"
            value={unreadNotifs.data?.count ?? 0}
            hint="New bookings & applications"
            onClick={() => navigate({ to: "/admin/notifications" })}
          />
          <StatCard
            label="New Leads"
            value={s.newCount}
            hint="Awaiting first contact"
            onClick={() => navigate({ to: "/admin/enquiries", search: { status: "new" } as any })}
          />
          <StatCard
            label="Follow-ups Due"
            value={crm?.followUpsDueToday ?? s.pendingFollowUps}
            hint="Due today or overdue"
            onClick={() => navigate({ to: "/admin/followups" })}
          />
          <StatCard
            label="Pending Tasks"
            value={crm?.openTasks ?? 0}
            hint="Active team assignments"
            onClick={() => navigate({ to: "/admin/tasks" })}
          />
          <StatCard
            label="Upcoming Bookings"
            value={s.upcomingBookings}
            hint="Consultations scheduled"
            onClick={() => navigate({ to: "/admin/bookings" })}
          />
          <StatCard
            label="Documents Pending Review"
            value={crm?.pendingDocumentReviews ?? 0}
            hint="Uploaded files awaiting sign-off"
            onClick={() => navigate({ to: "/admin/documents" })}
          />
          <StatCard
            label="Job Applications"
            value={s.careerApplications}
            hint="Candidate submissions"
            onClick={() => navigate({ to: "/admin/website/applications" })}
          />
          <StatCard
            label="Published Website Content"
            value={s.publishedContent ?? 0}
            hint="Live pages, offerings & posts"
            onClick={() => navigate({ to: "/admin/website" })}
          />
          <StatCard
            label="Draft Content"
            value={s.draftContent ?? 0}
            hint="Unpublished items being edited"
            onClick={() => navigate({ to: "/admin/website" })}
          />
        </div>
      </section>

      {/* 3. Enquiry Pipeline Filters */}
      <Panel title="Lead Stage Quick Filter">
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/enquiries"
            search={{ status: "new" }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-secondary"
          >
            <Inbox className="h-3.5 w-3.5 text-primary" /> New ({s.newCount})
          </Link>
          <Link
            to="/admin/enquiries"
            search={{ priority: "High" }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-secondary"
          >
            <Flame className="h-3.5 w-3.5 text-destructive" /> High Priority ({s.highPriority})
          </Link>
          <Link
            to="/admin/enquiries"
            search={{ assignment: "unassigned" }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-secondary"
          >
            Unassigned ({s.unassigned})
          </Link>
          <Link
            to="/admin/enquiries"
            search={{ status: "contacted" }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-secondary"
          >
            Contacted ({s.contacted})
          </Link>
          <Link
            to="/admin/enquiries"
            search={{ status: "qualified" }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-secondary"
          >
            Qualified ({s.qualified})
          </Link>
          <Link
            to="/admin/enquiries"
            search={{ status: "proposal" }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-secondary"
          >
            Proposal ({s.proposal})
          </Link>
          <Link
            to="/admin/enquiries"
            search={{ status: "won" }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20"
          >
            Won Deals ({s.won})
          </Link>
        </div>
      </Panel>

      {/* 4. Actionable Lists Grid */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title="Recent Enquiries"
          action={
            <Link to="/admin/enquiries" className="text-xs font-semibold text-primary">
              View all →
            </Link>
          }
        >
          <LeadList rows={data.recent} empty="No enquiries yet." />
        </Panel>

        <Panel
          title="High Priority Enquiries"
          action={
            <Link
              to="/admin/enquiries"
              search={{ priority: "High" }}
              className="text-xs font-semibold text-primary"
            >
              View all →
            </Link>
          }
        >
          <LeadList rows={data.highPriority} empty="No open high-priority enquiries." />
        </Panel>

        <Panel
          title="Follow-ups Due Today"
          action={
            <Link to="/admin/followups" className="text-xs font-semibold text-primary">
              Open Follow-ups →
            </Link>
          }
        >
          <LeadList rows={data.followUpsToday} empty="Nothing due today." />
        </Panel>

        <Panel
          title="Upcoming Appointments"
          action={
            <Link to="/admin/bookings" className="text-xs font-semibold text-primary">
              Calendar view →
            </Link>
          }
        >
          {data.upcomingBookings.length === 0 ? (
            <EmptyState
              title="No upcoming appointments"
              body="Consultations booked on the website appear here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.upcomingBookings.map((b: any) => (
                <li key={b.id} className="flex items-center gap-3 py-3">
                  <CalendarClock className="h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/admin/enquiries/$id"
                      params={{ id: b.id }}
                      className="text-sm font-semibold text-ink hover:text-primary truncate block"
                    >
                      {b.name}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {b.service ?? "Consultation"} · {b.contactMethod ?? "Any channel"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-ink bg-secondary px-2.5 py-1 rounded-full border border-border">
                    {formatDay(b.date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Modals */}
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
    <ul className="divide-y divide-border">
      {rows.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <Link
              to="/admin/enquiries/$id"
              params={{ id: r.id }}
              className="text-sm font-semibold text-ink hover:text-primary truncate block"
            >
              {r.name}
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              {r.reference} · {DIVISION_LABEL[r.division] ?? r.division} · {formatDate(r.createdAt)}
            </p>
          </div>
          {r.phone ? (
            <a
              href={`tel:${r.phone}`}
              className="rounded-full border border-border p-1.5 text-muted-foreground hover:text-ink transition"
              aria-label={`Call ${r.name}`}
            >
              <Phone className="h-3.5 w-3.5" />
            </a>
          ) : null}
          <PriorityPill value={r.priority} />
          <StatusPill value={r.status} />
        </li>
      ))}
    </ul>
  );
}
