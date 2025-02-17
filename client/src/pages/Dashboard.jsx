import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("isAuthenticated") !== "true") {
      navigate("/", { replace: true });
    }
  }, []);

  return (
    <div className="flex-1 p-6">
      <h1 className="text-3xl font-bold mb-4">Welcome to the Dashboard</h1>
      <p className="text-gray-700">Manage your workforce, inventory, and analytics from here.</p>
    </div>
  );
}

export default Dashboard;