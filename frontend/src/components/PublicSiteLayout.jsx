import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import PublicNavbar from "./PublicNavbar";
import "../styles/PublicLanding.css";

function PublicSiteLayout() {
  return (
    <div className="public-site">
      <PublicNavbar />
      <Outlet />
      <footer className="public-footer" id="contact">
        <div className="public-footer__main">
          <div className="public-footer__brand">
            <Link className="public-brand" to="/">
              <span className="public-brand__mark" aria-hidden="true">G</span>
              <span>Grantora</span>
            </Link>
            <p>
              A clearer, more accessible way to discover schemes and manage
              grant applications.
            </p>
          </div>
          <div className="public-footer__column">
            <h2>Explore</h2>
            <Link to="/#about">About Grantora</Link>
            <Link to="/#how-it-works">How it works</Link>
            <Link to="/schemes">Explore schemes</Link>
          </div>
          <div className="public-footer__column">
            <h2>Account</h2>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>
          <div className="public-footer__column public-footer__trust">
            <span className="public-footer__trust-icon">
              <ShieldCheck size={19} aria-hidden="true" />
            </span>
            <h2>Built for clarity</h2>
            <p>Find scheme information and follow your application in one place.</p>
          </div>
        </div>
        <div className="public-footer__bottom">
          <span>© {new Date().getFullYear()} Grantora</span>
          <div>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms and Conditions</Link>
            <Link to="/#contact">
              Contact <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PublicSiteLayout;
