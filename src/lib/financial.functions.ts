import { createServerFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  DEFAULT_FINANCIAL_CONFIG,
  DEFAULT_LOAN_RATES,
  DEFAULT_LENDERS,
  DEFAULT_FINANCIAL_STATISTICS,
  type FinancialShowcaseConfig,
  type LenderItem,
  type LoanRateItem,
} from "@/data/financial";

function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

function supabaseAdmin(): SupabaseClient {
  const url = process.env["SUPABASE_URL"]!;
  const key =
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??
    process.env["SUPABASE_SERVICE_KEY"] ??
    process.env["SUPABASE_ANON_KEY"]!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const getFinancialShowcaseConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<FinancialShowcaseConfig> => {
    try {
      const supabase = publicClient();
      const { data: serviceRow } = await supabase
        .from("cms_services")
        .select("id, slug, data")
        .eq("slug", "financial")
        .maybeSingle();

      const d = (serviceRow?.data ?? {}) as Record<string, unknown>;
      const showcaseData = d["financial_showcase"] as Partial<FinancialShowcaseConfig> | undefined;

      // Check if cms_lenders table exists and has rows
      let lenders: LenderItem[] = DEFAULT_LENDERS;
      try {
        const { data: lenderRows } = await supabase
          .from("cms_lenders")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true });

        if (lenderRows && lenderRows.length > 0) {
          lenders = lenderRows.map((r) => ({
            id: r.id,
            name: r.name,
            type: r.type,
            logo_url: r.logo_url,
            alt_text: r.alt_text,
            website_url: r.website_url,
            supported_loans: r.supported_loans,
            display_text: r.display_text,
            is_active: r.is_active ?? true,
            is_featured: r.is_featured ?? false,
            sort_order: r.sort_order ?? 0,
          }));
        } else if (showcaseData?.lenders && showcaseData.lenders.length > 0) {
          lenders = showcaseData.lenders;
        }
      } catch {
        if (showcaseData?.lenders && showcaseData.lenders.length > 0) {
          lenders = showcaseData.lenders;
        }
      }

      return {
        statistics: {
          funding_facilitated:
            showcaseData?.statistics?.funding_facilitated ??
            DEFAULT_FINANCIAL_STATISTICS.funding_facilitated,
          median_sanction_time:
            showcaseData?.statistics?.median_sanction_time ??
            DEFAULT_FINANCIAL_STATISTICS.median_sanction_time,
          lender_relationships:
            showcaseData?.statistics?.lender_relationships ??
            DEFAULT_FINANCIAL_STATISTICS.lender_relationships,
          best_secured_rate:
            showcaseData?.statistics?.best_secured_rate ??
            DEFAULT_FINANCIAL_STATISTICS.best_secured_rate,
        },
        emi: {
          default_rate:
            showcaseData?.emi?.default_rate ?? DEFAULT_FINANCIAL_CONFIG.emi.default_rate,
          min_amount: showcaseData?.emi?.min_amount ?? DEFAULT_FINANCIAL_CONFIG.emi.min_amount,
          max_amount: showcaseData?.emi?.max_amount ?? DEFAULT_FINANCIAL_CONFIG.emi.max_amount,
          min_years: showcaseData?.emi?.min_years ?? DEFAULT_FINANCIAL_CONFIG.emi.min_years,
          max_years: showcaseData?.emi?.max_years ?? DEFAULT_FINANCIAL_CONFIG.emi.max_years,
          disclaimer: showcaseData?.emi?.disclaimer ?? DEFAULT_FINANCIAL_CONFIG.emi.disclaimer,
        },
        rates:
          showcaseData?.rates && showcaseData.rates.length > 0
            ? showcaseData.rates
            : DEFAULT_LOAN_RATES,
        rate_note: showcaseData?.rate_note ?? DEFAULT_FINANCIAL_CONFIG.rate_note,
        rate_disclaimer: showcaseData?.rate_disclaimer ?? DEFAULT_FINANCIAL_CONFIG.rate_disclaimer,
        partnerships_heading:
          showcaseData?.partnerships_heading ?? DEFAULT_FINANCIAL_CONFIG.partnerships_heading,
        partnerships_description:
          showcaseData?.partnerships_description ??
          DEFAULT_FINANCIAL_CONFIG.partnerships_description,
        lenders,
      };
    } catch {
      return DEFAULT_FINANCIAL_CONFIG;
    }
  },
);

