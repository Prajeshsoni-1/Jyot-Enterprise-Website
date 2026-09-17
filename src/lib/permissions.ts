/**
 * Jyot Enterprise Suite — Granular Role & Permission System
 *
 * Provides a 4-tier role hierarchy (OWNER > ADMIN > MANAGER > STAFF) with
 * fine-grained module-and-action level permissions, role defaults, custom user
 * overrides, and deterministic permission calculation.
 */

export type Role = "owner" | "admin" | "manager" | "staff";

export type AccountStatus = "active" | "inactive";

export const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 4,
  admin: 3,
  manager: 2,
  staff: 1,
};

export function isRoleAtLeast(userRole: Role, requiredRole: Role): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0);
}

export function isRoleStrictlyAbove(roleA: Role, roleB: Role): boolean {
  return (ROLE_HIERARCHY[roleA] ?? 0) > (ROLE_HIERARCHY[roleB] ?? 0);
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Administrator",
  manager: "Manager",
  staff: "Staff",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: "Full system access, complete user and permission control. Unrestricted.",
  admin: "Broad administrative control across content, business, and team management.",
  manager: "Operational management of assigned leads, bookings, tasks, and content.",
  staff: "Restricted operational access to execute daily tasks and assigned workflows.",
};

/* ----------------------------- Modules & Actions ------------------------- */

export type PermissionCategory = "CONTENT" | "BUSINESS" | "WEBSITE" | "SYSTEM";

export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "publish"
  | "export"
  | "manage";

export interface ActionDef {
  action: PermissionAction;
  label: string;
  description: string;
}

export interface ModuleDef {
  id: string;
  name: string;
  category: PermissionCategory;
  description: string;
  actions: ActionDef[];
}

