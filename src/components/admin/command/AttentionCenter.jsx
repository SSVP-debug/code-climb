import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCircle2 } from "lucide-react";
import { useAdminAttentionItems } from "../../../hooks/useAdminAttentionItems";

const TONE_DOT = {
  down: "bg-verdict-reject",
  degraded: "bg-verdict-pending",
  pending: "bg-verdict-pending",
};

/**
 * AttentionCenter — JARVIS pass, spec §5: "the notification icon should
 * not be decorative... bring [Overview's Attention Required] into the
 * global admin shell." Reuses useAdminAttentionItems (same real data as
 * AttentionRequiredSection on Overview — degraded/down services from
 * system-health, pending recruiter/TPO approvals from dashboard-metrics).
 * No new endpoint, no synthetic alert feed.
 *
 * Deliberately a distinct icon from Navbar's NotificationBell — that one
 * is the student-facing achievement/activity feed (GET /api/notifications)
 * and stays exactly as-is; this is admin-operational attention, a
 * different data source entirely, so folding them into one icon would
 * either mislabel one or force a fake merge.
 */
export default function AttentionCenter({ className = "" }) {
  const { items, loading } = useAdminAttentionItems();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={items.length > 0 ? `Attention: ${items.length} item${items.length === 1 ? "" : "s"}` : "Attention: all clear"}
        className="relative p-2 rounded-full border border-zinc-800 bg-ink-900/80 text-zinc-400 hover:text-white hover:border-zinc-700 transition"
      >
        <Bell size={15} />
        {items.length > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-verdict-reject text-[10px] font-bold text-white leading-none">
            {items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 z-50 rounded-xl border border-zinc-800 bg-ink-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 p-3 animate-fadeIn">
          <p className="px-1 pb-2 text-[10px] uppercase tracking-widest text-zinc-500 font-semibold border-b border-zinc-800 mb-2">
            Attention
          </p>

          {loading && items.length === 0 ? (
            <p className="px-1 py-4 text-center text-xs text-zinc-600">Checking…</p>
          ) : items.length === 0 ? (
            <div className="flex items-center gap-2.5 px-1 py-3 text-sm text-zinc-400">
              <CheckCircle2 size={15} className="text-verdict-accept shrink-0" />
              <span>
                <span className="block text-white text-xs font-semibold">All clear</span>
                Nothing requires your attention.
              </span>
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800/80 transition"
                  >
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${TONE_DOT[item.tone] || "bg-zinc-500"}`} />
                    <span className="flex-1">{item.label}</span>
                    <span className="text-zinc-500">{item.cta}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
