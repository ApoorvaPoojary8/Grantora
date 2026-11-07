
import "../styles/global.css";

function Home() {
  return (
    <>
      <nav className="navbar">
        <a href="/" className="logo">
          Grant<span>ora</span>
        </a>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#schemes">Schemes</a>
          <a href="#about">About</a>
          <a href="/login" className="login-btn">Login</a>
        </div>
      </nav>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="eyebrow">SMART • TRANSPARENT • ACCESSIBLE</span>

            <h1>
              Government Grants,
              <br />
              <span>Simplified for Everyone.</span>
            </h1>

            <p>
              Discover eligible government schemes, submit applications,
              and track your grant journey — all in one trusted platform.
            </p>

            <div className="hero-actions">
              <a href="/login" className="primary-btn">
                Get Started →
              </a>
              <a href="#schemes" className="secondary-btn">
                Explore Schemes
              </a>
            </div>

            <div className="hero-note">
              ✓ Easy applications &nbsp; ✓ Transparent tracking
            </div>
          </div>

          <div className="hero-card">
            <div className="card-icon">🏛️</div>
            <h3>Grant Management</h3>
            <p>One platform. Multiple opportunities.</p>

            <div className="progress-item">
              <div>
                <span>Application process</span>
                <strong>Simple</strong>
              </div>
              <div className="progress-bar">
                <div />
              </div>
            </div>

            <div className="status-box">
              <span className="status-dot" />
              Transparent application tracking
            </div>
          </div>
        </section>

        <section className="features" id="schemes">
          <div className="section-heading">
            <span className="eyebrow">WHAT GRANTORA OFFERS</span>
            <h2>Everything you need to access grants</h2>
            <p>Designed to make grant applications easier and more transparent.</p>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Discover Schemes</h3>
              <p>Explore available grant schemes and understand their eligibility requirements.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>Apply Online</h3>
              <p>Submit grant applications and supporting information digitally.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚖️</div>
              <h3>Eligibility Assessment</h3>
              <p>Evaluate applications against predefined eligibility criteria.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Track Progress</h3>
              <p>Monitor application status and verification progress in one place.</p>
            </div>
          </div>
        </section>

        <section className="process-section" id="about">
          <div className="section-heading">
            <span className="eyebrow">HOW IT WORKS</span>
            <h2>Your grant journey in four steps</h2>
          </div>

          <div className="process-grid">
            <div><span>01</span><h3>Create an account</h3><p>Register as a beneficiary.</p></div>
            <div><span>02</span><h3>Find a scheme</h3><p>Explore schemes that match your needs.</p></div>
            <div><span>03</span><h3>Submit application</h3><p>Complete the form and submit details.</p></div>
            <div><span>04</span><h3>Track & verify</h3><p>Follow the application review process.</p></div>
          </div>
        </section>

        <section className="cta-section">
          <h2>Ready to explore grant opportunities?</h2>
          <p>Start your application journey with Grantora.</p>
          <a href="/login" className="primary-btn">Get Started →</a>
        </section>
      </main>

      <footer className="footer">
        <div className="logo">Grant<span>ora</span></div>
        <p>Making government grant management simpler and more transparent.</p>
        <p className="copyright">© 2026 Grantora. All rights reserved.</p>
      </footer>
    </>
  );
}

export default Home;
