import React, { useState } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowRight, ArrowUpRight, Leaf, ShieldCheck, ClipboardCheck, FileText,
  Landmark, Search, Bell, ChevronRight, CheckCircle2, Clock3, Users,
  LayoutDashboard, Sprout, GraduationCap, BriefcaseBusiness, Menu, X,
  ChartNoAxesCombined, Settings, UserRound, FileCheck2, CircleHelp,
  LogOut, Plus, Eye, Filter, MoreHorizontal, Wallet, Activity, BadgeCheck
} from "lucide-react";

const schemes = [
  { name: "Krishi Unnati", category: "AGRICULTURE", title: "Micro-irrigation & sustainable farming", amount: "Up to ₹5,00,000", icon: Sprout, tone: "green", tag: "Popular" },
  { name: "Udyam Shakti", category: "SMALL BUSINESS", title: "Financial assistance for micro enterprises", amount: "Up to ₹10,00,000", icon: BriefcaseBusiness, tone: "amber", tag: "For entrepreneurs" },
  { name: "Shiksha Sahay", category: "EDUCATION", title: "Education, skill & vocational training", amount: "Up to ₹2,00,000", icon: GraduationCap, tone: "blue", tag: "Student support" }
];

function Brand({ light=false }) {
  return <Link to="/" className={`brand ${light ? "brand-light" : ""}`}><span className="brand-mark"><Leaf size={23} fill="currentColor" /></span><span>Grantora</span></Link>;
}
function Header() {
  const [open, setOpen] = useState(false);
  return <header className="site-header">
    <div className="header-inner">
      <Brand />
      <button className="mobile-menu" onClick={()=>setOpen(!open)} aria-label="Toggle menu">{open ? <X/> : <Menu/>}</button>
      <nav className={`main-nav ${open ? "nav-open" : ""}`}>
        <a href="#home" onClick={()=>setOpen(false)}>Home</a>
        <a href="#about" onClick={()=>setOpen(false)}>About</a>
        <a href="#schemes" onClick={()=>setOpen(false)}>Schemes</a>
        <a href="#eligibility" onClick={()=>setOpen(false)}>Eligibility</a>
        <a href="#how" onClick={()=>setOpen(false)}>How it works</a>
        <a href="#contact" onClick={()=>setOpen(false)}>Contact</a>
        <Link to="/login" className="nav-login">Login <ArrowUpRight size={15}/></Link>
      </nav>
    </div>
  </header>;
}
function StatStrip() {
  return <div className="trust-strip">
    <div><span className="strip-icon"><Landmark/></span><span><b>One unified platform</b><small>Explore grant opportunities</small></span></div>
    <div><span className="strip-icon"><ShieldCheck/></span><span><b>Transparent process</b><small>Know what happens next</small></span></div>
    <div><span className="strip-icon"><ChartNoAxesCombined/></span><span><b>Eligibility guidance</b><small>Understand scheme criteria</small></span></div>
    <div><span className="strip-icon"><ClipboardCheck/></span><span><b>Structured approvals</b><small>Step-by-step verification</small></span></div>
  </div>;
}
function SchemeCard({ scheme, onApply }) {
  const Icon=scheme.icon;
  return <article className="scheme-card">
    <div className="scheme-card-top"><div className={`scheme-icon ${scheme.tone}`}><Icon size={24}/></div><span className="scheme-tag">{scheme.tag}</span></div>
    <span className="scheme-category">{scheme.category}</span>
    <h3>{scheme.name}</h3><p>{scheme.title}</p>
    <div className="scheme-bottom"><div><small>Grant amount</small><strong>{scheme.amount}</strong></div><button onClick={onApply} className="scheme-link">Explore <ArrowRight size={16}/></button></div>
  </article>;
}
function DashboardPreview() {
  return <div className="preview-shell">
    <div className="preview-window">
      <div className="preview-top"><div className="window-dots"><i/><i/><i/></div><span>GRANTORA / BENEFICIARY PORTAL</span><div className="preview-avatar">AP</div></div>
      <div className="preview-body">
        <aside className="preview-sidebar"><div className="preview-mini-brand"><Leaf size={17}/> Grantora</div><div className="side-active"><LayoutDashboard size={15}/> Overview</div><div><FileText size={15}/> My applications</div><div><Search size={15}/> Find schemes</div><div><UserRound size={15}/> Profile</div></aside>
        <div className="preview-content">
          <div className="preview-welcome"><div><small>MONDAY, 07 NOVEMBER</small><h3>Good afternoon, Apoorva <span>✦</span></h3><p>Here’s an overview of your grant journey.</p></div><span className="demo-chip">DEMO PREVIEW</span></div>
          <div className="preview-stats"><div><small>Applications</small><strong>03</strong><span className="stat-trend">Across 2 schemes</span></div><div><small>In review</small><strong>02</strong><span className="stat-wait">● Awaiting review</span></div><div><small>Approved</small><strong>01</strong><span className="stat-good">● Decision received</span></div></div>
          <div className="preview-table-head"><b>Recent applications</b><span>View all <ArrowRight size={13}/></span></div>
          <div className="preview-row"><span className="row-symbol green"><Sprout size={15}/></span><div><b>Krishi Unnati</b><small>GR-2026-0142</small></div><span className="pill pending">In review</span></div>
          <div className="preview-row"><span className="row-symbol blue"><GraduationCap size={15}/></span><div><b>Shiksha Sahay</b><small>GR-2026-0119</small></div><span className="pill approved">Approved</span></div>
        </div>
      </div>
    </div>
    <div className="floating-note note-approval"><span className="note-icon"><CheckCircle2 size={18}/></span><div><b>Application submitted</b><small>Your application is now in review</small></div></div>
    <div className="floating-note note-score"><div className="score-ring">86<span>%</span></div><div><b>Eligibility score</b><small>Strong scheme match</small></div></div>
  </div>;
}
function Home() {
  const navigate=useNavigate();
  return <><Header />
    <main>
      <section className="hero" id="home">
        <div className="hero-glow"/>
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="eyebrow"><span/> A BETTER WAY TO ACCESS PUBLIC SUPPORT</div>
            <h1>Grants that move<br/>your <em>future forward.</em></h1>
            <p className="hero-description">Discover opportunities, understand your eligibility, and apply with confidence. Your grant journey—clear, connected, and all in one place.</p>
            <div className="hero-buttons"><Link to="/login" className="button-primary">Find your grant <ArrowRight size={18}/></Link><a href="#how" className="button-secondary">See how it works <ArrowUpRight size={17}/></a></div>
            <div className="hero-assurance"><span><ShieldCheck size={16}/> Transparent process</span><span><CheckCircle2 size={16}/> Guided applications</span></div>
          </div>
          <DashboardPreview />
        </div>
        <div className="hero-bottom-label"><span>BUILT FOR PEOPLE. DESIGNED FOR PROGRESS.</span><span>SCROLL TO EXPLORE ↓</span></div>
      </section>
      <div className="strip-wrap"><StatStrip/></div>
      <section className="schemes-section section-pad" id="schemes">
        <div className="section-head"><div><div className="eyebrow">OPPORTUNITIES FOR EVERY JOURNEY</div><h2>Find the support<br/><em>you’re looking for.</em></h2></div><div className="section-aside"><p>Explore sample grant categories designed to support agriculture, education, and small businesses.</p><Link to="/login" className="text-link">Explore all schemes <ArrowRight size={17}/></Link></div></div>
        <div className="scheme-grid">{schemes.map(s=><SchemeCard key={s.name} scheme={s} onApply={()=>navigate("/login")}/>)}</div>
        <p className="demo-disclaimer">Illustrative schemes and grant amounts shown for demonstration purposes.</p>
      </section>
      <section className="how-section section-pad" id="how">
        <div className="how-intro"><div className="eyebrow">A CLEARER JOURNEY</div><h2>From opportunity<br/>to <em>outcome.</em></h2><p>Grantora keeps each step organized, so you can focus on what matters—moving forward.</p><Link to="/login" className="button-primary">Start your journey <ArrowRight size={18}/></Link></div>
        <div className="steps">
          {[["01","Discover","Explore schemes that align with your goals.",Search],["02","Check eligibility","Understand requirements before applying.",BadgeCheck],["03","Apply with confidence","Complete your application and upload documents.",FileCheck2],["04","Track & verify","Follow reviews and application decisions.",Activity]].map(([n,t,d,I])=><div className="step" key={n}><div className="step-number">{n}</div><div className="step-icon"><I size={21}/></div><div className="step-copy"><h3>{t}</h3><p>{d}</p></div><ChevronRight className="step-chevron" size={18}/></div>)}
        </div>
      </section>
      <section className="eligibility-section section-pad" id="eligibility"><div className="eligibility-card"><div className="eligibility-art"><div className="art-circle"><ShieldCheck size={76}/></div><div className="art-label">ELIGIBILITY<br/><b>CHECK</b></div></div><div className="eligibility-copy"><div className="eyebrow">KNOW BEFORE YOU APPLY</div><h2>Make your next step<br/><em>an informed one.</em></h2><p>Review scheme requirements and get a clearer understanding of how your profile matches the criteria before you begin your application.</p><Link to="/login" className="button-primary">Check eligibility <ArrowRight size={18}/></Link></div></div></section>
      <section className="cta-section" id="about"><div className="cta-leaf"><Leaf size={42}/></div><div className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</div><h2>There’s support for your<br/><em>next big step.</em></h2><p>Explore grant opportunities and take the first step with Grantora.</p><Link to="/login" className="button-light">Get started with Grantora <ArrowRight size={18}/></Link></section>
    </main>
    <footer className="site-footer" id="contact"><div className="footer-main"><div><Brand light/><p>A clearer, more accessible journey<br/>to grant opportunities.</p></div><div className="footer-links"><div><b>Platform</b><a href="#schemes">Explore schemes</a><a href="#how">How it works</a><a href="#eligibility">Eligibility</a></div><div><b>Get started</b><Link to="/login">Login</Link><Link to="/login">Beneficiary portal</Link><Link to="/login">Officer portal</Link></div><div><b>Information</b><a href="#about">About Grantora</a><a href="#contact">Contact & support</a></div></div></div><div className="footer-bottom"><span>© 2026 Grantora. All rights reserved.</span><span>Designed for transparency. Built for progress.</span></div></footer>
  </>;
}

