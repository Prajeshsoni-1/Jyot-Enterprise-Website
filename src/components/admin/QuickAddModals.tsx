"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { X, Inbox, Building2 } from "lucide-react";
import { adminCreateLead } from "@/lib/admin.functions";
import { createCustomer } from "@/lib/crm.functions";
import { DIVISION_LABEL, DIVISION_OPTIONS } from "./ui";

export function QuickAddLeadModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const createFn = useServerFn(adminCreateLead);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [division, setDivision] = useState<"financial" | "it" | "legal" | "engineering">(
    "financial",
  );
  const [service, setService] = useState("");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Please provide a contact name and phone number.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await createFn({
        data: {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          division,
          service: service.trim() || `${DIVISION_LABEL[division]} Consultation`,
          priority,
          message: message.trim(),
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      onClose();
      if (onSuccess) onSuccess(res.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create lead.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-60";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-3xl border border-border bg-background p-6 shadow-2xl space-y-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
              <Inbox className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-ink">New Enquiry / Lead</h3>
              <p className="text-xs text-muted-foreground">
                Add a walk-in, phone call or direct client enquiry.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-border p-1.5 text-muted-foreground hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error ? (
          <p className="rounded-xl bg-destructive/10 px-3.5 py-2.5 text-xs font-semibold text-destructive">
            {error}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-ink">Full Name *</span>
              <input
                required
                disabled={busy}
                placeholder="e.g. Ramesh Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink">Phone Number *</span>
              <input
                required
                disabled={busy}
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-ink">Email (Optional)</span>
              <input
                type="email"
                disabled={busy}
                placeholder="ramesh@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink">Department</span>
              <select
                disabled={busy}
                value={division}
                onChange={(e) => setDivision(e.target.value as typeof division)}
                className={inputClass}
              >
                {DIVISION_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {DIVISION_LABEL[d]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-ink">Service / Topic</span>
              <input
                disabled={busy}
                placeholder="e.g. Industrial Machinery Loan"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink">Priority</span>
              <select
                disabled={busy}
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
                className={inputClass}
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-ink">Enquiry Details / Initial Notes</span>
            <textarea
              rows={3}
              disabled={busy}
              placeholder="Requirement summary, budget or caller comments…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={inputClass}
            />
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/90"
            >
              {busy ? "Saving…" : "Create Enquiry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function QuickAddCustomerModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const createCustomerFn = useServerFn(createCustomer);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [city, setCity] = useState("");
  const [division, setDivision] = useState("financial");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a customer name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await createCustomerFn({
        data: {
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          company: company.trim() || null,
          city: city.trim() || null,
          division: division || null,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      onClose();
      if (onSuccess) onSuccess(res.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create customer.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-60";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-3xl border border-border bg-background p-6 shadow-2xl space-y-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-ink">New Customer</h3>
              <p className="text-xs text-muted-foreground">
                Directly register a corporate or individual client account.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-border p-1.5 text-muted-foreground hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error ? (
          <p className="rounded-xl bg-destructive/10 px-3.5 py-2.5 text-xs font-semibold text-destructive">
            {error}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-ink">Full Name *</span>
              <input
                required
                disabled={busy}
                placeholder="e.g. Anjali Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink">Company / Enterprise</span>
              <input
                disabled={busy}
                placeholder="e.g. Apex Industries Pvt Ltd"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-ink">Email</span>
              <input
                type="email"
                disabled={busy}
                placeholder="anjali@apexind.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink">Phone</span>
              <input
                disabled={busy}
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-ink">City / Location</span>
              <input
                disabled={busy}
                placeholder="e.g. Ahmedabad / Gandhinagar"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink">Primary Department</span>
              <select
                disabled={busy}
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className={inputClass}
              >
                {DIVISION_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {DIVISION_LABEL[d]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-secondary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/90"
            >
              {busy ? "Saving…" : "Save Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
