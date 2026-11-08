
import LogoutButton from "../components/LogoutButton";
import BeneficiaryManagement from "./BeneficiaryManagement";
import GrantApplicationManagement from "./GrantApplicationManagement";
import SchemeManagement from "./SchemeManagement";
import "../styles/Dashboard.css";

function BeneficiaryDashboard() {
  return (
    <div>
      <header className="dashboard-header">
        <h1>Grantora Beneficiary Dashboard</h1>
        <LogoutButton />
      </header>

      <main className="dashboard-main">
        <h2>Welcome to Grantora</h2>
        <p>Manage your beneficiary profile below.</p>

        <BeneficiaryManagement />
        <SchemeManagement />
        <GrantApplicationManagement />
      </main>
    </div>
  );
}

export default BeneficiaryDashboard;
