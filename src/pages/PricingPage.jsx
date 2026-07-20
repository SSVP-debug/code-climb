import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import Button from "../components/ui/Button";
import { apiFetch } from "../services/api";
import PageMeta from "../components/seo/PageMeta";
import { Gift, Check } from "lucide-react";

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
        toast.error(order.error);
        setLoadingPlan(null);
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Could not load payment gateway. Check your connection.");
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
        theme: { color: "#c6ff3d" },
        handler: async (response) => {
          const verify = await apiFetch("/api/billing/verify", {
            method: "POST",
            body: JSON.stringify({ ...response, planId }),
          });
          if (verify.success) {
            setCurrentPlan(planId);
            toast.success("Welcome to Code Club Pro! 🎉");
          } else {
            toast.error(verify.error || "Payment verification failed.");
          }
        },
      });
      rzp.open();
    } catch (err) {
      toast.error("Something went wrong. Try again.");
    }
    setLoadingPlan(null);
  }

  // ── Monetization off — show "coming soon" instead of pricing ──────────────
  if (enabled === false) {
    return (
      <DashboardLayout>
        <PageMeta title="Pricing · Code Club" path="/pricing" />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-verdict-accept/10 text-verdict-accept flex items-center justify-center mx-auto mb-6">
            <Gift size={30} strokeWidth={2} aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Code Club is free for everyone right now</h1>
          <p className="text-zinc-400 mb-8">
            We're in early access. Every feature — AI hints, all themes, editorials,
            interview mode — is unlocked for all users. Pricing launches once we've
            grown the platform. Enjoy it while it lasts!
          </p>
          <Button size="lg" onClick={() => navigate("/problems")}>
            Start Solving →
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (enabled === null) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-verdict-accept border-t-transparent rounded-full animate-spin" />
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
                  ? "border-verdict-accept/50 bg-verdict-accept/5"
                  : "border-ink-700 bg-ink-900"
              }`}
            >
              {plan.badge && (
                <span className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  plan.urgent ? "bg-verdict-reject text-white" : "bg-verdict-accept text-ink-950"
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
                    <Check size={16} strokeWidth={2.5} className="text-verdict-accept mt-0.5 flex-shrink-0" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={currentPlan === id || id === "free" ? "secondary" : "primary"}
                disabled={id === "free" || currentPlan === id || loadingPlan === id}
                loading={loadingPlan === id}
                onClick={() => handleUpgrade(id)}
                className="w-full"
              >
                {currentPlan === id ? "Current Plan" : loadingPlan === id ? "Loading…" : plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}