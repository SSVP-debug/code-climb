import { useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { PROGRESS_KEYS } from "../constants/progressKeys";
import DashboardSections from "../components/dashboard/DashboardSections";
import OnboardingTour from "../components/onboarding/OnboardingTour";

function Dashboard() {
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
      <div className="space-y-8">
        <DashboardSections />
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;

