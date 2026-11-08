
import LogoutButton from "../components/LogoutButton";
import BeneficiaryManagement from "./BeneficiaryManagement";

function BeneficiaryDashboard() {
  return (
    <div>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 30px",
          background: "#1e3a8a",
          color: "white",
        }}
      >
        <h1>Grantora Beneficiary Dashboard</h1>
        <LogoutButton />
      </header>

      <main style={{ padding: "20px" }}>
        <h2>Welcome to Grantora</h2>
        <p>Manage your beneficiary profile below.</p>

        <BeneficiaryManagement />
      </main>
    </div>
  );
}

export default BeneficiaryDashboard;
