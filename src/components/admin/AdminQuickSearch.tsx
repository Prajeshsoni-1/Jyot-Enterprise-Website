"use client";

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Search,
  X,
  ArrowLeft,
  Inbox,
  Building2,
  Briefcase,
  Layers,
  FileText,
  HelpCircle,
  FolderKanban,
  Sparkles,
} from "lucide-react";
import { listEnquiries } from "@/lib/admin.functions";
import { listCustomers } from "@/lib/crm.functions";
import { cmsList } from "@/lib/cms.functions";

type SearchResultItem = {
  id: string;
  title: string;
  subtitle?: string;
  category: "Lead" | "Customer" | "Product" | "Service" | "Job" | "Blog" | "FAQ" | "Portfolio";
  to: string;
  params?: Record<string, string>;
};

export function AdminQuickSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const fetchLeads = useServerFn(listEnquiries);
  const fetchCustomers = useServerFn(listCustomers);
  const fetchCms = useServerFn(cmsList);

  const leadsQuery = useQuery({
    enabled: isOpen && query.trim().length >= 2,
    queryKey: ["admin", "search", "leads", query],
    queryFn: () => fetchLeads({ data: { search: query, pageSize: 4 } }),
    staleTime: 10_000,
  });

  const customersQuery = useQuery({
    enabled: isOpen && query.trim().length >= 2,
    queryKey: ["admin", "search", "customers", query],
    queryFn: () => fetchCustomers({ data: { search: query, pageSize: 4 } as any }),
    staleTime: 10_000,
  });

  const productsQuery = useQuery({
    enabled: isOpen && query.trim().length >= 2,
    queryKey: ["admin", "search", "products", query],
    queryFn: () => fetchCms({ data: { module: "products", search: query, status: "all" } }),
    staleTime: 10_000,
  });

  const servicesQuery = useQuery({
    enabled: isOpen && query.trim().length >= 2,
    queryKey: ["admin", "search", "services", query],
    queryFn: () => fetchCms({ data: { module: "services", search: query, status: "all" } }),
    staleTime: 10_000,
  });

  const jobsQuery = useQuery({
    enabled: isOpen && query.trim().length >= 2,
    queryKey: ["admin", "search", "jobs", query],
    queryFn: () => fetchCms({ data: { module: "jobs", search: query, status: "all" } }),
    staleTime: 10_000,
  });

  const postsQuery = useQuery({
    enabled: isOpen && query.trim().length >= 2,
    queryKey: ["admin", "search", "posts", query],
    queryFn: () => fetchCms({ data: { module: "posts", search: query, status: "all" } }),
    staleTime: 10_000,
  });

  const faqsQuery = useQuery({
    enabled: isOpen && query.trim().length >= 2,
    queryKey: ["admin", "search", "faqs", query],
    queryFn: () => fetchCms({ data: { module: "faqs", search: query, status: "all" } }),
    staleTime: 10_000,
  });

  const results: SearchResultItem[] = useMemo(() => {
    const list: SearchResultItem[] = [];

    (leadsQuery.data?.rows ?? []).forEach((l: any) => {
      list.push({
        id: `lead-${l.id}`,
        title: l.name,
        subtitle: `${l.reference} · ${l.division} · ${l.status}`,
        category: "Lead",
        to: `/admin/enquiries/${l.id}`,
      });
    });

    (customersQuery.data?.rows ?? []).forEach((c: any) => {
      list.push({
        id: `customer-${c.id}`,
        title: c.name,
        subtitle: `${c.company || "Individual"} · ${c.email || c.phone || "No direct contact"}`,
        category: "Customer",
        to: `/admin/customers/${c.id}`,
      });
    });

    (productsQuery.data?.rows ?? []).forEach((p: any) => {
      list.push({
        id: `product-${p.id}`,
        title: p.title || p.slug,
        subtitle: `/${p.slug} · Status: ${p.status}`,
        category: "Product",
        to: `/admin/website/products/${p.id}`,
      });
    });

    (servicesQuery.data?.rows ?? []).forEach((s: any) => {
      list.push({
        id: `service-${s.id}`,
        title: s.title || s.slug,
        subtitle: `/${s.slug} · Status: ${s.status}`,
        category: "Service",
        to: `/admin/website/services/${s.id}`,
      });
    });

    (jobsQuery.data?.rows ?? []).forEach((j: any) => {
      list.push({
        id: `job-${j.id}`,
        title: j.title || j.slug,
        subtitle: `${j.department || "General"} · ${j.location || "Remote"} · ${j.status}`,
        category: "Job",
        to: `/admin/website/jobs/${j.id}`,
      });
    });

    (postsQuery.data?.rows ?? []).forEach((b: any) => {
      list.push({
        id: `blog-${b.id}`,
        title: b.title || b.slug,
        subtitle: `Author: ${b.author || "Jyot Editorial"} · Status: ${b.status}`,
        category: "Blog",
        to: `/admin/website/posts/${b.id}`,
      });
    });

    (faqsQuery.data?.rows ?? []).forEach((f: any) => {
      list.push({
        id: `faq-${f.id}`,
        title: f.question,
        subtitle: `Category: ${f.category || "General"}`,
        category: "FAQ",
        to: `/admin/website/faqs/${f.id}`,
      });
    });

    return list;
  }, [
    leadsQuery.data,
    customersQuery.data,
    productsQuery.data,
    servicesQuery.data,
    jobsQuery.data,
    postsQuery.data,
    faqsQuery.data,
  ]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < results.length ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  if (!isOpen) return null;

  function handleSelect(item: SearchResultItem) {
    onClose();
    navigate({ to: item.to as any });
  }

  function getIcon(category: SearchResultItem["category"]) {
    switch (category) {
      case "Lead":
        return <Inbox className="h-4 w-4 text-sky-600" />;
      case "Customer":
        return <Building2 className="h-4 w-4 text-emerald-600" />;
      case "Product":
        return <Layers className="h-4 w-4 text-indigo-600" />;
      case "Service":
        return <Sparkles className="h-4 w-4 text-purple-600" />;
      case "Job":
        return <Briefcase className="h-4 w-4 text-amber-600" />;
      case "Blog":
        return <FileText className="h-4 w-4 text-rose-600" />;
      case "FAQ":
        return <HelpCircle className="h-4 w-4 text-teal-600" />;
      default:
        return <FolderKanban className="h-4 w-4 text-muted-foreground" />;
    }
  }

  const isSearching =
    leadsQuery.isLoading ||
    customersQuery.isLoading ||
    productsQuery.isLoading ||
    servicesQuery.isLoading ||
    jobsQuery.isLoading;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl border border-border bg-background shadow-2xl overflow-hidden flex flex-col max-h-[80vh] cursor-default"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5 sm:px-4 sm:py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-ink transition"
            title="Back / Close (Esc)"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <Search className="h-4 w-4 text-muted-foreground shrink-0" />

          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads, customers, products, services, jobs, blogs…"
            className="flex-1 bg-transparent text-sm sm:text-base outline-none text-ink placeholder:text-muted-foreground"
          />

          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-ink transition"
              title="Clear search text"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-bold text-ink hover:bg-secondary transition shadow-2xs"
            title="Close search modal (Esc)"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Close</span>
            <kbd className="hidden sm:inline-block rounded bg-background border border-border px-1 py-0.2 text-[0.6rem] text-muted-foreground">
              ESC
            </kbd>
          </button>
        </div>

        <div className="overflow-y-auto p-2 flex-1 divide-y divide-border/40">
          {query.trim().length < 2 ? (
            <div className="px-6 py-12 text-center text-xs text-muted-foreground">
              Type at least 2 characters to search across all business records and website content.
            </div>
          ) : isSearching && results.length === 0 ? (
            <div className="px-6 py-12 text-center text-xs text-muted-foreground">
              Searching database records…
            </div>
          ) : results.length === 0 ? (
            <div className="px-6 py-12 text-center text-xs text-muted-foreground">
              No results found for “<span className="font-semibold text-ink">{query}</span>”.
            </div>
          ) : (
            <ul className="space-y-1">
              {results.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl text-left transition ${
                        isSelected ? "bg-primary/10 text-primary" : "hover:bg-secondary/60 text-ink"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-background border border-border shadow-xs">
                          {getIcon(item.category)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate leading-tight">
                            {item.title}
                          </p>
                          {item.subtitle ? (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {item.subtitle}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-secondary border border-border px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
                        {item.category}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-border bg-secondary/30 px-4 py-2.5 flex items-center justify-between text-[0.75rem] text-muted-foreground">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-ink transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back / Close
          </button>
          <div className="flex items-center gap-3">
            <span>
              Navigate:{" "}
              <kbd className="font-semibold px-1 rounded bg-background border border-border">↑</kbd>{" "}
              <kbd className="font-semibold px-1 rounded bg-background border border-border">↓</kbd>
            </span>
            <span>
              Open:{" "}
              <kbd className="font-semibold px-1.5 rounded bg-background border border-border">
                Enter
              </kbd>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
