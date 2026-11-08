import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import AdminDashboard from "./pages/AdminDashboard";
import BeneficiaryDashboard from "./pages/BeneficiaryDashboard";
import OfficerDashboard from "./pages/OfficerDashboard";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route
            path="/admin-dashboard"
            element={<AdminDashboard />}
          />
        </Route>

        {/* Beneficiary routes */}
        <Route element={<ProtectedRoute allowedRoles={["BENEFICIARY"]} />}>
          <Route
            path="/beneficiary-dashboard"
            element={<BeneficiaryDashboard />}
          />
        </Route>

        {/* Officer routes */}
        <Route element={<ProtectedRoute allowedRoles={["OFFICER"]} />}>
          <Route
            path="/officer-dashboard"
            element={<OfficerDashboard />}
          />
        </Route>

        {/* Unknown routes */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;