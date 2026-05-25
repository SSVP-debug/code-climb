import { useEffect } from "react";

import DashboardLayout from "../layouts/DashboardLayout";

import DashboardSections from "../components/dashboard/DashboardSections";

function Dashboard() {

  useEffect(() => {

    // Save joined date once
    if (
      !localStorage.getItem(
        "joinedDate"
      )
    ) {

      localStorage.setItem(
        "joinedDate",
        new Date().toLocaleDateString()
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