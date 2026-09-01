import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Coins, Gift, Users } from "lucide-react";
import { fetchMyBalance, fetchMyLedger } from "../services/rewardsApi";
import DashboardLayout from "../layouts/DashboardLayout";
import SectionCard from "../components/ui/layout/SectionCard";
import Button from "../components/ui/Button";

// Human-readable labels for the raw ledger `type` values written by
// backend/services/rewardLedger.js's REWARD_TYPES. Kept here (display
// layer only) rather than changing those backend constants, which are
// also used for the { sourceType, sourceId, userId, type } idempotency
// key — see models/RewardLedger.js's header comment for why that
// combination must never change shape once rewards exist against it.
const TYPE_LABELS = {
  CONTRIBUTION_APPROVED: "Contribution approved",
  REFERRAL_QUALIFIED: "Referral qualified",
};

const SOURCE_ICONS = {
  CONTRIBUTION: Gift,
  REFERRAL: Users,
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function CreditsPage() {
  const [balance, setBalance] = useState(null);
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  async function loadInitial() {
    setLoading(true);
    setError(null);
    try {
      const [bal, ledger] = await Promise.all([fetchMyBalance(), fetchMyLedger({ page: 1 })]);
      setBalance(bal);
      setEntries(ledger.entries);
      setTotal(ledger.total);
      setPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern used throughout this codebase (see AdminOpportunitiesPage.jsx's identical effect); loadInitial()'s setState calls happen after its own await, not synchronously here.
    loadInitial();
  }, []);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const ledger = await fetchMyLedger({ page: nextPage });
      setEntries((prev) => [...prev, ...ledger.entries]);
      setTotal(ledger.total);
      setPage(nextPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  const hasMore = entries.length < total;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <Link
          to="/club"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition mb-4"
        >
          <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
          Back to Club
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Credits</h1>
          <p className="text-[var(--muted-foreground)] mt-1 text-sm">
            Earn Credits by contributing to Code Club and referring students who qualify.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <SectionCard>
            <p className="text-[var(--muted-foreground)] text-sm">Loading…</p>
          </SectionCard>
        ) : (
          <>
            <SectionCard accented className="mb-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "var(--theme-primary, #2dd4bf)", opacity: 0.15 }}
                >
                  <Coins
                    size={22}
                    strokeWidth={2}
                    style={{ color: "var(--theme-primary, #2dd4bf)" }}
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p className="text-3xl font-bold text-[var(--foreground)] leading-tight">
                    {balance ?? 0}
                  </p>
                  <p className="text-[var(--muted-foreground)] text-sm mt-0.5">Credits balance</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="History" subtitle="Every Credits award, newest first.">
              {entries.length === 0 ? (
                <p className="text-[var(--muted-foreground)] text-sm">
                  No Credits yet. Submit a contribution or refer a friend to start earning.
                </p>
              ) : (
                <>
                  <div className="divide-y divide-[var(--border)]">
                    {entries.map((entry) => {
                      const Icon = SOURCE_ICONS[entry.sourceType] ?? Coins;
                      // "reversed" is reserved on the model but no reversal
                      // flow exists yet (see RewardLedger.js's header
                      // comment) — handled here anyway so this page stays
                      // correct the day one ships, instead of silently
                      // showing a reversed row as a normal +amount earn.
                      const isReversed = entry.status === "reversed";
                      return (
                        <div
                          key={entry._id}
                          className={`flex items-center justify-between gap-3 py-3 ${isReversed ? "opacity-50" : ""}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon
                              size={16}
                              strokeWidth={2}
                              className="text-[var(--muted-foreground)] flex-shrink-0"
                              aria-hidden="true"
                            />
                            <div className="min-w-0">
                              <p className="text-sm text-[var(--foreground)] truncate">
                                {TYPE_LABELS[entry.type] ?? entry.type}
                                {isReversed && (
                                  <span className="ml-2 text-xs text-[var(--muted-foreground)] font-normal">Reversed</span>
                                )}
                              </p>
                              <p className="text-xs text-[var(--muted-foreground)]">{formatDate(entry.createdAt)}</p>
                            </div>
                          </div>
                          <span
                            className={`text-sm font-semibold flex-shrink-0 ${isReversed ? "text-[var(--muted-foreground)] line-through" : "text-[var(--foreground)]"}`}
                          >
                            +{entry.amount}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {hasMore && (
                    <div className="pt-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={loadMore}
                        disabled={loadingMore}
                        loading={loadingMore}
                      >
                        Load more
                      </Button>
                    </div>
                  )}
                </>
              )}
            </SectionCard>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}