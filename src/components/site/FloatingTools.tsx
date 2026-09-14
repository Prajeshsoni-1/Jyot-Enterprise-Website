"use client";

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, CalendarDays, MessageCircle, PhoneCall, Plus, X } from "lucide-react";
import { CONTACT } from "@/data/site";

/**
 * Floating business tools: WhatsApp, call, book a meeting, quick inquiry and
 * scroll-to-top. Collapsed by default so it never competes with page content.
 */
export function FloatingTools() {
  const [open, setOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const item =
    "flex items-center gap-3 rounded-full bg-card px-4 py-2.5 text-sm font-semibold text-ink shadow-lift ring-1 ring-border transition-colors hover:text-primary";

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      <AnimatePresence>
        {showTop ? (
          <motion.button
            key="top"
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Scroll back to top"
            className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-card text-ink shadow-lift ring-1 ring-border transition-colors hover:text-primary"
          >
            <ArrowUp className="h-4 w-4" />
          </motion.button>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="tools"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex flex-col items-end gap-2"
          >
            <a href={CONTACT.whatsapp} target="_blank" rel="noreferrer noopener" className={item}>
              <MessageCircle className="h-4 w-4 text-growth" /> WhatsApp · {CONTACT.phone}
            </a>
            <a href={CONTACT.whatsapp2} target="_blank" rel="noreferrer noopener" className={item}>
              <MessageCircle className="h-4 w-4 text-growth" /> WhatsApp · {CONTACT.phone2}
            </a>
            <a href={CONTACT.phoneHref} className={item}>
              <PhoneCall className="h-4 w-4 text-primary" /> Call us
            </a>
            <Link to="/book" className={item} onClick={() => setOpen(false)}>
              <CalendarDays className="h-4 w-4 text-primary" /> Book a meeting
            </Link>
            <Link to="/contact" className={item} onClick={() => setOpen(false)}>
              <Plus className="h-4 w-4 text-primary" /> Quick inquiry
            </Link>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close quick contact tools" : "Open quick contact tools"}
        className="pointer-events-auto grid h-13 w-13 min-h-12 min-w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-ember transition-transform hover:-translate-y-0.5"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </div>
  );
}
