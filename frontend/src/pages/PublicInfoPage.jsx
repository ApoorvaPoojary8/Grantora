import { ArrowLeft, FileText } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import "../styles/PublicLanding.css";

function PublicInfoPage() {
  const { pathname } = useLocation();
  const isPrivacy = pathname === "/privacy";
  const title = isPrivacy ? "Privacy Policy" : "Terms and Conditions";

  return (
    <main className="public-info-page">
      <div className="public-container">
        <Link className="public-text-link" to="/">
          <ArrowLeft size={16} aria-hidden="true" /> Back to Grantora
        </Link>
        <section className="public-info-card">
          <span className="public-info-card__icon"><FileText size={23} /></span>
          <span className="public-eyebrow">GRANTORA</span>
          <h1>{title}</h1>
          <p>
            {title} content has not yet been published. Please check back for
            the official policy and terms before relying on this page as legal
            guidance.
          </p>
        </section>
      </div>
    </main>
  );
}

export default PublicInfoPage;