const saveSchema = z.object({
  statistics: z.object({
    funding_facilitated: z.string().trim().min(1),
    median_sanction_time: z.string().trim().min(1),
    lender_relationships: z.string().trim().min(1),
    best_secured_rate: z.string().trim().min(1),
  }),
  emi: z.object({
    default_rate: z.number().min(1).max(50),
    min_amount: z.number().int().min(10000),
    max_amount: z.number().int().min(100000),
    min_years: z.number().int().min(1),
    max_years: z.number().int().min(1),
    disclaimer: z.string().trim(),
  }),
  rates: z.array(
    z.object({
      id: z.string(),
      name: z.string().trim().min(1),
      rate: z.string().trim().min(1),
      display_rate: z.string().trim().min(1),
      tenure: z.string().trim(),
      is_active: z.boolean(),
      sort_order: z.number().int(),
    }),
  ),
  rate_note: z.string().trim(),
  rate_disclaimer: z.string().trim(),
  partnerships_heading: z.string().trim().min(1),
  partnerships_description: z.string().trim().min(1),
  lenders: z.array(
    z.object({
      id: z.string(),
      name: z.string().trim().min(1),
      type: z.enum(["Bank", "NBFC", "Housing Finance Company", "Financial Institution"]),
      logo_url: z.string().nullable().optional(),
      alt_text: z.string().nullable().optional(),
      website_url: z.string().nullable().optional(),
      supported_loans: z.array(z.string()).nullable().optional(),
      display_text: z.string().nullable().optional(),
      is_active: z.boolean(),
      is_featured: z.boolean(),
      sort_order: z.number().int(),
    }),
  ),
});

export const saveFinancialShowcaseConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => saveSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const admin = supabaseAdmin();

    // 1. Fetch current cms_services row for financial
    const { data: serviceRow, error: fetchErr } = await admin
      .from("cms_services")
      .select("id, slug, data")
      .eq("slug", "financial")
      .maybeSingle();

    if (fetchErr || !serviceRow) {
      throw new Error("Could not find cms_services row for financial.");
    }

    const existingData = (serviceRow.data ?? {}) as Record<string, unknown>;
    const updatedData = {
      ...existingData,
      financial_showcase: data,
    };

    // 2. Update cms_services row
    const { error: updateErr } = await admin
      .from("cms_services")
      .update({
        data: updatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", serviceRow.id);

    if (updateErr) {
      throw new Error(`Failed to update cms_services: ${updateErr.message}`);
    }

    // 3. Try to sync cms_lenders table if it exists
    try {
      for (const lender of data.lenders) {
        // Validate uuid or generate one
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          lender.id,
        );
        const id = isUuid ? lender.id : crypto.randomUUID();

        await admin.from("cms_lenders").upsert({
          id,
          name: lender.name,
          type: lender.type,
          logo_url: lender.logo_url ?? null,
          alt_text: lender.alt_text ?? lender.name,
          website_url: lender.website_url ?? null,
          supported_loans: lender.supported_loans ?? [],
          display_text: lender.display_text ?? null,
          is_active: lender.is_active,
          is_featured: lender.is_featured,
          sort_order: lender.sort_order,
          updated_at: new Date().toISOString(),
        });
      }
    } catch {
      // If table does not exist or schema cache pending, data is safely persisted in data.financial_showcase
    }

    return { ok: true };
  });
