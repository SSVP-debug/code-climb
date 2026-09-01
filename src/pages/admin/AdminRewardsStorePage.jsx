import { useCallback, useEffect, useState } from "react";
import { X, ChevronDown, ChevronUp, Plus, Package } from "lucide-react";
import PageMeta from "../../components/seo/PageMeta";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/feedback/EmptyState";
import { formatVerificationDate } from "../../utils/formatVerificationDate";
import {
  fetchCatalogItemsAdmin,
  createCatalogItemAdmin,
  updateCatalogItemAdmin,
  fetchRedemptionsAdmin,
  fulfillRedemptionAdmin,
  rejectRedemptionAdmin,
} from "../../services/rewardStoreApi";

/**
 * AdminRewardsStorePage — catalog management + fulfillment queue for
 * Rewards Store (Phase 4). Structurally mirrors
 * AdminContributionsPage.jsx (same status-tab / toast / busyId / reject-
 * reason-panel conventions), with a second top-level tab for the two
 * genuinely different admin tasks this feature has: managing WHAT'S in
 * the store (Catalog) vs. reviewing WHO redeemed something (Redemptions)
 * — AdminContributionsPage.jsx only ever needed one, since a
 * Contribution has no separate "catalog" concept.
 */

const REDEMPTION_STATUS_TABS = [
  { value: "pending", label: "Pending" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
];

const STATUS_STYLES = {
  pending: "bg-amber-500/10 text-amber-400",
  fulfilled: "bg-[var(--theme-primary,#2dd4bf)]/10 text-[var(--theme-primary,#2dd4bf)]",
  rejected: "bg-red-500/10 text-red-400",
  cancelled: "bg-[var(--surface-elevated)] text-[var(--muted-foreground)]",
};

const EMPTY_ITEM_FORM = {
  name: "",
  description: "",
  costCredits: "",
  category: "",
  requiresShipping: false,
  stock: "",
  imageUrl: "",
};

export default function AdminRewardsStorePage() {
  const [topTab, setTopTab] = useState("catalog");

  return (
    <div>
      <PageMeta title="Rewards Store · Admin · Code Club" path="/admin/reward-store" />

      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--foreground)]">Rewards Store</h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-0.5">
          Manage what's redeemable and review pending redemptions.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        {[
          { value: "catalog", label: "Catalog" },
          { value: "redemptions", label: "Redemptions" },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setTopTab(t.value)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
              topTab === t.value ? "bg-white text-black" : "bg-[var(--surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {topTab === "catalog" ? <CatalogTab /> : <RedemptionsTab />}
    </div>
  );
}

// ── Catalog ──────────────────────────────────────────────────────────────

function CatalogTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_ITEM_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchCatalogItemsAdmin({ status })
      .then((data) => setItems(data.items || []))
      .catch(() => setToast({ type: "error", message: "Failed to load catalog items." }))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/tab-change pattern used throughout this codebase's admin pages (see AdminContributionsPage.jsx's identical effect).
    load();
  }, [load]);

  async function handleToggleActive(item) {
    setBusyId(item._id);
    try {
      await updateCatalogItemAdmin(item._id, { active: !item.active });
      setToast({ type: "success", message: item.active ? "Deactivated." : "Activated." });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to update." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreate() {
    setSaving(true);
    try {
      await createCatalogItemAdmin({
        name: form.name.trim(),
        description: form.description.trim(),
        costCredits: Number(form.costCredits),
        category: form.category.trim() || null,
        requiresShipping: form.requiresShipping,
        stock: form.stock === "" ? null : Number(form.stock),
        imageUrl: form.imageUrl.trim() || null,
      });
      setToast({ type: "success", message: "Catalog item created." });
      setFormOpen(false);
      setForm(EMPTY_ITEM_FORM);
      load();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to create item." });
    } finally {
      setSaving(false);
    }
  }

  const formValid = form.name.trim() && form.description.trim() && Number(form.costCredits) >= 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {["all", "active", "inactive"].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition capitalize ${
                status === s ? "bg-white text-black" : "bg-[var(--surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus size={14} strokeWidth={2} />
          New item
        </Button>
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

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[var(--theme-primary,#2dd4bf)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon="🎁" title="No catalog items" description="Create one to get started." />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item._id}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex items-center gap-3">
                {item.requiresShipping && (
                  <Package size={14} strokeWidth={2} className="text-[var(--muted-foreground)] flex-shrink-0" aria-hidden="true" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[var(--foreground)] font-medium text-sm truncate">{item.name}</p>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        item.active ? "bg-[var(--theme-primary,#2dd4bf)]/10 text-[var(--theme-primary,#2dd4bf)]" : "bg-[var(--surface-elevated)] text-[var(--muted-foreground)]"
                      }`}
                    >
                      {item.active ? "active" : "inactive"}
                    </span>
                  </div>
                  <p className="text-[var(--muted-foreground)] text-xs mt-0.5">
                    {item.costCredits} Credits
                    {item.stock !== null ? ` · ${item.stock} in stock` : " · unlimited"}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleToggleActive(item)}
                disabled={busyId === item._id}
                loading={busyId === item._id}
              >
                {item.active ? "Deactivate" : "Activate"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setFormOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[var(--foreground)] font-bold text-base">New catalog item</h2>
              <button onClick={() => setFormOpen(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="space-y-2">
              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
              />
              <input
                type="number"
                min={1}
                placeholder="Cost in Credits"
                value={form.costCredits}
                onChange={(e) => setForm((p) => ({ ...p, costCredits: e.target.value }))}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
              />
              <input
                placeholder="Category (optional)"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
              />
              <input
                type="number"
                min={0}
                placeholder="Stock (blank = unlimited)"
                value={form.stock}
                onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
              />
              <input
                placeholder="Image URL (optional)"
                value={form.imageUrl}
                onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
              />
              <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] pt-1">
                <input
                  type="checkbox"
                  checked={form.requiresShipping}
                  onChange={(e) => setForm((p) => ({ ...p, requiresShipping: e.target.checked }))}
                />
                Requires shipping (physical item)
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button size="sm" variant="secondary" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={!formValid || saving} loading={saving}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Redemptions (fulfillment queue) ─────────────────────────────────────

function RedemptionsTab() {
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchRedemptionsAdmin({ status })
      .then((data) => setRedemptions(data.redemptions || []))
      .catch(() => setToast({ type: "error", message: "Failed to load redemptions." }))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/tab-change pattern used throughout this codebase's admin pages (see AdminContributionsPage.jsx's identical effect).
    load();
  }, [load]);

  async function handleFulfill(id) {
    setBusyId(id);
    try {
      await fulfillRedemptionAdmin(id);
      setToast({ type: "success", message: "Fulfilled." });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to fulfill." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    setBusyId(rejectTarget);
    try {
      await rejectRedemptionAdmin(rejectTarget, rejectReason.trim() || null);
      setToast({ type: "success", message: "Rejected — Credits refunded to the student." });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to reject." });
    } finally {
      setBusyId(null);
      setRejectTarget(null);
      setRejectReason("");
    }
  }

  return (
    <div>
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
        {REDEMPTION_STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
              status === t.value ? "bg-white text-black" : "bg-[var(--surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
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
      ) : redemptions.length === 0 ? (
        <EmptyState icon="📦" title="No redemptions" description="Nothing in this queue right now." />
      ) : (
        <div className="space-y-2">
          {redemptions.map((r) => (
            <RedemptionCard
              key={r._id}
              redemption={r}
              busy={busyId === r._id}
              expanded={expandedId === r._id}
              onToggleExpand={() => setExpandedId(expandedId === r._id ? null : r._id)}
              onFulfill={() => handleFulfill(r._id)}
              onReject={() => setRejectTarget(r._id)}
            />
          ))}
        </div>
      )}

      {rejectTarget && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setRejectTarget(null);
            setRejectReason("");
          }}
          role="presentation"
        >
          <div
            className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-[var(--foreground)] font-bold text-base">Reject redemption</h2>
              <button
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason("");
                }}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            <p className="text-[var(--muted-foreground)] text-sm mb-3">
              Credits are refunded to the student automatically. Reason is optional but shown to
              them.
            </p>
            <textarea
              autoFocus
              placeholder="Reason for rejection (optional)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-red-500"
              rows={3}
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason("");
                }}
              >
                Cancel
              </Button>
              <Button size="sm" variant="danger" onClick={handleReject}>
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RedemptionCard({ redemption, busy, expanded, onToggleExpand, onFulfill, onReject }) {
  const { itemSnapshot, status, createdAt, userId, adminNotes, shippingAddress } = redemption;
  const requesterLabel = userId?.displayName || userId?.email || "Unknown";

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <button onClick={onToggleExpand} className="flex items-center gap-3 min-w-0 flex-1 text-left">
          {expanded ? (
            <ChevronUp size={14} strokeWidth={2} className="flex-shrink-0 text-[var(--muted-foreground)]" />
          ) : (
            <ChevronDown size={14} strokeWidth={2} className="flex-shrink-0 text-[var(--muted-foreground)]" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  STATUS_STYLES[status] || "bg-[var(--surface-elevated)] text-[var(--muted-foreground)]"
                }`}
              >
                {status}
              </span>
            </div>
            <p className="text-[var(--foreground)] font-medium text-sm mt-1 truncate">{itemSnapshot.name}</p>
            <p className="text-[var(--muted-foreground)] text-xs mt-0.5">
              {requesterLabel} · {itemSnapshot.costCredits} Credits · {formatVerificationDate(createdAt)}
            </p>
          </div>
        </button>

        {status === "pending" && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button size="sm" onClick={onFulfill} disabled={busy} loading={busy}>
              Fulfill
            </Button>
            <Button size="sm" variant="danger" onClick={onReject} disabled={busy}>
              Reject
            </Button>
          </div>
        )}
      </div>

      {adminNotes && (
        <p className="text-[var(--muted-foreground)] text-xs mt-2 border-t border-[var(--border)] pt-2">Note: {adminNotes}</p>
      )}

      {expanded && shippingAddress && (
        <div className="mt-3 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted-foreground)]">
          <p className="font-semibold text-[var(--muted-foreground)] mb-1">Shipping address</p>
          <p>{shippingAddress.recipientName}</p>
          <p>{shippingAddress.line1}</p>
          {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
          <p>
            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
          </p>
          <p>{shippingAddress.country}</p>
        </div>
      )}
    </div>
  );
}