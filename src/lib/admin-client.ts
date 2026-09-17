import { supabase } from "@/integrations/supabase/client";

const CLOSED = ["won", "lost", "archived"];

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// -------------------------------------------------------------
// 1. DASHBOARD
// -------------------------------------------------------------

export async function fetchClientDashboard() {
  const { data: leads, error } = await supabase
    .from("leads")
    .select(
      "id, reference, name, email, phone, division, service, status, priority, score, score_value, estimated_value, source, assigned_to, follow_up_at, details, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    console.warn("[admin-client] Error loading leads for dashboard:", error.message);
  }

  const rows = leads ?? [];
  const today = startOfToday();
  const todayEnd = new Date(today.getTime() + 86_400_000);
  const isCareer = (r: any) => typeof r.service === "string" && /^application —/i.test(r.service);
  const bookingDate = (r: any) => {
    const raw = r.details?.preferredDate;
    if (!raw || typeof raw !== "string") return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const upcomingBookings = rows
    .map((r: any) => ({ row: r, date: bookingDate(r) }))
    .filter((x: any) => x.date && x.date >= today)
    .sort((a: any, b: any) => a.date.getTime() - b.date.getTime())
    .slice(0, 8)
    .map((x: any) => ({
      id: x.row.id,
      reference: x.row.reference,
      name: x.row.name,
      service: x.row.service,
      date: x.date.toISOString(),
      contactMethod: (x.row.details?.contactMethod as string) ?? null,
    }));

  const followUpsToday = rows
    .filter((r: any) => {
      if (!r.follow_up_at) return false;
      const d = new Date(r.follow_up_at);
      return d < todayEnd;
    })
    .filter((r: any) => !["won", "lost", "archived"].includes(r.status))
    .slice(0, 10);

  const slim = (r: any) => ({
    id: r.id,
    reference: r.reference,
    name: r.name,
    email: r.email,
    phone: r.phone,
    division: r.division,
    service: r.service,
    status: r.status,
    priority: r.priority,
    score: r.score,
    scoreValue: r.score_value,
    estimatedValue: r.estimated_value,
    source: r.source,
    assignedTo: r.assigned_to,
    followUpAt: r.follow_up_at,
    createdAt: r.created_at,
  });

  return {
    stats: {
      total: rows.length,
      newCount: rows.filter((r: any) => r.status === "new").length,
      highPriority: rows.filter((r: any) => r.priority === "High").length,
      pendingFollowUps: rows.filter(
        (r: any) =>
          r.follow_up_at &&
          new Date(r.follow_up_at) < todayEnd &&
          !["won", "lost", "archived"].includes(r.status),
      ).length,
      upcomingBookings: rows.filter((r: any) => {
        const d = bookingDate(r);
        return d !== null && d >= today;
      }).length,
      customers: new Set(rows.map((r: any) => String(r.email).toLowerCase())).size,
      careerApplications: rows.filter(isCareer).length,
      assigned: rows.filter((r: any) => r.status === "assigned").length,
      contacted: rows.filter((r: any) => r.status === "contacted").length,
      qualified: rows.filter((r: any) => r.status === "qualified").length,
      followUp: rows.filter((r: any) => r.status === "follow_up").length,
      proposal: rows.filter((r: any) => r.status === "proposal").length,
      won: rows.filter((r: any) => r.status === "won").length,
      lost: rows.filter((r: any) => r.status === "lost").length,
      unassigned: rows.filter((r: any) => !r.assigned_to && !CLOSED.includes(r.status)).length,
      publishedContent: 0,
      draftContent: 0,
    },
    recent: rows.slice(0, 8).map(slim),
    highPriority: rows
      .filter(
        (r: any) => r.priority === "High" && !["won", "lost", "archived"].includes(r.status),
      )
      .slice(0, 8)
      .map(slim),
    followUpsToday: followUpsToday.map(slim),
    upcomingBookings,
  };
}

// -------------------------------------------------------------
// 2. CRM METRICS
// -------------------------------------------------------------

export async function fetchClientCrmMetrics() {
  try {
    const head = { count: "exact" as const, head: true };
    const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const today = startOfToday();
    const todayEnd = new Date(today.getTime() + 86_400_000);

    const [customers, newCustomers, dueToday, overdue, upcoming, openTasks, pendingDocs] =
      await Promise.all([
        supabase.from("customers").select("id", head),
        supabase.from("customers").select("id", head).gte("created_at", monthAgo),
        supabase
          .from("follow_ups")
          .select("id", head)
          .eq("status", "pending")
          .gte("due_at", today.toISOString())
          .lte("due_at", todayEnd.toISOString()),
        supabase
          .from("follow_ups")
          .select("id", head)
          .eq("status", "pending")
          .lt("due_at", today.toISOString()),
        supabase
          .from("follow_ups")
          .select("id", head)
          .eq("status", "pending")
          .gt("due_at", todayEnd.toISOString()),
        supabase.from("tasks").select("id", head).eq("status", "open"),
        supabase
          .from("documents")
          .select("id", head)
          .in("status", ["uploaded", "under_review"]),
      ]);

    return {
      customers: customers.count ?? 0,
      newCustomers: newCustomers.count ?? 0,
      followUpsDueToday: dueToday.count ?? 0,
      followUpsOverdue: overdue.count ?? 0,
      followUpsUpcoming: upcoming.count ?? 0,
      openTasks: openTasks.count ?? 0,
      pendingDocumentReviews: pendingDocs.count ?? 0,
    };
  } catch (e) {
    console.warn("[admin-client] Error loading CRM metrics:", e);
    return {
      customers: 0,
      newCustomers: 0,
      followUpsDueToday: 0,
      followUpsOverdue: 0,
      followUpsUpcoming: 0,
      openTasks: 0,
      pendingDocumentReviews: 0,
    };
  }
}

// -------------------------------------------------------------
// 3. LEADS & ENQUIRIES
// -------------------------------------------------------------

export async function fetchClientEnquiries(data: any = {}) {
  let query = supabase
    .from("leads")
    .select(
      "id, reference, name, email, phone, division, service, status, priority, score, score_value, estimated_value, source, page_url, assigned_to, follow_up_at, details, created_at, updated_at",
      { count: "exact" },
    );

  if (data.status && data.status !== "all") query = query.eq("status", data.status);
  if (data.priority && data.priority !== "all") query = query.eq("priority", data.priority);
  if (data.division && data.division !== "all") query = query.eq("division", data.division);
  if (data.source && data.source !== "all") query = query.eq("source", data.source);
  if (data.assignment === "unassigned") query = query.is("assigned_to", null);
  if (data.from) query = query.gte("created_at", new Date(data.from).toISOString());
  if (data.to) {
    const to = new Date(data.to);
    to.setHours(23, 59, 59, 999);
    query = query.lte("created_at", to.toISOString());
  }
  if (data.search) {
    const term = String(data.search).replace(/[%,()]/g, " ").trim();
    if (term) {
      query = query.or(
        `name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,reference.ilike.%${term}%,service.ilike.%${term}%`,
      );
    }
  }

  if (data.quick && data.quick !== "none") {
    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    if (data.quick === "new") query = query.eq("status", "new");
    else if (data.quick === "high") query = query.eq("priority", "High");
    else if (data.quick === "unassigned") query = query.is("assigned_to", null);
    else if (data.quick === "won") query = query.eq("status", "won");
    else if (data.quick === "lost") query = query.eq("status", "lost");
    else if (data.quick === "followup_due") {
      query = query.not("follow_up_at", "is", null).lte("follow_up_at", endOfToday.toISOString());
    } else if (data.quick === "followup_today") {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      query = query
        .gte("follow_up_at", startOfDay.toISOString())
        .lte("follow_up_at", endOfToday.toISOString());
    }
    if (data.quick === "followup_due" || data.quick === "followup_today") {
      query = query.not("status", "in", `(${CLOSED.join(",")})`);
    }
  }

  if (data.sort === "oldest") query = query.order("created_at", { ascending: true });
  else if (data.sort === "score") query = query.order("score_value", { ascending: false });
  else if (data.sort === "updated") query = query.order("updated_at", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const page = data.page || 1;
  const pageSize = data.pageSize || 20;
  const fromIdx = (page - 1) * pageSize;
  query = query.range(fromIdx, fromIdx + pageSize - 1);

  const { data: rows, count, error } = await query;
  if (error) {
    console.warn("[admin-client] Error loading enquiries:", error.message);
  }

  return {
    total: count ?? 0,
    page,
    pageSize,
    rows: (rows ?? []).map((r: any) => ({
      id: r.id,
      reference: r.reference,
      name: r.name,
      email: r.email,
      phone: r.phone,
      division: r.division,
      service: r.service,
      status: r.status,
      priority: r.priority,
      score: r.score,
      scoreValue: r.score_value,
      estimatedValue: r.estimated_value,
      source: r.source,
      pageUrl: r.page_url,
      assignedTo: r.assigned_to,
      followUpAt: r.follow_up_at,
      details: r.details,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
  };
}

export async function fetchClientEnquiry(id: string) {
  const { data: lead, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !lead) {
    throw new Error(error?.message || "Lead not found");
  }

  const { data: notes } = await supabase
    .from("lead_notes")
    .select("*")
    .eq("lead_id", id)
    .order("created_at", { ascending: false });

  return {
    lead,
    notes: notes ?? [],
  };
}

export async function updateClientEnquiry(id: string, patch: Record<string, unknown>) {
  const updatePayload: Record<string, unknown> = {
    ...patch,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("leads").update(updatePayload).eq("id", id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function addClientEnquiryNote(id: string, note: string) {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from("lead_notes").insert({
    lead_id: id,
    author_id: userData?.user?.id ?? null,
    body: note,
  });
  if (error) throw new Error(error.message);
  return { success: true };
}

// -------------------------------------------------------------
// 4. TEAM
// -------------------------------------------------------------

export async function fetchClientTeam() {
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .order("full_name");

  return (profiles ?? []).map((p) => ({
    id: p.id,
    name: p.full_name || p.email?.split("@")[0] || "Team Member",
    email: p.email,
  }));
}

// -------------------------------------------------------------
// 5. BOOKINGS
// -------------------------------------------------------------

export async function fetchClientBookings(data: any = {}) {
  let query = supabase
    .from("bookings")
    .select(
      "id, reference, name, email, phone, company, division, service, meeting_type, slot_at, duration_minutes, status, assigned_to, lead_id, customer_id, created_at",
      { count: "exact" },
    );

  if (data.status && data.status !== "all") query = query.eq("status", data.status);
  if (data.division && data.division !== "all") query = query.eq("division", data.division);
  if (data.assignedTo === "unassigned") query = query.is("assigned_to", null);
  else if (data.assignedTo && data.assignedTo !== "all")
    query = query.eq("assigned_to", data.assignedTo);
  if (data.from) query = query.gte("slot_at", new Date(data.from).toISOString());
  if (data.to) {
    const end = new Date(data.to);
    end.setHours(23, 59, 59, 999);
    query = query.lte("slot_at", end.toISOString());
  }
  if (data.search) {
    const term = String(data.search).replace(/[%,()]/g, " ").trim();
    if (term) {
      query = query.or(
        `name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,company.ilike.%${term}%,reference.ilike.%${term}%,service.ilike.%${term}%`,
      );
    }
  }

  query =
    data.sort === "newest"
      ? query.order("created_at", { ascending: false })
      : query.order("slot_at", { ascending: true });

  const page = data.page || 1;
  const pageSize = data.pageSize || 20;
  const fromIdx = (page - 1) * pageSize;
  const { data: rows, count, error } = await query.range(fromIdx, fromIdx + pageSize - 1);
  if (error) {
    console.warn("[admin-client] Error loading bookings:", error.message);
  }

  return { rows: rows ?? [], total: count ?? 0, page, pageSize };
}

export async function fetchClientBooking(id: string) {
  const { data, error } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();
  if (error || !data) throw new Error(error?.message || "Booking not found");
  return data;
}

export async function updateClientBooking(input: Record<string, unknown>) {
  const { id, ...patch } = input;
  if (!id) throw new Error("Missing booking ID");
  const { error } = await supabase.from("bookings").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  return { success: true };
}

// -------------------------------------------------------------
// 6. CUSTOMERS
// -------------------------------------------------------------

export async function fetchClientCustomers(data: any = {}) {
  let query = supabase
    .from("customers")
    .select("id, name, email, phone, company, city, division, status, created_at, updated_at", {
      count: "exact",
    });

  if (data.status && data.status !== "all") query = query.eq("status", data.status);
  if (data.division && data.division !== "all") query = query.eq("division", data.division);
  if (data.search) {
    const term = String(data.search).replace(/[%,()]/g, " ").trim();
    if (term) {
      query = query.or(
        `name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,company.ilike.%${term}%,city.ilike.%${term}%`,
      );
    }
  }

  if (data.sort === "oldest") query = query.order("created_at", { ascending: true });
  else if (data.sort === "name") query = query.order("name", { ascending: true });
  else if (data.sort === "updated") query = query.order("updated_at", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const page = data.page || 1;
  const pageSize = data.pageSize || 20;
  const from = (page - 1) * pageSize;
  const { data: rows, count, error } = await query.range(from, from + pageSize - 1);
  if (error) {
    console.warn("[admin-client] Error loading customers:", error.message);
  }

  return {
    total: count ?? 0,
    page,
    pageSize,
    rows: rows ?? [],
  };
}

export async function fetchClientCustomer(id: string) {
  const { data, error } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
  if (error || !data) throw new Error(error?.message || "Customer not found");

  const [leads, bookings, followUps, tasks, documents] = await Promise.all([
    supabase.from("leads").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
    supabase.from("bookings").select("*").eq("customer_id", id).order("slot_at", { ascending: false }),
    supabase.from("follow_ups").select("*").eq("customer_id", id).order("due_at", { ascending: true }),
    supabase.from("tasks").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
    supabase.from("documents").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
  ]);

  return {
    customer: data,
    leads: leads.data ?? [],
    bookings: bookings.data ?? [],
    followUps: followUps.data ?? [],
    tasks: tasks.data ?? [],
    documents: documents.data ?? [],
  };
}

// -------------------------------------------------------------
// 7. FOLLOW-UPS
// -------------------------------------------------------------

export async function fetchClientFollowUps(data: any = {}) {
  let query = supabase
    .from("follow_ups")
    .select(
      "id, lead_id, customer_id, title, notes, due_at, status, assigned_to, completed_at, created_at",
      { count: "exact" },
    );

  const now = new Date();
  const todayStart = startOfToday();
  const todayEnd = new Date(todayStart.getTime() + 86_400_000);

  if (data.leadId) query = query.eq("lead_id", data.leadId);
  if (data.customerId) query = query.eq("customer_id", data.customerId);

  if (data.scope === "today") {
    query = query
      .eq("status", "pending")
      .gte("due_at", todayStart.toISOString())
      .lt("due_at", todayEnd.toISOString());
  } else if (data.scope === "overdue") {
    query = query.eq("status", "pending").lt("due_at", now.toISOString());
  } else if (data.scope === "upcoming") {
    query = query.eq("status", "pending").gte("due_at", now.toISOString());
  } else if (data.scope === "completed") {
    query = query.eq("status", "completed");
  }

  query = query.order("due_at", { ascending: true });

  const page = data.page || 1;
  const pageSize = data.pageSize || 20;
  const from = (page - 1) * pageSize;
  const { data: rows, count, error } = await query.range(from, from + pageSize - 1);
  if (error) {
    console.warn("[admin-client] Error loading follow-ups:", error.message);
  }

  return {
    total: count ?? 0,
    page,
    pageSize,
    rows: rows ?? [],
  };
}

export async function updateClientFollowUp(input: Record<string, unknown>) {
  const { id, ...patch } = input;
  if (!id) throw new Error("Missing follow-up ID");
  const { error } = await supabase.from("follow_ups").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  return { success: true };
}

// -------------------------------------------------------------
// 8. TASKS
// -------------------------------------------------------------

export async function fetchClientTasks(data: any = {}) {
  let query = supabase
    .from("tasks")
    .select(
      "id, lead_id, customer_id, title, description, priority, status, assigned_to, due_date, created_at",
      { count: "exact" },
    );

  if (data.leadId) query = query.eq("lead_id", data.leadId);
  if (data.customerId) query = query.eq("customer_id", data.customerId);
  if (data.status && data.status !== "all") query = query.eq("status", data.status);
  if (data.priority && data.priority !== "all") query = query.eq("priority", data.priority);

  query = query.order("created_at", { ascending: false });

  const page = data.page || 1;
  const pageSize = data.pageSize || 20;
  const from = (page - 1) * pageSize;
  const { data: rows, count, error } = await query.range(from, from + pageSize - 1);
  if (error) {
    console.warn("[admin-client] Error loading tasks:", error.message);
  }

  return {
    total: count ?? 0,
    page,
    pageSize,
    rows: rows ?? [],
  };
}

export async function updateClientTask(input: Record<string, unknown>) {
  const { id, ...patch } = input;
  if (!id) throw new Error("Missing task ID");
  const { error } = await supabase.from("tasks").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  return { success: true };
}

// -------------------------------------------------------------
// 9. DOCUMENTS
// -------------------------------------------------------------

export async function fetchClientDocuments(data: any = {}) {
  let query = supabase
    .from("documents")
    .select(
      "id, lead_id, customer_id, name, file_path, file_size, mime_type, status, review_notes, reviewed_by, reviewed_at, created_at",
      { count: "exact" },
    );

  if (data.leadId) query = query.eq("lead_id", data.leadId);
  if (data.customerId) query = query.eq("customer_id", data.customerId);
  if (data.status && data.status !== "all") query = query.eq("status", data.status);

  query = query.order("created_at", { ascending: false });

  const page = data.page || 1;
  const pageSize = data.pageSize || 20;
  const from = (page - 1) * pageSize;
  const { data: rows, count, error } = await query.range(from, from + pageSize - 1);
  if (error) {
    console.warn("[admin-client] Error loading documents:", error.message);
  }

  return {
    total: count ?? 0,
    page,
    pageSize,
    rows: rows ?? [],
  };
}

// -------------------------------------------------------------
// 10. NOTIFICATIONS
// -------------------------------------------------------------

export async function fetchClientNotifications(data: any = {}) {
  let query = supabase
    .from("admin_notifications")
    .select("*", { count: "exact" });

  if (data.filter === "unread") {
    query = query.eq("is_read", false);
  } else if (data.filter && data.filter !== "all") {
    query = query.eq("type", data.filter);
  }

  if (data.search) {
    const term = String(data.search).replace(/[%,()]/g, " ").trim();
    if (term) {
      query = query.or(`title.ilike.%${term}%,message.ilike.%${term}%`);
    }
  }

  query = query.order("created_at", { ascending: false });

  const page = data.page || 1;
  const pageSize = data.pageSize || 20;
  const from = (page - 1) * pageSize;
  const { data: rows, count, error } = await query.range(from, from + pageSize - 1);
  if (error) {
    console.warn("[admin-client] Error loading notifications:", error.message);
  }

  const { count: unreadCount } = await supabase
    .from("admin_notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  return {
    notifications: rows ?? [],
    total: count ?? 0,
    unreadCount: unreadCount ?? 0,
    page,
    pageSize,
  };
}

export async function fetchClientUnreadCount() {
  const { count } = await supabase
    .from("admin_notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  return { count: count ?? 0 };
}

export async function markClientNotificationRead(id: string, isRead = true) {
  const { error } = await supabase
    .from("admin_notifications")
    .update({ is_read: isRead })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function markAllClientNotificationsRead() {
  const { error } = await supabase
    .from("admin_notifications")
    .update({ is_read: true })
    .eq("is_read", false);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function deleteClientNotification(id: string) {
  const { error } = await supabase
    .from("admin_notifications")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { success: true };
}
