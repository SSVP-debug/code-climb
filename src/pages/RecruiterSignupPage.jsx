import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../services/api";
import Button from "../components/ui/Button";

export default function RecruiterSignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ companyName: "", designation: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/recruiter/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      navigate("/recruiter/dashboard");
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Link to="/dashboard" className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition mb-6 inline-block">
          ← Back to dashboard
        </Link>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-[var(--foreground)] mb-2">Recruiter Access</h1>
          <p className="text-[var(--muted-foreground)] text-sm">Search verified candidates, assign skills tests, and hire faster.</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs text-[var(--muted-foreground)] uppercase tracking-widest font-semibold mb-1">Company Name</label>
            <input value={form.companyName} onChange={e => setForm(f => ({...f, companyName: e.target.value}))}
              placeholder="e.g. Google" className="w-full bg-[var(--surface-elevated)] border border-[var(--border-strong)] rounded-xl px-4 py-2.5 text-[var(--foreground)] outline-none focus:border-[var(--theme-primary,#2dd4bf)]/50" />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted-foreground)] uppercase tracking-widest font-semibold mb-1">Your Designation</label>
            <input value={form.designation} onChange={e => setForm(f => ({...f, designation: e.target.value}))}
              placeholder="e.g. Technical Recruiter" className="w-full bg-[var(--surface-elevated)] border border-[var(--border-strong)] rounded-xl px-4 py-2.5 text-[var(--foreground)] outline-none focus:border-[var(--theme-primary,#2dd4bf)]/50" />
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">Sign in with your company email (e.g. name@google.com). Personal emails (Gmail, Yahoo) are not allowed.</p>
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}
          <Button type="submit" disabled={loading || !form.companyName || !form.designation}
            loading={loading} className="w-full">
            {loading ? "Setting up…" : "Activate Recruiter Access"}
          </Button>
        </form>
      </div>
    </div>
  );
}