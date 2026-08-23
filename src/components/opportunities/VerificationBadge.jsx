import { ShieldCheck, ShieldQuestion } from "lucide-react";
import { formatVerificationDate } from "../../utils/formatVerificationDate";

/**
 * VerificationBadge — PART 7's trust UI. Only ever renders a "Verified"
 * state when `verificationStatus === "verified"` (i.e. an admin actually
 * checked it) — never inferred from anything else, and never uses
 * absolute language like "100% genuine" or "guaranteed" (Code Club curates
 * the listing; it doesn't guarantee the outcome of an external process).
 */
export default function VerificationBadge({ verificationStatus, lastVerifiedAt, compact = false }) {
  const verified = verificationStatus === "verified";

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
          verified
            ? "bg-[var(--theme-primary,#2dd4bf)]/10 text-[var(--theme-primary,#2dd4bf)]"
            : "bg-zinc-800 text-zinc-500"
        }`}
      >
        {verified ? <ShieldCheck size={12} strokeWidth={2.5} /> : <ShieldQuestion size={12} strokeWidth={2.5} />}
        {verified ? "Verified" : "Unverified"}
      </span>
    );
  }

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border ${
        verified
          ? "border-[var(--theme-primary,#2dd4bf)]/30 bg-[var(--theme-primary,#2dd4bf)]/5"
          : "border-zinc-800 bg-zinc-900"
      }`}
    >
      {verified ? (
        <ShieldCheck size={18} strokeWidth={2} className="text-[var(--theme-primary,#2dd4bf)] flex-shrink-0" />
      ) : (
        <ShieldQuestion size={18} strokeWidth={2} className="text-zinc-500 flex-shrink-0" />
      )}
      <div>
        <p className={`text-sm font-bold ${verified ? "text-[var(--theme-primary,#2dd4bf)]" : "text-zinc-400"}`}>
          {verified ? "Verified by Code Club" : "Not yet verified"}
        </p>
        {verified && lastVerifiedAt && (
          <p className="text-[11px] text-zinc-500">Last verified: {formatVerificationDate(lastVerifiedAt)}</p>
        )}
      </div>
    </div>
  );
}