function Login() {
  const navigate=useNavigate();
  const roles=[
    {id:"admin",name:"Administrator",desc:"Manage schemes, beneficiaries, applications, and platform operations.",icon:Settings,tone:"role-blue",features:["Scheme management","Platform oversight"]},
    {id:"beneficiary",name:"Beneficiary",desc:"Discover grants, submit applications, and keep track of your progress.",icon:Users,tone:"role-cyan",features:["Apply for grants","Track application status"]},
    {id:"officer",name:"Grant Officer",desc:"Review applications, verify eligibility, and move decisions forward.",icon:ClipboardCheck,tone:"role-violet",features:["Verify applications","Review eligibility"]}
  ];
  return <div className="login-page"><div className="login-top"><Brand/><Link to="/" className="back-home">← Back to website</Link></div><div className="login-center"><div className="login-heading"><div className="login-symbol"><Leaf size={28} fill="currentColor"/></div><div className="eyebrow">WELCOME TO GRANTORA</div><h1>Let’s move things <em>forward.</em></h1><p>Choose how you’d like to access the platform.</p></div><div className="role-grid">{roles.map(r=>{const I=r.icon;return <button className={`role-card ${r.tone}`} key={r.id} onClick={()=>navigate(`/dashboard/${r.id}`)}><div className="role-icon"><I size={27}/></div><div className="role-name">{r.name}<ArrowUpRight className="role-arrow" size={18}/></div><p>{r.desc}</p><div className="role-features">{r.features.map(f=><span key={f}><CheckCircle2 size={14}/>{f}</span>)}</div><div className="role-continue">Continue as {r.name}<ArrowRight size={17}/></div></button>})}</div><div className="login-help"><ShieldCheck size={16}/> Secure role-based access <span>•</span> Demo UI — authentication will be connected to the backend</div></div><div className="login-bottom"><span>© 2026 Grantora</span><span>Grant management, made clearer.</span></div></div>;
}

