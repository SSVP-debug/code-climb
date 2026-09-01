import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../services/api";
import { useTheme } from "../../hooks/useTheme";
import { withAlpha } from "../../themes/themeIcons";
import Button from "../ui/Button";
import { GraduationCap, X, Mail, Clock } from "lucide-react";

// Cosmetic only (not security-relevant — the user already typed the full
// address in this same session). s••••@xyzcollege.ac.in style masking.
function maskEmail(email) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const masked = local[0] + "•".repeat(Math.max(local.length - 1, 3));
  return `${masked}@${domain}`;
}

/**
 * CollegeVerifyModal — stateful, multi-step verification flow.
 *
 * Replaces the old single-form / toast-on-error pattern. Steps:
 *   initial            — college email (+ collapsed optional academic
 *                         fields), submit calls POST /request
 *   unknown_college     — shown when /request reports the domain isn't
 *                         recognized; collects college name + website,
 *                         resubmits POST /request with those included
 *   email_sent          — verification email sent; shows pending-college
 *                         note when applicable, offers Resend
 *
 * Errors that are genuinely exceptional (network failure, validation
 * errors other than "unrecognized domain") render as inline text with
 * role="alert" rather than a toast — toasts are reserved for transient,
 * non-blocking confirmations elsewhere in the app; a verification-flow
 * error is not transient, the user needs to see and act on it within the
 * modal itself.
 *
 * Used from two places: Profile's Education section (first-time setup /
 * resend) and LeaderboardPage's College tab (gate shown when unverified).
 * Same component either way so the copy/behavior can't drift between them.
 */
