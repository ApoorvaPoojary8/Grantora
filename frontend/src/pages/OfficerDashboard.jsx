import LogoutButton from "../components/LogoutButton";
import GrantApplicationManagement from "./GrantApplicationManagement";
import SchemeManagement from "./SchemeManagement";
import "../styles/Dashboard.css";

function OfficerDashboard() {
  return (
    <div className="officer-dashboard">
      <header className="dashboard-header">
        <h1>Grantora Officer Dashboard</h1>
        <LogoutButton />
      </header>
      <main className="dashboard-main">
        <SchemeManagement />
        <GrantApplicationManagement />
      </main>
    </div>
  );
}

export default OfficerDashboard;