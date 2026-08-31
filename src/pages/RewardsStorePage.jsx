import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Coins, Package, X } from "lucide-react";
import PageMeta from "../components/seo/PageMeta";
import DashboardLayout from "../layouts/DashboardLayout";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/feedback/EmptyState";
import { fetchMyBalance } from "../services/rewardsApi";
import {
  fetchStoreItems,
  requestRedemption,
  fetchMyRedemptions,
  cancelRedemption,
} from "../services/rewardStoreApi";

/**
 * RewardsStorePage — student-facing Rewards Store (Phase 4). Structurally
 * mirrors ContributionsPage.jsx: one page, a browsing/action view plus a
 * history tab, same toast/busyId pattern AdminContributionsPage.jsx
 * already established for this codebase's admin pages, reused here for
 * the student side.
 *
 * Redeem flow: clicking "Redeem" on a digital item confirms immediately;
 * a physical item (item.requiresShipping) opens the shipping-address
 * panel first — mirrors AdminContributionsPage.jsx's reject-reason
 * overlay/panel convention, not a new modal pattern.
 */

const STATUS_STYLES = {
  pending: "bg-amber-500/10 text-amber-400",
  fulfilled: "bg-[var(--theme-primary,#2dd4bf)]/10 text-[var(--theme-primary,#2dd4bf)]",
  rejected: "bg-red-500/10 text-red-400",
  cancelled: "bg-zinc-800 text-zinc-400",
};

