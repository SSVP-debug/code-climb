import LevelUpModal from "../components/gamification/LevelUpModal";
import { useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { PROGRESS_KEYS } from "../constants/progressKeys";
import DashboardSections from "../components/dashboard/DashboardSections";
import DashboardSkeleton from "../components/dashboard/DashboardSkeleton";
import OnboardingTour from "../components/onboarding/OnboardingTour";
import { useAppContext } from "../hooks/useAppContext";
import AsyncState from "../components/ui/feedback/AsyncState";

function Dashboard() {
  const { isBackendReady, hydrationError, retryHydration } = useAppContext();

  useEffect(() => {
    // Save joined date once on first ever visit.
    if (!localStorage.getItem(PROGRESS_KEYS.joinedDate)) {
      const readable = new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }); // → "May 2025"
      localStorage.setItem(PROGRESS_KEYS.joinedDate, readable);
    }
  }, []);

  return (
    <DashboardLayout>
      <OnboardingTour />
      <LevelUpModal />
      {/*
        Previously this only branched loading vs. loaded — a failed boot
        call (see appContext's hydrationError) still flipped isBackendReady
        to true and silently rendered DashboardSections with whatever
        partial/empty state was left over, no different from a genuinely
        new, zero-progress account. AsyncState makes that failure visible
        and gives a real retry action instead of a misleading "you have no
        progress" dashboard.
      */}
      <AsyncState
        loading={!isBackendReady}
        loadingFallback={<DashboardSkeleton />}
        error={isBackendReady ? hydrationError : null}
        onRetry={retryHydration}
        errorMessage={
          hydrationError
            ? "Couldn't load your dashboard. Your progress is safe — this is just a connection hiccup."
            : undefined
        }
      >
        <DashboardSections />
      </AsyncState>
    </DashboardLayout>
  );
}

export default Dashboard;