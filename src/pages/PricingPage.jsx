import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { apiFetch } from "../services/api";
import PageMeta from "../components/seo/PageMeta";

const PLAN_DETAILS = {
  free: {
    name: "Free",
    price: "₹0",
    period: "forever",
    features: ["50+ DSA problems", "3 AI hints/day", "All gamification", "Public profile", "1 PDF download/month"],
    cta: "Current Plan",
  },
  pro_monthly: {
    name: "Pro Monthly",
    price: "₹199",
    period: "/month",
    features: ["All 250+ problems", "Unlimited AI hints", "All themes unlocked", "Editorial access (no solve required)", "45-min Interview Mode + AI interviewer", "Unlimited PDF downloads"],
    cta: "Upgrade to Pro",
    highlight: false,
  },
  pro_yearly: {
    name: "Pro Yearly",
    price: "₹1,999",
    period: "/year",
    badge: "Save 16%",
    features: ["Everything in Pro Monthly", "2 months free vs monthly", "Priority support"],
    cta: "Go Yearly",
    highlight: true,
  },
  founding_lifetime: {
    name: "Founding Lifetime",
    price: "₹1,999",
    period: "once",
    badge: "First 500 users only",
    features: ["Everything in Pro, forever", "No renewal, ever", "Founding member badge", "Early access to new features"],
    cta: "Claim Founding Spot",
    highlight: true,
    urgent: true,
  },
};

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PricingPage() {
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(null);
  const [currentPlan, setCurrentPlan] = useState("free");
  const [loadingPlan, setLoadingPlan] = useState(null);

  useEffect(() => {
    apiFetch("/api/billing/subscription")
      .then(d => {
        setEnabled(d.enabled);
        setCurrentPlan(d.plan || "free");
      })
      .catch(() => setEnabled(false));
  }, []);

  async function handleUpgrade(planId) {
    setLoadingPlan(planId);
    try {
      const order = await apiFetch("/api/billing/create-order", {
        method: "POST",
        body: JSON.stringify({ planId }),
      });

      if (order.error) {
        alert(order.error);
        setLoadingPlan(null);
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Could not load payment gateway. Check your connection.");
        setLoadingPlan(null);
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Code Club",
        description: PLAN_DETAILS[planId]?.name,
        theme: { color: "#22c55e" },
        handler: async (response) => {
          const verify = await apiFetch("/api/billing/verify", {
            method: "POST",
            body: JSON.stringify({ ...response, planId }),
          });
          if (verify.success) {
            setCurrentPlan(planId);
            alert("Welcome to Code Club Pro! 🎉");
          } else {
            alert(verify.error || "Payment verification failed.");
          }
        },
      });
      rzp.open();
    } catch (err) {
      alert("Something went wrong. Try again.");
    }
    setLoadingPlan(null);
  }

  // ── Monetization off — show "coming soon" instead of pricing ──────────────
  if (enabled === false) {
    return (
      <DashboardLayout>
        <PageMeta title="Pricing · Code Club" path="/pricing" />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4">🎁</div>
          <h1 className="text-3xl font-black text-white mb-3">Code Club is free for everyone right now</h1>
          <p className="text-zinc-400 mb-8">
            We're in early access. Every feature — AI hints, all themes, editorials,
            interview mode — is unlocked for all users. Pricing launches once we've
            grown the platform. Enjoy it while it lasts!
          </p>
          <button
            onClick={() => navigate("/problems")}
            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold transition"
          >
            Start Solving →
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (enabled === null) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageMeta title="Pricing · Code Club" path="/pricing" />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-white mb-3">Choose your plan</h1>
          <p className="text-zinc-400">Unlock the full Code Club experience.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {Object.entries(PLAN_DETAILS).map(([id, plan]) => (
            <div
              key={id}
              className={`relative rounded-2xl p-6 border ${
                plan.highlight
                  ? "border-green-500/50 bg-green-500/5"
                  : "border-zinc-800 bg-zinc-900"
              }`}
            >
              {plan.badge && (
                <span className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  plan.urgent ? "bg-red-500 text-white" : "bg-green-500 text-black"
                }`}>
                  {plan.badge}
                </span>
              )}
              <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
              <p className="mb-4">
                <span className="text-3xl font-black text-white">{plan.price}</span>
                <span className="text-zinc-500 text-sm"> {plan.period}</span>
              </p>
              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-400">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                disabled={id === "free" || currentPlan === id || loadingPlan === id}
                onClick={() => handleUpgrade(id)}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${
                  currentPlan === id
                    ? "bg-zinc-800 text-zinc-500 cursor-default"
                    : id === "free"
                    ? "bg-zinc-800 text-zinc-500 cursor-default"
                    : "bg-green-600 hover:bg-green-500 text-white disabled:opacity-50"
                }`}
              >
                {currentPlan === id ? "Current Plan" : loadingPlan === id ? "Loading…" : plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