export default function CollegeVerifyModal({ onClose, onSent }) {
  const { theme } = useTheme();

  const [step, setStep] = useState("initial"); // initial | unknown_college | email_sent
  const [collegeEmail, setCollegeEmail] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [collegeWebsite, setCollegeWebsite] = useState("");
  const [showAcademicFields, setShowAcademicFields] = useState(false);
  const [degree, setDegree] = useState("");
  const [branch, setBranch] = useState("");
  const [graduationYear, setGraduationYear] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [collegePending, setCollegePending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const headingRef = useRef(null);

  // Move focus to the new step's heading on every transition, so screen-
  // reader users get an announcement without losing their place.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  async function submitRequest({ includeCollegeName }) {
    setError("");
    setSubmitting(true);
    try {
      const data = await apiFetch("/api/college-verification/request", {
        method: "POST",
        body: JSON.stringify({
          collegeEmail: collegeEmail.trim(),
          collegeName: includeCollegeName ? collegeName.trim() : undefined,
          collegeWebsite: includeCollegeName ? collegeWebsite.trim() : undefined,
          degree: degree.trim(),
          branch: branch.trim(),
          graduationYear: graduationYear || null,
        }),
      });

      setCollegePending(data.collegeRecognized === false);
      setStep("email_sent");
      onSent?.();
    } catch (err) {
      if (err.body?.code === "COLLEGE_NAME_REQUIRED") {
        // Not an error state — the domain just isn't recognized yet.
        // Transition into the request-and-verify step instead of showing
        // a dead-end toast.
        setStep("unknown_college");
        setError("");
      } else {
        setError(err.message || "Failed to start verification.");
      }
    }
    setSubmitting(false);
  }

  function handleInitialSubmit(e) {
    e.preventDefault();
    if (!collegeEmail.trim()) {
      setError("College email is required.");
      return;
    }
    submitRequest({ includeCollegeName: false });
  }

  function handleUnknownCollegeSubmit(e) {
    e.preventDefault();
    if (!collegeName.trim()) {
      setError("College name is required.");
      return;
    }
    submitRequest({ includeCollegeName: true });
  }

  async function handleResend() {
    setError("");
    setSubmitting(true);
    try {
      await apiFetch("/api/college-verification/resend", { method: "POST" });
      setResent(true);
      setResendCooldown(30);
      setTimeout(() => setResent(false), 4000);
    } catch (err) {
      setError(err.message || "Failed to resend verification email.");
    }
    setSubmitting(false);
  }

  const domain = collegeEmail.includes("@") ? collegeEmail.split("@")[1] : "";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 max-w-md w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
          aria-label="Close"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: withAlpha(theme.colors.primary, "1f"), color: theme.colors.primary }}
        >
          {step === "email_sent" ? (
            <Mail size={24} strokeWidth={2} aria-hidden="true" />
          ) : (
            <GraduationCap size={24} strokeWidth={2} aria-hidden="true" />
          )}
        </div>

        {step === "initial" && (
          <>
            <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold mb-2 outline-none">
              Verify Your College Email
            </h2>
            <p className="text-[var(--muted-foreground)] text-sm mb-5">
              Connect your official college email address to access your college
              leaderboard, participate in college-exclusive contests, and compete
              with your classmates.
            </p>

            <form onSubmit={handleInitialSubmit} className="space-y-3">
              <input
                value={collegeEmail}
                onChange={(e) => setCollegeEmail(e.target.value)}
                placeholder="you@college.ac.in"
                type="email"
                autoFocus
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border-strong)] rounded-xl px-4 py-2.5 text-[var(--foreground)] text-sm outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
              />

              <button
                type="button"
                onClick={() => setShowAcademicFields((v) => !v)}
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--muted-foreground)] transition"
              >
                {showAcademicFields ? "Hide" : "Add"} degree, branch & graduation year (optional)
              </button>

              {showAcademicFields && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      placeholder="Degree (optional)"
                      className="w-full bg-[var(--surface-elevated)] border border-[var(--border-strong)] rounded-xl px-4 py-2.5 text-[var(--foreground)] text-sm outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
                    />
                    <input
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="Branch (optional)"
                      className="w-full bg-[var(--surface-elevated)] border border-[var(--border-strong)] rounded-xl px-4 py-2.5 text-[var(--foreground)] text-sm outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
                    />
                  </div>
                  <input
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="Graduation year (optional)"
                    inputMode="numeric"
                    className="w-full bg-[var(--surface-elevated)] border border-[var(--border-strong)] rounded-xl px-4 py-2.5 text-[var(--foreground)] text-sm outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
                  />
                </div>
              )}

              {error && (
                <p role="alert" className="text-red-400 text-xs">
                  {error}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="button" onClick={onClose} variant="secondary" className="flex-1">
                  Maybe Later
                </Button>
                <Button type="submit" variant="theme" disabled={submitting} loading={submitting} className="flex-1">
                  {submitting ? "Checking…" : "Verify College Email"}
                </Button>
              </div>
            </form>
          </>
        )}

        {step === "unknown_college" && (
          <>
            <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold mb-2 outline-none">
              We haven't added your college yet
            </h2>
            <p className="text-[var(--muted-foreground)] text-sm mb-5">
              We don't recognize <span className="text-[var(--foreground)] font-medium">{domain}</span> yet. You
              can verify your college email and request your college to be added to Code Club.
            </p>

            <form onSubmit={handleUnknownCollegeSubmit} className="space-y-3">
              <input
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="College name"
                autoFocus
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border-strong)] rounded-xl px-4 py-2.5 text-[var(--foreground)] text-sm outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
              />
              <input
                value={collegeWebsite}
                onChange={(e) => setCollegeWebsite(e.target.value)}
                placeholder={`College website (e.g. https://${domain})`}
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border-strong)] rounded-xl px-4 py-2.5 text-[var(--foreground)] text-sm outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
              />

              {error && (
                <p role="alert" className="text-red-400 text-xs">
                  {error}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="button" onClick={onClose} variant="secondary" className="flex-1">
                  Maybe Later
                </Button>
                <Button type="submit" variant="theme" disabled={submitting} loading={submitting} className="flex-1">
                  {submitting ? "Sending…" : "Request & Verify Email"}
                </Button>
              </div>
            </form>
          </>
        )}

        {step === "email_sent" && (
          <>
            <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold mb-2 outline-none">
              Check your college inbox
            </h2>
            <p className="text-[var(--muted-foreground)] text-sm mb-2">
              We sent a verification link to:{" "}
              <span className="text-[var(--foreground)] font-medium">{maskEmail(collegeEmail)}</span>
            </p>
            {collegePending && (
              <p className="text-[var(--muted-foreground)] text-sm flex items-start gap-1.5 mb-5">
                <Clock size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                Your college is also being reviewed for the College Leaderboard.
              </p>
            )}

            {error && (
              <p role="alert" className="text-red-400 text-xs mb-3">
                {error}
              </p>
            )}
            {resent && (
              <p role="status" className="text-emerald-400 text-xs mb-3">
                Sent again — check your inbox.
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="button" onClick={onClose} variant="secondary" className="flex-1">
                Close
              </Button>
              <Button
                type="button"
                onClick={handleResend}
                variant="theme"
                disabled={submitting || resendCooldown > 0}
                loading={submitting}
                className="flex-1"
              >
                {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend email"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}