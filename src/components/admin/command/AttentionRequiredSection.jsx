import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useAdminAttentionItems } from "../../../hooks/useAdminAttentionItems";

/**
 * AttentionRequiredSection — Command Center transformation, Overview
 * Phase 3. Distinct from CommandCenterHero's alert chips (which live in
 * the top status strip): this is a dedicated "what do I need to act on"
 * list, each row a real actionable item with a real destination.
 *
 * JARVIS pass: item-building logic now lives in useAdminAttentionItems
 * (shared with the global AttentionCenter in the command bar) rather than
 * duplicated here — single source of truth, see that hook's header comment.
 */
export default function AttentionRequiredSection() {
  const { items } = useAdminAttentionItems();

  return (
    <section className="mb-10">
      <h2 className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] font-semibold mb-3">
        Attention required
      </h2>

      {items.length === 0 ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 text-sm text-[var(--muted-foreground)]">
          <CheckCircle2 size={16} className="text-verdict-accept shrink-0" />
          All systems clear. Nothing requires your attention right now.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            const toneCls =
              item.tone === "down"
                ? "border-verdict-reject/25 bg-verdict-reject/5"
                : item.tone === "degraded"
                ? "border-verdict-pending/25 bg-verdict-pending/5"
                : "border-verdict-pending/20 bg-[var(--surface)]";
            return (
              <Link
                key={item.id}
                to={item.to}
                className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition hover:brightness-110 ${toneCls}`}
              >
                <span className="flex items-center gap-2.5 text-sm text-[var(--foreground)]">
                  <Icon
                    size={16}
                    className={
                      item.tone === "down"
                        ? "text-verdict-reject"
                        : item.tone === "degraded"
                        ? "text-verdict-pending"
                        : "text-verdict-pending"
                    }
                  />
                  {item.label}
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-[var(--muted-foreground)]">
                  {item.cta}
                  <ArrowRight size={12} />
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}