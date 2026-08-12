import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

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
 */
const SIZE_CLASSES = {
  md: "sm:w-[420px]",
  lg: "sm:w-[640px] lg:w-[760px]",
};

export default function SideDrawer({ open, onClose, title, eyebrow, size = "md", children }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
            role="presentation"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`fixed top-0 right-0 bottom-0 w-full ${SIZE_CLASSES[size]} bg-ink-950 border-l border-zinc-800 z-50 overflow-y-auto`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="sticky top-0 bg-ink-950/95 backdrop-blur border-b border-zinc-800 px-5 py-4 flex items-start justify-between gap-3 z-10">
              <div className="min-w-0">
                {eyebrow && (
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-1">
                    {eyebrow}
                  </p>
                )}
                <h2 className="text-white font-bold text-lg truncate">{title}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition shrink-0"
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
      <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold mb-2.5">{label}</p>
      {children}
    </div>
  );
}

export function DrawerField({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-zinc-900 last:border-0">
      <span className="text-zinc-500 text-sm">{label}</span>
      <span className="text-zinc-200 text-sm text-right truncate">{value ?? "—"}</span>
    </div>
  );
}
