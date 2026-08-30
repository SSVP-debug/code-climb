import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, X } from "lucide-react";

/**
 * SideDrawer — Command Center interaction-design ask (Phase 15: "use
 * drawers/modals/context panels instead of unnecessary page navigation").
 * One shared primitive so Users/Colleges/Problems all get the same
 * open/close motion and layout instead of three bespoke implementations.
 * Deliberately fast (200ms) per Phase 14 — "fast > cinematic."
 *
 * `size="lg"` exists for Problems specifically — ProblemForm is a full
 * problem editor (statement, examples, constraints, test cases), which
 * doesn't fit usefully in the default 420px intelligence-panel width.
 *
 * JARVIS pass, spec §10/§21: standardized dialog behavior added here once
 * so every consumer (Users/Colleges/Problems) gets it for free —
 *   - Escape closes the drawer.
 *   - Focus moves into the drawer on open (close button) and is trapped
 *     inside it (Tab/Shift+Tab wrap) while open, per WAI-ARIA dialog
 *     pattern — previously absent, so keyboard/screen-reader users could
 *     tab straight into the page behind the open drawer.
 *   - Focus returns to whatever triggered the drawer (the row that was
 *     clicked) on close, so keyboard navigation isn't lost.
 *   - Reduced-motion users get an instant open/close instead of the
 *     slide/fade transition.
 */
const SIZE_CLASSES = {
  md: "sm:w-[420px]",
  lg: "sm:w-[640px] lg:w-[760px]",
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function SideDrawer({ open, onClose, title, eyebrow, size = "md", children }) {
  const panelRef = useRef(null);
  const closeBtnRef = useRef(null);
  const triggerRef = useRef(null);
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    requestAnimationFrame(() => closeBtnRef.current?.focus());

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to whatever opened the drawer (e.g. the table row).
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.15 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
            role="presentation"
          />
          <motion.div
            ref={panelRef}
            initial={{ x: reducedMotion ? 0 : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: reducedMotion ? 0 : "100%" }}
            transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
            className={`fixed top-0 right-0 bottom-0 w-full ${SIZE_CLASSES[size]} bg-[var(--background)] border-l border-[var(--border)] z-50 overflow-y-auto`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="sticky top-0 bg-[var(--background)]/95 backdrop-blur border-b border-[var(--border)] px-5 py-4 flex items-start justify-between gap-3 z-10">
              <div className="min-w-0">
                {eyebrow && (
                  <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] font-semibold mb-1">
                    {eyebrow}
                  </p>
                )}
                <h2 className="text-[var(--foreground)] font-bold text-lg truncate">{title}</h2>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-elevated)] transition shrink-0"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function DrawerSection({ label, children }) {
  return (
    <div className="mb-6">
      <p className="text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] font-semibold mb-2.5">{label}</p>
      {children}
    </div>
  );
}

export function DrawerField({ label, value, copyable = false }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (permissions/insecure context) — no
      // fallback copy trick worth the complexity for an admin-only panel.
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-[var(--border)] last:border-0">
      <span className="text-[var(--muted-foreground)] text-sm shrink-0">{label}</span>
      <span className="flex items-center gap-1.5 min-w-0">
        <span className="text-[var(--foreground)] text-sm text-right truncate">{value ?? "—"}</span>
        {copyable && value && (
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? `${label} copied` : `Copy ${label}`}
            className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-elevated)] transition shrink-0"
          >
            {copied ? <Check size={12} className="text-verdict-accept" /> : <Copy size={12} />}
          </button>
        )}
      </span>
    </div>
  );
}