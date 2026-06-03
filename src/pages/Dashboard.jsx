import { useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { PROGRESS_KEYS } from "../constants/progressKeys";
import DashboardSections from "../components/dashboard/DashboardSections";

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
      <div className="p-8 space-y-8">
        <DashboardSections />
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;

