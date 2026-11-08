import LogoutButton from "../components/LogoutButton";
import SchemeManagement from "./SchemeManagement";
function OfficerDashboard() {
  return (
    <div>
      <h1>Grantora Officer Dashboard</h1>
      <LogoutButton />
      <main>
        <SchemeManagement />
      </main>
    </div>
  );
}

export default OfficerDashboard;