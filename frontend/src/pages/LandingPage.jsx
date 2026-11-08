import { useEffect } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BellRing,
  BookOpenCheck,
  Check,
  CircleHelp,
  ClipboardCheck,
  FileCheck2,
  FileSearch,
  LockKeyhole,
  Search,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import PublicSchemeCatalog from "../components/PublicSchemeCatalog";
import "../styles/PublicLanding.css";

const features = [
  {
    icon: FileSearch,
    title: "Government Scheme Discovery",
    description:
      "Explore active opportunities and understand the criteria for each scheme.",
  },
  {
    icon: BadgeCheck,
    title: "Smart Eligibility Checking",
    description:
      "See how your profile and answers match the requirements configured for a scheme.",
  },
  {
    icon: ClipboardCheck,
    title: "Simplified Grant Applications",
    description:
      "Create an application, provide the requested details, and submit it in one place.",
  },
  {
    icon: BellRing,
    title: "Application Tracking",
    description:
      "Return to your dashboard to review your application status and eligibility results.",
  },
  {
    icon: ShieldCheck,
    title: "Transparent Verification",
    description:
      "Keep application information and its current review status visible in your workspace.",
  },
  {
    icon: LockKeyhole,
    title: "Secure Beneficiary Profiles",
    description:
      "Maintain your personal details securely for use across your grant journey.",
  },
];

const steps = [
  {
    number: "01",
    icon: UserRoundCheck,
    title: "Create your profile",
    description: "Register and add the beneficiary information needed to apply.",
  },
  {
    number: "02",
    icon: Search,
    title: "Explore schemes",
    description: "Browse available schemes and review their eligibility criteria.",
  },
  {
    number: "03",
    icon: FileCheck2,
    title: "Check and apply",
    description: "Answer scheme questions and submit your grant application.",
  },
  {
    number: "04",
    icon: BookOpenCheck,
    title: "Track your progress",
    description: "Follow your application and review updates in your dashboard.",
  },
];

const faqs = [
  {
    question: "How do I register for Grantora?",
    answer:
      "Choose Get Started or Register, create a beneficiary account, then complete your beneficiary profile after signing in.",
  },
  {
    question: "How do I apply for a grant?",
    answer:
      "Sign in, browse active schemes, select a scheme, answer its eligibility questions, and submit an application with the requested details.",
  },
  {
    question: "How is eligibility calculated?",
    answer:
      "Grantora checks the scheme’s mandatory age, annual income, and category requirements, then scores the scheme-specific answers using the rules configured for that scheme. An eligibility result is informational; it does not approve or reject a grant.",
  },
  {
    question: "Where can I track my application?",
    answer:
      "Sign in to your beneficiary dashboard and open My Applications to review submitted applications and their current status.",
  },
  {
    question: "How does application verification work?",
    answer:
      "Submitted applications can be reviewed by the responsible government team. Verification and approval timelines depend on the scheme and its review process.",
  },
];

