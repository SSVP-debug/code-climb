import { useEffect } from "react";

import DashboardLayout from "../layouts/DashboardLayout";
import { PROGRESS_KEYS } from "../constants/progressKeys";

import DashboardSections from "../components/dashboard/DashboardSections";

function Dashboard() {

  useEffect(() => {

    // Save joined date once
    if (
      !localStorage.getItem(
        PROGRESS_KEYS.joinedDate
      )
    ) {

      localStorage.setItem(
        PROGRESS_KEYS.joinedDate,
        new Date().formatDate()
      );

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