const TABS = [
  { value: "store", label: "Store" },
  { value: "mine", label: "My Redemptions" },
];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function RewardsStorePage() {
  const [tab, setTab] = useState("store");
  const [balance, setBalance] = useState(null);
  const [items, setItems] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [shippingTarget, setShippingTarget] = useState(null); // the item being redeemed, if it requires shipping
  const [addressForm, setAddressForm] = useState({
    recipientName: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    const request = tab === "store" ? fetchStoreItems() : fetchMyRedemptions();
    Promise.all([fetchMyBalance(), request])
      .then(([bal, data]) => {
        setBalance(bal);
        if (tab === "store") setItems(data.items || []);
        else setRedemptions(data.redemptions || []);
      })
      .catch(() => setToast({ type: "error", message: "Failed to load the rewards store." }))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/tab-change pattern used throughout this codebase's admin pages (see AdminContributionsPage.jsx's identical effect).
    load();
  }, [load]);

  function openRedeem(item) {
    if (item.requiresShipping) {
      setShippingTarget(item);
      return;
    }
    doRedeem(item, null);
  }

  async function doRedeem(item, shippingAddress) {
    setBusyId(item._id);
    try {
      await requestRedemption(item._id, shippingAddress);
      setToast({ type: "success", message: `Redeemed "${item.name}".` });
      setShippingTarget(null);
      setAddressForm({
        recipientName: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to redeem." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(id) {
    setBusyId(id);
    try {
      await cancelRedemption(id);
      setToast({ type: "success", message: "Redemption cancelled — Credits refunded." });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to cancel." });
    } finally {
      setBusyId(null);
    }
  }

  const addressComplete = ["recipientName", "line1", "city", "state", "postalCode", "country"].every(
    (field) => addressForm[field].trim().length > 0
  );

  return (
    <DashboardLayout>
      <PageMeta title="Rewards Store · Code Club" path="/rewards-store" />

      <div className="max-w-3xl mx-auto">
        <Link
          to="/club"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition mb-4"
        >
          <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
          Back to Club
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Rewards Store</h1>
            <p className="text-zinc-500 mt-1 text-sm">Spend Credits on perks and merchandise.</p>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
            <Coins size={16} style={{ color: "var(--theme-primary, #2dd4bf)" }} aria-hidden="true" />
            <span className="text-white font-semibold text-sm">{balance ?? 0}</span>
          </div>
        </div>

        {toast && (
          <div
            className={`mb-4 text-sm px-3 py-2 rounded-lg ${
              toast.type === "error"
                ? "bg-red-500/10 text-red-400"
                : "bg-[var(--theme-primary,#2dd4bf)]/10 text-[var(--theme-primary,#2dd4bf)]"
            }`}
          >
            {toast.message}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-5">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                tab === t.value ? "bg-white text-black" : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[var(--theme-primary,#2dd4bf)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === "store" ? (
          items.length === 0 ? (
            <EmptyState
              icon="🎁"
              title="Nothing in the store yet"
              description="Check back soon — new rewards are added regularly."
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {items.map((item) => (
                <StoreItemCard
                  key={item._id}
                  item={item}
                  balance={balance}
                  busy={busyId === item._id}
                  onRedeem={() => openRedeem(item)}
                />
              ))}
            </div>
          )
        ) : redemptions.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No redemptions yet"
            description="Anything you redeem from the store shows up here."
          />
        ) : (
          <div className="space-y-2">
            {redemptions.map((r) => (
              <RedemptionRow
                key={r._id}
                redemption={r}
                busy={busyId === r._id}
                onCancel={() => handleCancel(r._id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Shipping address — same overlay/panel convention as
          AdminContributionsPage.jsx's reject-reason modal. */}
      {shippingTarget && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShippingTarget(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl p-5"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-white font-bold text-base">Shipping address</h2>
              <button onClick={() => setShippingTarget(null)} className="text-zinc-500 hover:text-white">
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            <p className="text-zinc-400 text-sm mb-3">
              "{shippingTarget.name}" ships to you — where should we send it?
            </p>
            <div className="space-y-2">
              {[
                ["recipientName", "Full name"],
                ["line1", "Address line 1"],
                ["line2", "Address line 2 (optional)"],
                ["city", "City"],
                ["state", "State"],
                ["postalCode", "Postal code"],
                ["country", "Country"],
              ].map(([field, placeholder]) => (
                <input
                  key={field}
                  placeholder={placeholder}
                  value={addressForm[field]}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, [field]: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
                />
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button size="sm" variant="secondary" onClick={() => setShippingTarget(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => doRedeem(shippingTarget, addressForm)}
                disabled={!addressComplete || busyId === shippingTarget._id}
                loading={busyId === shippingTarget._id}
              >
                Confirm redemption
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function StoreItemCard({ item, balance, busy, onRedeem }) {
  const canAfford = (balance ?? 0) >= item.costCredits;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-white font-semibold text-sm">{item.name}</p>
        {item.requiresShipping && (
          <Package size={14} strokeWidth={2} className="text-zinc-500 flex-shrink-0" aria-hidden="true" />
        )}
      </div>
      <p className="text-zinc-500 text-xs mb-3 flex-1">{item.description}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-sm font-semibold text-white">
          <Coins size={13} style={{ color: "var(--theme-primary, #2dd4bf)" }} aria-hidden="true" />
          {item.costCredits}
        </span>
        <Button size="sm" onClick={onRedeem} disabled={!canAfford || busy} loading={busy}>
          {canAfford ? "Redeem" : "Not enough Credits"}
        </Button>
      </div>
    </div>
  );
}

function RedemptionRow({ redemption, busy, onCancel }) {
  const { itemSnapshot, status, createdAt, adminNotes } = redemption;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                STATUS_STYLES[status] || "bg-zinc-800 text-zinc-400"
              }`}
            >
              {status}
            </span>
          </div>
          <p className="text-white font-medium text-sm mt-1 truncate">{itemSnapshot.name}</p>
          <p className="text-zinc-500 text-xs mt-0.5">
            {itemSnapshot.costCredits} Credits · {formatDate(createdAt)}
          </p>
        </div>

        {status === "pending" && (
          <Button size="sm" variant="secondary" onClick={onCancel} disabled={busy} loading={busy}>
            Cancel
          </Button>
        )}
      </div>

      {adminNotes && (status === "fulfilled" || status === "rejected") && (
        <p className="text-zinc-500 text-xs mt-2 border-t border-zinc-800 pt-2">Note: {adminNotes}</p>
      )}
    </div>
  );
}