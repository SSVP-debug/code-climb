import PageMeta from "../components/seo/PageMeta";
import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import ConstellationBackground from "../components/landing/ConstellationBackground";
import LandingNav from "../components/landing/LandingNav";
import HeroSection from "../components/landing/HeroSection";
import StatsBar from "../components/landing/StatsBar";
import ThemesShowcase from "../components/landing/ThemesShowcase";
import FeatureGrid from "../components/landing/FeatureGrid";
import AudienceGrid from "../components/landing/AudienceGrid";
import CompetitorComparison from "../components/landing/CompetitorComparison";
import CtaSection from "../components/landing/CtaSection";
import LandingFooter from "../components/landing/LandingFooter";

const STATIC_STATS = [
  { key: "problems", value: "50+", label: "DSA Problems" },
  { key: "languages", value: "4", label: "Languages" },
  { key: "themes", value: "5", label: "Themed Universes" },
  { key: "ai", value: "Claude", label: "Coaching Built In" },
];

// The "ai" stat has no backend equivalent — it's a static descriptor, not a
// count — so it's preserved as-is even once live numbers come in for the
// other three, instead of silently dropping to a 3-stat bar.
const AI_STAT = STATIC_STATS[3];

function useLiveStats() {
  const [stats, setStats] = useState(STATIC_STATS);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    fetch(`${API_URL}/api/stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setStats([
          {
            key: "problems",
            value: data.problems > 0 ? `${data.problems}+` : "—",
            label: "DSA Problems",
          },
          {
            key: "languages",
            value: data.languages > 0 ? String(data.languages) : "—",
            label: "Languages",
          },
          {
            key: "themes",
            value: data.themes > 0 ? String(data.themes) : "—",
            label: "Themed Universes",
          },
          AI_STAT,
        ]);
      })
      .catch(() => {}); // fail silently — static fallback stays
  }, []);

  return stats;
}

export default function LandingPage() {
  const { user } = useAuth();
  const stats = useLiveStats();

  return (
    <div className="min-h-screen bg-ink-950 text-zinc-100 overflow-x-hidden font-display [--theme-primary:#c6ff3d]">
      <PageMeta
        title="Code Club DSA Practice for Placement Season"
        description="Solve curated DSA problems, practice live AI mock interviews, and get discovered. Free for students, with a placement dashboard for TPOs and a candidate search portal for recruiters."
        path="/"
      />

      <ConstellationBackground />

      <div className="relative">
        <LandingNav user={user} />
        <HeroSection user={user} />
        <StatsBar stats={stats} />
        <ThemesShowcase user={user} />
        <FeatureGrid />
        <AudienceGrid />
        <CompetitorComparison />
        <CtaSection user={user} />
        <LandingFooter user={user} />
      </div>
    </div>
  );
}