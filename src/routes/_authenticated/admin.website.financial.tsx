"use client";

import { createFileRoute } from "@tanstack/react-router";
import { FinancialServiceEditor } from "@/components/admin/FinancialServiceEditor";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/website/financial")({
  head: () => ({
    meta: pageMeta({
      title: "Financial Services & Loans CMS — Jyot Enterprise",
      description: "Manage financial showcase rates, statistics, and bank partner network.",
      path: "/admin/website/financial",
      noindex: true,
    }),
  }),
  component: AdminFinancialRoute,
});

function AdminFinancialRoute() {
  return <FinancialServiceEditor id="financial" />;
}
