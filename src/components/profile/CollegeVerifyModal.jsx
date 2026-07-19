import { useState } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import { withAlpha } from "../../themes/themeIcons";
import Button from "../ui/Button";
import { GraduationCap, X } from "lucide-react";

/**
 * CollegeVerifyModal — matches the PRD's confirmed copy:
 * "Verify Your College Email — Connect your official college email
 * address to access your college leaderboard, participate in
 * college-exclusive contests, and compete with your classmates."
 *
 * Used from two places: Profile's Education section (first-time setup)
 * and LeaderboardPage's College tab (gate shown when unverified). Same
 * component either way so the copy/behavior can't drift between them.
 */
export default function CollegeVerifyModal({ onClose, onSent }) {
  const { theme } = useTheme();
  const [collegeEmail, setCollegeEmail] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [degree, setDegree] = useState("");
  const [branch, setBranch] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!collegeEmail.trim() || !collegeName.trim()) {
      toast.error("College email and college name are required.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiFetch("/api/college-verification/request", {
        method: "POST",
        body: JSON.stringify({
          collegeEmail: collegeEmail.trim(),
          collegeName: collegeName.trim(),
          degree: degree.trim(),
          branch: branch.trim(),
          graduationYear: graduationYear || null,
        }),
      });
      toast.success(
        data.emailSent
          ? "Check your college inbox for a verification link."
          : "Verification saved — email delivery isn't configured, contact support to finish verifying."
      );
      onSent?.();
    } catch (err) {
      toast.error(err.message || "Failed to start verification.");
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition"
          aria-label="Close"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: withAlpha(theme.colors.primary, "1f"), color: theme.colors.primary }}
        >
          <GraduationCap size={24} strokeWidth={2} aria-hidden="true" />
        </div>

        <h2 className="text-xl font-bold mb-2">Verify Your College Email</h2>
        <p className="text-zinc-400 text-sm mb-5">
          Connect your official college email address to access your college
          leaderboard, participate in college-exclusive contests, and compete
          with your classmates.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={collegeEmail}
            onChange={(e) => setCollegeEmail(e.target.value)}
            placeholder="you@college.ac.in"
            type="email"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
          />
          <input
            value={collegeName}
            onChange={(e) => setCollegeName(e.target.value)}
            placeholder="College name"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              placeholder="Degree (optional)"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
            />
            <input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="Branch (optional)"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
            />
          </div>
          <input
            value={graduationYear}
            onChange={(e) => setGraduationYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="Graduation year (optional)"
            inputMode="numeric"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
          />

          <div className="flex gap-2 pt-2">
            <Button type="button" onClick={onClose} variant="secondary" className="flex-1">
              Maybe Later
            </Button>
            <Button type="submit" variant="theme" disabled={submitting} loading={submitting} className="flex-1">
              {submitting ? "Sending…" : "Verify College Email"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}