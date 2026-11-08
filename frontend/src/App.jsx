import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import BeneficiaryManagement from "./pages/BeneficiaryManagement";
import DashboardHome from "./pages/DashboardHome";
import DashboardLayout from "./components/DashboardLayout";
import AdminDashboard from "./pages/AdminDashboard";
import GrantApplicationManagement from "./pages/GrantApplicationManagement";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SchemeManagement from "./pages/SchemeManagement";
import DashboardPlaceholder from "./pages/DashboardPlaceholder";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route element={<DashboardLayout role="ADMIN" />}>
            <Route
              path="/admin-dashboard"
              element={<DashboardHome role="ADMIN" />}
              handle={{ pageTitle: "Dashboard" }}
            />
            <Route
              path="/admin/schemes"
              element={<SchemeManagement />}
              handle={{ pageTitle: "Scheme Management" }}
            />
            <Route
              path="/admin/beneficiaries"
              element={<AdminDashboard />}
              handle={{ pageTitle: "Beneficiary Management" }}
            />
            <Route
              path="/admin/applications"
              element={<GrantApplicationManagement />}
              handle={{ pageTitle: "Application Management" }}
            />
            <Route
              path="/admin/eligibility"
              element={<SchemeManagement />}
              handle={{ pageTitle: "Eligibility Configuration" }}
            />
            <Route
              path="/admin/verification"
              element={<DashboardPlaceholder title="Verification & Approvals" />}
              handle={{ pageTitle: "Verification & Approvals" }}
            />
            <Route
              path="/admin/disbursement"
              element={<DashboardPlaceholder title="Grant Disbursement" />}
              handle={{ pageTitle: "Grant Disbursement" }}
            />
            <Route
              path="/admin/reports"
              element={<DashboardPlaceholder title="Reports and Analytics" />}
              handle={{ pageTitle: "Reports and Analytics" }}
            />
            <Route
              path="/admin/profile"
              element={<DashboardPlaceholder title="Profile" />}
              handle={{ pageTitle: "Profile" }}
            />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["BENEFICIARY"]} />}>
          <Route element={<DashboardLayout role="BENEFICIARY" />}>
            <Route
              path="/beneficiary-dashboard"
              element={<DashboardHome role="BENEFICIARY" />}
              handle={{ pageTitle: "Dashboard" }}
            />
            <Route
              path="/beneficiary/schemes"
              element={<SchemeManagement />}
              handle={{ pageTitle: "Browse Schemes" }}
            />
            <Route
              path="/beneficiary/applications"
              element={<GrantApplicationManagement />}
              handle={{ pageTitle: "My Applications" }}
            />
            <Route
              path="/beneficiary/apply"
              element={<GrantApplicationManagement />}
              handle={{ pageTitle: "Apply for Grant" }}
            />
            <Route
              path="/beneficiary/eligibility"
              element={<GrantApplicationManagement />}
              handle={{ pageTitle: "Eligibility Results" }}
            />
            <Route
              path="/beneficiary/profile"
              element={<BeneficiaryManagement />}
              handle={{ pageTitle: "My Profile" }}
            />
            <Route
              path="/beneficiary/notifications"
              element={<DashboardPlaceholder title="Notifications" />}
              handle={{ pageTitle: "Notifications" }}
            />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["OFFICER"]} />}>
          <Route element={<DashboardLayout role="OFFICER" />}>
            <Route
              path="/officer-dashboard"
              element={<DashboardHome role="OFFICER" />}
              handle={{ pageTitle: "Dashboard" }}
            />
            <Route
              path="/officer/assigned"
              element={<DashboardPlaceholder title="Assigned Applications" />}
              handle={{ pageTitle: "Assigned Applications" }}
            />
            <Route
              path="/officer/pending-verification"
              element={<DashboardPlaceholder title="Pending Verification" />}
              handle={{ pageTitle: "Pending Verification" }}
            />
            <Route
              path="/officer/review"
              element={<GrantApplicationManagement />}
              handle={{ pageTitle: "Application Review" }}
            />
            <Route
              path="/officer/history"
              element={<DashboardPlaceholder title="Verification History" />}
              handle={{ pageTitle: "Verification History" }}
            />
            <Route
              path="/officer/profile"
              element={<DashboardPlaceholder title="Profile" />}
              handle={{ pageTitle: "Profile" }}
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
