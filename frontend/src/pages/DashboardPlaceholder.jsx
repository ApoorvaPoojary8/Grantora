import { Construction } from "lucide-react";
import "../styles/DashboardHome.css";

function DashboardPlaceholder({ title }) {
  return (
    <section className="dashboard-placeholder">
      <span className="dashboard-placeholder__icon" aria-hidden="true">
        <Construction size={24} />
      </span>
      <div>
        <h2>{title}</h2>
        <p>
          This workspace is not available yet. It will appear here when the
          feature is implemented.
        </p>
      </div>
    </section>
  );
}

export default DashboardPlaceholder;