export const PERMISSION_MODULES: ModuleDef[] = [
  // --- CONTENT ---
  {
    id: "services",
    name: "Services",
    category: "CONTENT",
    description: "Practice offerings, sub-services, and catalog deliverables.",
    actions: [
      { action: "view", label: "View Services", description: "Browse published and draft services" },
      { action: "create", label: "Create Services", description: "Draft new practice services" },
      { action: "edit", label: "Edit Services", description: "Update descriptions, deliverables, and fees" },
      { action: "delete", label: "Delete Services", description: "Remove services permanently" },
      { action: "publish", label: "Publish Services", description: "Make service revisions live" },
    ],
  },
  {
    id: "blogs",
    name: "Blogs & Insights",
    category: "CONTENT",
    description: "Corporate blog articles, sector reports, and guides.",
    actions: [
      { action: "view", label: "View Blogs", description: "Read blog drafts and published articles" },
      { action: "create", label: "Create Blogs", description: "Draft new editorial articles" },
      { action: "edit", label: "Edit Blogs", description: "Edit article content, meta tags, and excerpts" },
      { action: "delete", label: "Delete Blogs", description: "Delete articles permanently" },
      { action: "publish", label: "Publish Blogs", description: "Publish or unpublish articles" },
    ],
  },
  {
    id: "downloads",
    name: "Downloads & PDFs",
    category: "CONTENT",
    description: "Downloadable PDF brochures, checklists, and document guides.",
    actions: [
      { action: "view", label: "View Downloads", description: "View download catalogue and files" },
      { action: "create", label: "Upload PDFs", description: "Upload new PDFs to document storage" },
      { action: "edit", label: "Edit Downloads", description: "Update download titles and associations" },
      { action: "delete", label: "Delete Downloads", description: "Remove downloads from website" },
      { action: "publish", label: "Publish Downloads", description: "Make PDFs available for public download" },
    ],
  },
  {
    id: "media",
    name: "Media Library",
    category: "CONTENT",
    description: "Brand assets, document storage, and corporate images.",
    actions: [
      { action: "view", label: "View Media", description: "Browse uploaded assets in media library" },
      { action: "create", label: "Upload Media", description: "Upload images, vectors, and documents" },
      { action: "delete", label: "Delete Media", description: "Delete media files from storage" },
      { action: "manage", label: "Manage Storage", description: "Configure storage buckets and folders" },
    ],
  },
  {
    id: "jobs",
    name: "Careers & Jobs",
    category: "CONTENT",
    description: "Job vacancies, recruitment postings, and applicant files.",
    actions: [
      { action: "view", label: "View Jobs", description: "Browse internal job requisitions" },
      { action: "create", label: "Create Jobs", description: "Post new career openings" },
      { action: "edit", label: "Edit Jobs", description: "Modify requirements, locations, and roles" },
      { action: "delete", label: "Delete Jobs", description: "Archive or delete job listings" },
      { action: "publish", label: "Publish Jobs", description: "Publish jobs on the public careers page" },
      { action: "manage", label: "Manage Applications", description: "View candidate resumes and scorecards" },
    ],
  },

  // --- BUSINESS OPERATIONS ---
  {
    id: "enquiries",
    name: "Enquiries & Leads",
    category: "BUSINESS",
    description: "Incoming client enquiries, project requests, and consultation leads.",
    actions: [
      { action: "view", label: "View Enquiries", description: "View leads and contact submissions" },
      { action: "create", label: "Log Enquiry", description: "Manually log a phone/in-person enquiry" },
      { action: "edit", label: "Edit Enquiry", description: "Update status, notes, and priority" },
      { action: "delete", label: "Archive / Delete", description: "Archive or permanently delete leads" },
      { action: "manage", label: "Assign Leads", description: "Assign enquiries to team members" },
    ],
  },
  {
    id: "customers",
    name: "Customers & Accounts",
    category: "BUSINESS",
    description: "Client business entities, contact persons, and mandate history.",
    actions: [
      { action: "view", label: "View Customers", description: "Browse corporate client records" },
      { action: "create", label: "Create Customer", description: "Register new business clients" },
      { action: "edit", label: "Edit Customer", description: "Update customer records and contacts" },
      { action: "delete", label: "Delete Customer", description: "Remove customer records" },
    ],
  },
  {
    id: "bookings",
    name: "Bookings & Consultations",
    category: "BUSINESS",
    description: "Scheduled consultation appointments across business desks.",
    actions: [
      { action: "view", label: "View Bookings", description: "View consultation calendar and schedule" },
      { action: "create", label: "Create Booking", description: "Schedule a consultation on client behalf" },
      { action: "edit", label: "Edit Booking", description: "Reschedule or update booking notes" },
      { action: "delete", label: "Cancel Booking", description: "Cancel appointment requests" },
      { action: "manage", label: "Manage Status", description: "Mark completed, no-show, or rescheduled" },
    ],
  },
  {
    id: "tasks",
    name: "Tasks & Follow-ups",
    category: "BUSINESS",
    description: "Internal desk tasks, client follow-up reminders, and milestones.",
    actions: [
      { action: "view", label: "View Tasks", description: "View task lists and reminders" },
      { action: "create", label: "Create Task", description: "Add new task or follow-up item" },
      { action: "edit", label: "Edit Task", description: "Update task status, due dates, and notes" },
      { action: "delete", label: "Delete Task", description: "Remove tasks and follow-ups" },
      { action: "manage", label: "Assign Tasks", description: "Assign tasks to other team members" },
    ],
  },

  // --- WEBSITE & SEO ---
  {
    id: "website",
    name: "Website Management",
    category: "WEBSITE",
    description: "Homepage, navigation, footer, case studies, industries, and testimonials.",
    actions: [
      { action: "view", label: "View Website CMS", description: "Browse website modules and preview pages" },
      { action: "edit", label: "Edit Website Content", description: "Update page content, copy, and testimonials" },
      { action: "publish", label: "Publish Website", description: "Deploy page content live to public site" },
    ],
  },
  {
    id: "seo",
    name: "SEO & Metadata",
    category: "WEBSITE",
    description: "Search engine optimization, XML sitemaps, robots.txt, and metadata.",
    actions: [
      { action: "view", label: "View SEO Settings", description: "Review meta tags, canonicals, and sitemaps" },
      { action: "edit", label: "Edit SEO", description: "Configure meta tags, titles, and robots.txt" },
    ],
  },

  // --- SYSTEM & SECURITY ---
  {
    id: "system",
    name: "System & Administration",
    category: "SYSTEM",
    description: "User accounts, team roles, permission matrix, and site settings.",
    actions: [
      { action: "view", label: "View Team & System", description: "View registered accounts and settings" },
      { action: "create", label: "Create User Accounts", description: "Add new admin/team accounts" },
      { action: "edit", label: "Edit Users & Settings", description: "Update account profiles and site settings" },
      { action: "delete", label: "Delete Accounts", description: "Delete admin and staff user accounts" },
      { action: "manage", label: "Manage Permissions", description: "Configure roles and granular permissions" },
    ],
  },
];

/* -------------------------- Role Default Matrix -------------------------- */

export const ALL_PERMISSION_KEYS: string[] = PERMISSION_MODULES.flatMap((m) =>
  m.actions.map((a) => `${m.id}.${a.action}`),
);

