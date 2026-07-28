import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { apiFetch } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { withAlpha } from "../themes/themeIcons";
import DashboardLayout from "../layouts/DashboardLayout";
import Button from "../components/ui/Button";
import { BadgeCheck, XCircle, Clock } from "lucide-react";

/**
 * CollegeVerifyConfirmPage — the landing page a student hits after clicking
 * the link in their verification email (GET /verify-college?token=...).
 * Wrapped in DashboardLayout (same reasoning as the Phase 12A contest-page
 * fix) so this isn't a navigation dead-end if verification fails.
 */
export default function CollegeVerifyConfirmPage() {
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [collegeStatus, setCollegeStatus] = useState(null); // "pending" | "verified" | "rejected"

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("This verification link is missing its token.");
      return;
    }

    apiFetch(`/api/college-verification/confirm?token=${encodeURIComponent(token)}`)
      .then((d) => {
        setCollegeName(d.collegeName);
        setCollegeStatus(d.collegeStatus);
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message || "Something went wrong confirming your email.");
      });
  }, [searchParams]);

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto text-center py-12">
        {status === "loading" && (
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: theme.colors.primary, borderTopColor: "transparent" }}
          />
        )}

        {status === "success" && (
          <>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: withAlpha(theme.colors.primary, "1f"), color: theme.colors.primary }}
            >
              {collegeStatus === "pending" ? (
                <Clock size={32} strokeWidth={2} aria-hidden="true" />
              ) : (
                <BadgeCheck size={32} strokeWidth={2} aria-hidden="true" />
              )}
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {collegeStatus === "pending" ? "Email Verified" : "College Verified"}
            </h1>
            <p className="text-zinc-400 mb-8">
              {collegeStatus === "pending"
                ? `We've confirmed you own this email. ${collegeName} is now under review — you'll get College Leaderboard access once it's approved.`
                : `${collegeName} is now linked to your account. Your College Leaderboard is unlocked.`}
            </p>
            <Button to={collegeStatus === "pending" ? "/profile" : "/club/leaderboard"} variant="theme">
              {collegeStatus === "pending" ? "Back to Profile" : "View College Leaderboard"}
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-red-500/15 text-red-400 flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} strokeWidth={2} aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
            <p className="text-zinc-400 mb-8">{message}</p>
            <Link to="/profile" className="text-sm hover:brightness-110 transition" style={{ color: theme.colors.primary }}>
              Back to Profile — request a new link
            </Link>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}