const roleData={
 admin:{title:"Admin Dashboard",subtitle:"Here’s what’s happening across Grantora.",menu:["Overview","Schemes","Beneficiaries","Applications","Eligibility rules","Verification workflow","Reports","Users & roles"],stats:[["Total schemes","12","+2 this month","blue"],["Applications","438","+18% this month","violet"],["In verification","326","Needs attention","amber"],["Approved","87","This cycle","green"]]},
 beneficiary:{title:"Beneficiary Dashboard",subtitle:"Welcome back, Apoorva. Let’s keep your grant journey moving.",menu:["Overview","Browse schemes","My applications","Profile","Documents","Help & support"],stats:[["Applications","03","Across 2 schemes","blue"],["Under review","02","Awaiting review","amber"],["Approved","01","Decision received","green"],["Rejected","00","No rejected applications","red"]]},
 officer:{title:"Officer Dashboard",subtitle:"Review assigned applications and take the next action.",menu:["Overview","Assigned applications","Verification","Application history","Reports"],stats:[["Assigned","56","Applications in queue","blue"],["Pending verification","24","Requires review","amber"],["Forwarded","18","Sent for next review","violet"],["Approved","14","Completed this cycle","green"]]}
};
function Dashboard({role="admin"}) {
  const data=roleData[role]||roleData.admin; const navigate=useNavigate(); const [active,setActive]=useState("Overview"); const [search,setSearch]=useState("");
  const names=["Ramesh P","Sneha K","Mahesh B","Ananya R","Vikram S"];
  const appRows=[["GR-2026-0142",names[0],"Krishi Unnati",86,"In Verification"],["GR-2026-0141",names[1],"Udyam Shakti",72,"Under Review"],["GR-2026-0140",names[2],"Shiksha Sahay",68,"Approved"],["GR-2026-0139",names[3],"Krishi Unnati",91,"Forwarded"],["GR-2026-0138",names[4],"Udyam Shakti",74,"Under Review"]];
  const rows=appRows.filter(r=>r.join(" ").toLowerCase().includes(search.toLowerCase()));
  return <div className="dashboard-layout"><aside className="dash-sidebar"><Brand light/><div className="sidebar-label">WORKSPACE</div>{data.menu.map((m,i)=><button className={`sidebar-item ${active===m?"active":""}`} key={m} onClick={()=>setActive(m)}>{i===0?<LayoutDashboard/>:i===1?<Search/>:i===2?<FileText/>:i===3?<Users/>:i===4?<BadgeCheck/>:i===5?<ClipboardCheck/>:<Activity/>}<span>{m}</span></button>)}<div className="sidebar-spacer"/><button className="sidebar-item" onClick={()=>navigate("/")}><LogOut/><span>Back to website</span></button></aside><main className="dash-main"><header className="dash-header"><div className="dash-breadcrumb">Grantora <ChevronRight size={14}/> {active}</div><div className="dash-header-right"><button className="icon-btn"><Bell size={18}/><i/></button><div className="dash-user"><div className="user-avatar">{role==="admin"?"AD":role==="officer"?"OF":"AP"}</div><span>{role==="admin"?"Admin":role==="officer"?"Officer":"Apoorva"}<small>{role[0].toUpperCase()+role.slice(1)}</small></span></div></div></header><div className="dash-content"><div className="dash-title-row"><div><div className="eyebrow">OVERVIEW / {role.toUpperCase()}</div><h1>{data.title}</h1><p>{data.subtitle}</p></div><button className="dash-primary"><Plus size={17}/>{role==="beneficiary"?"New application":"Create new"}</button></div><div className="dash-stat-grid">{data.stats.map(([label,value,note,tone])=><div className="dash-stat" key={label}><div className={`dash-stat-icon ${tone}`}><ChartNoAxesCombined size={19}/></div><small>{label}</small><strong>{value}</strong><span>{note}</span></div>)}</div><div className="dash-panels"><section className="dash-panel application-panel"><div className="panel-heading"><div><h2>{role==="officer"?"Applications for verification":"Recent applications"}</h2><p>Monitor application activity and status.</p></div><button className="panel-link">View all <ArrowRight size={15}/></button></div><div className="table-tools"><div className="table-search"><Search size={16}/><input placeholder="Search applications..." value={search} onChange={e=>setSearch(e.target.value)}/></div><button className="filter-btn"><Filter size={15}/> Filter</button></div><div className="table-scroll"><table><thead><tr><th>Application ID</th><th>Applicant</th><th>Scheme</th><th>Score</th><th>Status</th><th></th></tr></thead><tbody>{rows.map((r,i)=><tr key={r[0]}><td className="id-cell">{r[0]}</td><td>{role==="beneficiary"?"You":r[1]}</td><td>{r[2]}</td><td><b>{r[3]}</b></td><td><span className={`pill ${r[4].includes("Approved")?"approved":r[4].includes("Verification")?"pending":r[4].includes("Forwarded")?"forwarded":"review"}`}>{r[4]}</span></td><td><button className="row-action"><Eye size={15}/></button></td></tr>)}</tbody></table></div></section><section className="dash-panel quick-panel"><div className="panel-heading"><div><h2>Quick actions</h2><p>Common tasks, one click away.</p></div></div><div className="quick-action-list">{(role==="admin"?[["Create a scheme",Plus],["Add beneficiary",Users],["Configure eligibility",Settings],["Review applications",FileCheck2]]:role==="officer"?[["Review queue",ClipboardCheck],["Check eligibility",BadgeCheck],["View reports",ChartNoAxesCombined]]:[["Browse schemes",Search],["Start application",Plus],["Upload documents",FileText],["Update profile",UserRound]]).map(([t,I])=><button key={t} onClick={()=>setActive(t)}><span><I size={17}/></span>{t}<ArrowUpRight size={15}/></button>)}</div><div className="workflow-mini"><div className="workflow-mini-head"><span>Application workflow</span><span className="workflow-live"><i/> ACTIVE</span></div><div className="workflow-track"><i/><i/><i/><i/></div><div className="workflow-labels"><span>Submitted</span><span>Verification</span><span>Decision</span></div><p>Applications move through structured review stages.</p></div></section></div><div className="dash-footnote"><ShieldCheck size={15}/> Grantora demo workspace · Sample data displayed</div></div></main></div>;
}

export default function App(){
 return <Routes><Route path="/" element={<Home/>}/><Route path="/login" element={<Login/>}/><Route path="/dashboard/:role" element={<DashboardRoute/>}/><Route path="*" element={<Home/>}/></Routes>;
}
function DashboardRoute(){const location=useLocation();const role=location.pathname.split("/").pop();return <Dashboard role={["admin","beneficiary","officer"].includes(role)?role:"admin"}/>;}