export const ROLE_DEFAULTS: Record<Role, string[]> = {
  // OWNER has full wildcard access
  owner: [...ALL_PERMISSION_KEYS],

  // ADMIN has broad access across content, business, website, and team (with owner safeguards)
  admin: [
    // Content
    "services.view", "services.create", "services.edit", "services.delete", "services.publish",
    "blogs.view", "blogs.create", "blogs.edit", "blogs.delete", "blogs.publish",
    "downloads.view", "downloads.create", "downloads.edit", "downloads.delete", "downloads.publish",
    "media.view", "media.create", "media.delete", "media.manage",
    "jobs.view", "jobs.create", "jobs.edit", "jobs.delete", "jobs.publish", "jobs.manage",
    // Business
    "enquiries.view", "enquiries.create", "enquiries.edit", "enquiries.delete", "enquiries.manage",
    "customers.view", "customers.create", "customers.edit", "customers.delete",
    "bookings.view", "bookings.create", "bookings.edit", "bookings.delete", "bookings.manage",
    "tasks.view", "tasks.create", "tasks.edit", "tasks.delete", "tasks.manage",
    // Website & SEO
    "website.view", "website.edit", "website.publish",
    "seo.view", "seo.edit",
    // System
    "system.view", "system.create", "system.edit", "system.manage",
  ],

  // MANAGER has operational lead desk, bookings, customers, tasks, and content editing
  manager: [
    // Content
    "services.view",
    "blogs.view", "blogs.create", "blogs.edit",
    "downloads.view", "downloads.create",
    "media.view", "media.create",
    "jobs.view", "jobs.manage",
    // Business
    "enquiries.view", "enquiries.create", "enquiries.edit", "enquiries.manage",
    "customers.view", "customers.create", "customers.edit",
    "bookings.view", "bookings.create", "bookings.edit", "bookings.manage",
    "tasks.view", "tasks.create", "tasks.edit", "tasks.manage",
    // Website
    "website.view",
  ],

  // STAFF has restricted day-to-day operational execution
  staff: [
    // Content (view only)
    "services.view",
    "blogs.view",
    "downloads.view",
    "media.view",
    // Business (assigned work)
    "enquiries.view", "enquiries.edit",
    "customers.view",
    "bookings.view",
    "tasks.view", "tasks.edit",
  ],
};

/* --------------------- Effective Permission Calculation ------------------ */

export type UserPermissionOverrides = Record<string, boolean>;

/**
 * Calculates the exact effective permissions for a user:
 * 1. If role is 'owner', returns ALL permissions unconditionally.
 * 2. Otherwise, starts with ROLE_DEFAULTS[role].
 * 3. Adds explicitly granted overrides (override === true).
 * 4. Removes explicitly revoked overrides (override === false).
 */
export function calculateEffectivePermissions(
  role: Role,
  overrides?: UserPermissionOverrides | null,
): Set<string> {
  if (role === "owner") {
    return new Set(ALL_PERMISSION_KEYS);
  }

  const base = new Set(ROLE_DEFAULTS[role] ?? []);

  if (overrides) {
    for (const [permKey, granted] of Object.entries(overrides)) {
      if (granted) {
        base.add(permKey);
      } else {
        base.delete(permKey);
      }
    }
  }

  return base;
}

/**
 * Checks whether an effective permission set contains the specified module and action.
 */
export function hasPermission(
  effectivePermissions: Set<string> | string[] | undefined | null,
  module: string,
  action: PermissionAction,
): boolean {
  if (!effectivePermissions) return false;
  if (effectivePermissions instanceof Set) {
    if (
      effectivePermissions.has("*") ||
      effectivePermissions.has("all") ||
      effectivePermissions.has(`${module}.*`) ||
      effectivePermissions.has(`${module}.all`)
    ) {
      return true;
    }
    const key = `${module}.${action}`;
    return effectivePermissions.has(key) || effectivePermissions.has(`${module}.manage`);
  }
  if (
    effectivePermissions.includes("*") ||
    effectivePermissions.includes("all") ||
    effectivePermissions.includes(`${module}.*`) ||
    effectivePermissions.includes(`${module}.all`)
  ) {
    return true;
  }
  const key = `${module}.${action}`;
  return (
    effectivePermissions.includes(key) || effectivePermissions.includes(`${module}.manage`)
  );
}

/**
 * Normalizes a database role string (e.g. 'admin') to an application Role.
 */
export function normalizeRole(rawRole: string | null | undefined): Role {
  if (!rawRole) return "staff";
  const lower = rawRole.toLowerCase().trim();
  if (lower === "owner") return "owner";
  if (lower === "admin") return "admin";
  if (lower === "manager") return "manager";
  return "staff";
}
