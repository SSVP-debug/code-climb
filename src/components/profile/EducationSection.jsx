import { useEffect, useState } from "react";
import { apiFetch } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import { withAlpha } from "../../themes/themeIcons";
import SectionCard from "../ui/layout/SectionCard";
import Button from "../ui/Button";
import CollegeVerifyModal from "./CollegeVerifyModal";
import { GraduationCap, BadgeCheck, Clock } from "lucide-react";

/**
 * EducationSection — Profile's "Education" block (Phase 12C). Three states:
 *   1. No education data yet          → "Add your college" CTA
 *   2. education set but !verified    → "Pending" state + resend option
 *   3. verified                       → college details + verified badge
 */
export default function EducationSection() {
  const { theme } = useTheme();
  const [education, setEducation] = useState(undefined); // undefined = loading
  const [modalOpen, setModalOpen] = useState(false);

  function refresh() {
    apiFetch("/api/college-verification/status")
      .then((d) => setEducation(d.education))
      .catch(() => setEducation(null));
  }

  useEffect(refresh, []);

  return (
    <SectionCard
      title="Education"
      subtitle="Verify your college to unlock the College Leaderboard"
      icon={<GraduationCap size={18} strokeWidth={2} />}
      accented
    >
      {education === undefined ? (
        <div className="h-16 bg-zinc-800 rounded-xl animate-pulse" />
      ) : education?.verified ? (
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-white">{education.collegeName}</p>
            <p className="text-sm text-zinc-500 mt-0.5">
              {[education.degree, education.branch, education.graduationYear]
                .filter(Boolean)
                .join(" · ") || "No further details added"}
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: withAlpha(theme.colors.primary, "1f"), color: theme.colors.primary }}
          >
            <BadgeCheck size={14} strokeWidth={2} aria-hidden="true" />
            Verified
          </span>
        </div>
      ) : education?.collegeEmail ? (
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-white">{education.collegeName}</p>
            <p className="text-sm text-zinc-500 mt-0.5 flex items-center gap-1.5">
              <Clock size={13} aria-hidden="true" />
              Verification pending — check {education.collegeEmail}
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)} variant="secondary" size="sm">
            Resend
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-zinc-500 text-sm">
            Add your college to unlock the College Leaderboard, college-only
            contests, and a verified badge.
          </p>
          <Button onClick={() => setModalOpen(true)} variant="theme" size="sm">
            Add College
          </Button>
        </div>
      )}

      {modalOpen && (
        <CollegeVerifyModal
          onClose={() => setModalOpen(false)}
          onSent={() => {
            setModalOpen(false);
            refresh();
          }}
        />
      )}
    </SectionCard>
  );
}