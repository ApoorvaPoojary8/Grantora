
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

function LogoutButton({ className = "" }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("fullName");
    localStorage.removeItem("email");
    localStorage.removeItem("role");

    navigate("/login", { replace: true });
  };

  return (
    <button className={className} type="button" onClick={handleLogout}>
      <LogOut size={18} strokeWidth={1.8} aria-hidden="true" />
      <span className="logout-button__label">Logout</span>
    </button>
  );
}

export default LogoutButton;
