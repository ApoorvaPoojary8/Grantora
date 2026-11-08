import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import PublicSchemeCatalog from "../components/PublicSchemeCatalog";
import "../styles/PublicLanding.css";

function PublicSchemesPage() {
  return (
    <main className="public-schemes-page">
      <section className="public-schemes-page__hero">
        <div className="public-container">
          <Link className="public-text-link" to="/#schemes">
            <ArrowLeft size={16} aria-hidden="true" /> Back to home
          </Link>
          <span className="public-eyebrow">GRANTORA SCHEME DIRECTORY</span>
          <h1>Explore available schemes</h1>
          <p>
            Review active scheme information and eligibility criteria. Sign in
            to start an application.
          </p>
          <div className="public-schemes-page__note">
            <Search size={17} aria-hidden="true" />
            Scheme information is retrieved from the Grantora catalogue.
          </div>
        </div>
      </section>
      <section className="public-section public-section--white">
        <div className="public-container">
          <PublicSchemeCatalog />
          <div className="public-schemes-page__footer">
            <span>Ready to apply?</span>
            <Link className="public-button public-button--primary public-button--small" to="/login">
              Login to Grantora <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default PublicSchemesPage;
