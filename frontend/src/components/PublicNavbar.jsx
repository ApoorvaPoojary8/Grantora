import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import "../styles/PublicLanding.css";

function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="public-header">
      <nav className="public-navbar" aria-label="Main navigation">
        <Link className="public-brand" to="/" onClick={closeMenu}>
          <span className="public-brand__mark" aria-hidden="true">
            G
          </span>
          <span>Grantora</span>
        </Link>

        <button
          className="public-navbar__toggle"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="public-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>

        <div
          className={`public-navbar__content${menuOpen ? " public-navbar__content--open" : ""}`}
          id="public-navigation"
        >
          <div className="public-navbar__links">
            <Link to="/#home" onClick={closeMenu}>Home</Link>
            <Link to="/#schemes" onClick={closeMenu}>Explore Schemes</Link>
            <Link to="/#about" onClick={closeMenu}>About</Link>
            <Link to="/#how-it-works" onClick={closeMenu}>How It Works</Link>
            <Link to="/#contact" onClick={closeMenu}>Contact</Link>
          </div>
          <div className="public-navbar__actions">
            <Link className="public-button public-button--quiet" to="/login" onClick={closeMenu}>
              Login
            </Link>
            <Link className="public-button public-button--primary public-button--small" to="/register" onClick={closeMenu}>
              Get Started <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default PublicNavbar;
