import { useEffect } from 'react';
import { Outlet, useLocation, useOutletContext, useNavigate } from "@remix-run/react";
import DashboardLayout from "../components/DashboardLayout";
import DashboardOverview from "../components/DashboardOverview";
import { OutletContext } from '../types/outlet';

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const isRootDashboard = location.pathname === "/dashboard";
  const { user } = useOutletContext<OutletContext>();
  console.log("Dashboard - user", user);

  useEffect(() => {
    if (user === undefined) {
      // User data is still loading, do nothing
      return;
    }
    
    if (user === null) {
      console.log("Dashboard - No user found, redirecting to login");
      navigate("/login");
    } else if (!user.data.onboarding_completed) {
      console.log("Dashboard - Onboarding not completed, redirecting to onboarding");
      navigate("/onboarding");
    }
  }, [user, navigate]);

  if (user === undefined) {
    return <div>Loading...</div>;
  }

  if (user === null) {
    return null; // or a loading indicator if you prefer
  }

  return (
    <div>
      <DashboardLayout user={user}>
        {isRootDashboard ? <DashboardOverview /> : <Outlet />}
      </DashboardLayout>
    </div>
  );
}
