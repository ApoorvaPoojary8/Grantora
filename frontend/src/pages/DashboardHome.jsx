import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  dashboardNavigation,
  roleLabels,
} from "../components/dashboardNavigation";
import "../styles/DashboardHome.css";

function DashboardHome({ role }) {
  const name = localStorage.getItem("fullName")?.trim().split(/\s+/)[0];
  const items = (dashboardNavigation[role] || []).filter(
    (item) => item.label !== "Dashboard"
  );

  return (
    <section className="dashboard-home">
      <div className="dashboard-home__welcome">
        <span className="dashboard-home__eyebrow">
          {roleLabels[role]} workspace
        </span>
        <h2>Welcome back{name ? `, ${name}` : ""}</h2>
        <p>Choose a workspace to continue with your Grantora tasks.</p>
      </div>
      <div className="dashboard-home__grid">
        {items.map(({ label, path, icon: Icon }) => (
          <Link className="dashboard-home__card" key={path} to={path}>
            <span className="dashboard-home__icon">
              <Icon size={21} strokeWidth={1.8} />
            </span>
            <span className="dashboard-home__card-copy">
              <strong>{label}</strong>
              <span>Open {label.toLowerCase()}</span>
            </span>
            <ArrowRight
              className="dashboard-home__arrow"
              size={18}
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}

export default DashboardHome;
