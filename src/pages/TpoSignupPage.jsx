import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";
import PageMeta from "../components/seo/PageMeta";
import Button from "../components/ui/Button";

export default function TpoSignupPage() {
  const navigate = useNavigate();
  const [collegeName, setCollegeName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!collegeName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/tpo/register", {
        method: "POST",
        body: JSON.stringify({ collegeName: collegeName.trim() }),
      });
      if (data.error) {
        setError(data.error);
      } else if (data.enabled === false) {
        setError(data.message);
      } else {
        navigate("/tpo/dashboard");
      }
    } catch {
      setError("Something went wrong. Try again.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <PageMeta title="College Admin Signup · Code Club" path="/tpo/signup" />
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-white mb-2">College Admin Access</h1>
          <p className="text-zinc-400 text-sm">
            For Training & Placement Officers. Track your students' DSA progress,
            assign problems, and get placement readiness reports.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2">
              College Name
            </label>
            <input
              value={collegeName}
              onChange={e => setCollegeName(e.target.value)}
              placeholder="e.g. Marwadi University"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[var(--theme-primary,#2dd4bf)]/50"
            />
          </div>

          <p className="text-xs text-zinc-600">
            We'll use your sign-in email's domain (e.g. @marwadiuniversity.ac.in) to
            automatically link your students. Please sign in with your institutional
            email, not a personal Gmail account.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !collegeName.trim()}
            loading={loading}
            className="w-full"
          >
            {loading ? "Setting up…" : "Activate College Dashboard"}
          </Button>
        </form>
      </div>
    </div>
  );
}