function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      requestAnimationFrame(() => {
        document.getElementById(location.hash.slice(1))?.scrollIntoView();
      });
    }
  }, [location.hash]);

  return (
    <main className="public-landing">
      <section className="public-hero" id="home">
        <div className="public-hero__glow" aria-hidden="true" />
        <div className="public-container public-hero__inner">
          <div className="public-hero__copy">
            <span className="public-eyebrow">
              <span className="public-eyebrow__dot" />
              A clearer path to grant opportunities
            </span>
            <h1>
              Making Government Grants{" "}
              <span>Accessible to Everyone</span>
            </h1>
            <p>
              Grantora simplifies the process of discovering government
              schemes, checking eligibility, applying for grants, and tracking
              application progress through one transparent platform.
            </p>
            <div className="public-hero__actions">
              <Link
                className="public-button public-button--primary"
                to="/schemes"
              >
                Explore Schemes <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link
                className="public-button public-button--outline"
                to="/register"
              >
                Get Started
              </Link>
            </div>
            <div className="public-hero__trust">
              <span><Check size={15} aria-hidden="true" /> Scheme-based eligibility</span>
              <span><Check size={15} aria-hidden="true" /> Application tracking</span>
            </div>
          </div>

          <div className="public-hero__visual" aria-label="Grantora grant journey preview">
            <div className="public-preview">
              <div className="public-preview__topbar">
                <div className="public-preview__brand">
                  <span className="public-preview__brand-mark">G</span>
                  <span>Grantora <small>BENEFICIARY SPACE</small></span>
                </div>
                <span className="public-preview__avatar">B</span>
              </div>
              <div className="public-preview__body">
                <div className="public-preview__heading">
                  <div>
                    <span className="public-preview__label">YOUR WORKSPACE</span>
                    <h2>Your grant journey</h2>
                  </div>
                  <span className="public-preview__badge">
                    <ShieldCheck size={14} aria-hidden="true" /> Secure
                  </span>
                </div>
                <div className="public-preview__journey">
                  <div className="public-preview__journey-step public-preview__journey-step--current">
                    <span className="public-preview__step-icon"><Search size={17} /></span>
                    <span><strong>Discover schemes</strong><small>Explore available opportunities</small></span>
                    <ArrowRight size={15} aria-hidden="true" />
                  </div>
                  <div className="public-preview__journey-step">
                    <span className="public-preview__step-icon"><BadgeCheck size={17} /></span>
                    <span><strong>Check eligibility</strong><small>Review scheme requirements</small></span>
                    <ArrowRight size={15} aria-hidden="true" />
                  </div>
                  <div className="public-preview__journey-step">
                    <span className="public-preview__step-icon"><FileCheck2 size={17} /></span>
                    <span><strong>Submit application</strong><small>Apply with your information</small></span>
                    <ArrowRight size={15} aria-hidden="true" />
                  </div>
                  <div className="public-preview__journey-step">
                    <span className="public-preview__step-icon"><BookOpenCheck size={17} /></span>
                    <span><strong>Track progress</strong><small>Stay informed in your dashboard</small></span>
                    <ArrowRight size={15} aria-hidden="true" />
                  </div>
                </div>
                <div className="public-preview__note">
                  <span className="public-preview__note-icon"><ShieldCheck size={16} /></span>
                  <span>Eligibility results guide your application. They do not determine grant approval.</span>
                </div>
              </div>
            </div>
            <div className="public-hero__floating public-hero__floating--one">
              <span className="public-hero__floating-icon"><BadgeCheck size={17} /></span>
              <span><strong>Clear criteria</strong><small>Configured per scheme</small></span>
            </div>
            <div className="public-hero__floating public-hero__floating--two">
              <span className="public-hero__floating-icon public-hero__floating-icon--green"><LockKeyhole size={17} /></span>
              <span><strong>One secure space</strong><small>Profile to progress</small></span>
            </div>
          </div>
        </div>
        <a className="public-hero__scroll" href="#features">
          Discover Grantora <ArrowDown size={15} aria-hidden="true" />
        </a>
      </section>

      <section className="public-section public-section--white" id="features">
        <div className="public-container">
          <div className="public-section-heading">
            <span className="public-eyebrow">ONE CONNECTED PLATFORM</span>
            <h2>A simpler way to manage every step</h2>
            <p>
              Find the information you need and move through your grant
              application with greater clarity.
            </p>
          </div>
          <div className="public-feature-grid">
            {features.map(({ icon: Icon, title, description }) => (
              <article className="public-feature-card" key={title}>
                <span className="public-feature-card__icon">
                  <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section public-section--tint" id="how-it-works">
        <div className="public-container">
          <div className="public-section-heading">
            <span className="public-eyebrow">HOW IT WORKS</span>
            <h2>Four steps from discovery to updates</h2>
            <p>Your grant journey, organized in one straightforward process.</p>
          </div>
          <div className="public-steps">
            {steps.map(({ number, icon: Icon, title, description }, index) => (
              <article className="public-step" key={number}>
                <div className="public-step__top">
                  <span className="public-step__icon"><Icon size={21} aria-hidden="true" /></span>
                  <span className="public-step__number">{number}</span>
                </div>
                {index < steps.length - 1 && <span className="public-step__connector" aria-hidden="true" />}
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section public-section--white" id="schemes">
        <div className="public-container">
          <div className="public-section-heading public-section-heading--split">
            <div>
              <span className="public-eyebrow">FIND AN OPPORTUNITY</span>
              <h2>Explore available schemes</h2>
              <p>
                Scheme details shown here come from Grantora’s scheme
                catalogue. Availability depends on your sign-in access.
              </p>
            </div>
            <Link className="public-text-link" to="/schemes">
              Explore all schemes <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <PublicSchemeCatalog limit={3} />
        </div>
      </section>

      <section className="public-section public-section--navy" id="about">
        <div className="public-container">
          <div className="public-section-heading public-section-heading--light">
            <span className="public-eyebrow">BUILT FOR EVERY PART OF THE PROCESS</span>
            <h2>One platform. Different perspectives.</h2>
            <p>
              Grantora brings applicants and the teams managing schemes into a
              more connected workflow.
            </p>
          </div>
          <div className="public-benefits">
            <article className="public-benefit-card">
              <span className="public-benefit-card__icon"><UsersRound size={20} /></span>
              <span className="public-benefit-card__label">FOR BENEFICIARIES</span>
              <h3>Understand your next step</h3>
              <p>
                Discover schemes, review eligibility requirements, submit
                applications, and return to check their status.
              </p>
              <Link to="/register">Create your account <ArrowRight size={15} /></Link>
            </article>
            <article className="public-benefit-card">
              <span className="public-benefit-card__icon"><BadgeCheck size={20} /></span>
              <span className="public-benefit-card__label">FOR ADMINISTRATORS</span>
              <h3>Configure and manage schemes</h3>
              <p>
                Maintain scheme details and configure eligibility criteria
                through a centralized management workspace.
              </p>
              <span className="public-benefit-card__footnote">Role-based administration</span>
            </article>
            <article className="public-benefit-card">
              <span className="public-benefit-card__icon"><ClipboardCheck size={20} /></span>
              <span className="public-benefit-card__label">FOR OFFICERS</span>
              <h3>Review with context</h3>
              <p>
                Access application information and support a more organized
                review process in your officer workspace.
              </p>
              <span className="public-benefit-card__footnote">Role-based access</span>
            </article>
          </div>
        </div>
      </section>

      <section className="public-section public-section--white" id="faq">
        <div className="public-container public-faq">
          <div className="public-faq__intro">
            <span className="public-eyebrow">GOOD TO KNOW</span>
            <h2>Frequently asked questions</h2>
            <p>Helpful details about using Grantora.</p>
            <CircleHelp size={42} strokeWidth={1.3} aria-hidden="true" />
          </div>
          <div className="public-faq__list">
            {faqs.map(({ question, answer }) => (
              <details className="public-faq__item" key={question}>
                <summary>{question}<span aria-hidden="true">+</span></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="public-cta" aria-labelledby="public-cta-heading">
        <div className="public-container public-cta__inner">
          <div>
            <span className="public-eyebrow">YOUR GRANT JOURNEY STARTS HERE</span>
            <h2 id="public-cta-heading">Ready to explore your options?</h2>
            <p>Create an account to discover schemes and manage your applications.</p>
          </div>
          <Link className="public-button public-button--light" to="/register">
            Get Started <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}

export default LandingPage;
