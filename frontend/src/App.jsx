import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { dashboardHomePaths } from "./components/dashboardNavigation";
import BeneficiaryManagement from "./pages/BeneficiaryManagement";
import DashboardHome from "./pages/DashboardHome";
import DashboardLayout from "./components/DashboardLayout";
import AdminDashboard from "./pages/AdminDashboard";
import GrantApplicationManagement from "./pages/GrantApplicationManagement";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LandingPage from "./pages/LandingPage";
import PublicInfoPage from "./pages/PublicInfoPage";
import PublicSchemesPage from "./pages/PublicSchemesPage";
import PublicSiteLayout from "./components/PublicSiteLayout";
import SchemeManagement from "./pages/SchemeManagement";
import DashboardPlaceholder from "./pages/DashboardPlaceholder";
import ProtectedRoute from "./components/ProtectedRoute";
import VerificationWorkflow from "./pages/VerificationWorkflow";

function getAuthenticatedHome() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  return token ? dashboardHomePaths[role] : null;
}

function LandingRoute() {
  const home = getAuthenticatedHome();
  return home ? <Navigate to={home} replace /> : <LandingPage />;
}

function PublicAuthRoute({ children }) {
  const home = getAuthenticatedHome();
  return home ? <Navigate to={home} replace /> : children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicSiteLayout />}>
          <Route path="/" element={<LandingRoute />} />
          <Route path="/schemes" element={<PublicSchemesPage />} />
          <Route path="/privacy" element={<PublicInfoPage />} />
          <Route path="/terms" element={<PublicInfoPage />} />
        </Route>
        <Route
          path="/login"
          element={
            <PublicAuthRoute>
              <Login />
            </PublicAuthRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicAuthRoute>
              <Register />
            </PublicAuthRoute>
          }
        />

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
              element={<VerificationWorkflow />}
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
              element={<VerificationWorkflow />}
              handle={{ pageTitle: "Assigned Applications" }}
            />
            <Route
              path="/officer/pending-verification"
              element={<VerificationWorkflow />}
              handle={{ pageTitle: "Pending Verification" }}
            />
            <Route
              path="/officer/review"
              element={<VerificationWorkflow />}
              handle={{ pageTitle: "Application Review" }}
            />
            <Route
              path="/officer/history"
              element={<VerificationWorkflow historyOnly />}
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
