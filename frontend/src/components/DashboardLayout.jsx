import { useState } from "react";
import { Bell, ChevronLeft, Menu, X } from "lucide-react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";
import LogoutButton from "./LogoutButton";
import {
  dashboardNavigation,
  roleLabels,
} from "./dashboardNavigation";
import "../styles/DashboardLayout.css";

function DashboardLayout({ role }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();
  const navigation = dashboardNavigation[role] || [];
  const currentPage = navigation.find(
    (item) => item.path === location.pathname
  );
  const title = currentPage?.label || "Dashboard";
  const fullName = localStorage.getItem("fullName") || roleLabels[role];
  const email = localStorage.getItem("email") || "";
  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
  const notificationPath = navigation.find(
    (item) => item.label === "Notifications"
  )?.path;

  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  return (
    <div
      className={`dashboard-shell${sidebarCollapsed ? " dashboard-shell--collapsed" : ""}`}
    >
      {mobileSidebarOpen && (
        <button
          className="dashboard-shell__scrim"
          type="button"
          aria-label="Close navigation menu"
          onClick={closeMobileSidebar}
        />
      )}

      <aside
        className={`dashboard-sidebar${mobileSidebarOpen ? " dashboard-sidebar--open" : ""}`}
        aria-label={`${roleLabels[role]} navigation`}
      >
        <div className="dashboard-sidebar__brand-row">
          <Link
            className="dashboard-sidebar__brand"
            to={dashboardNavigation[role][0].path}
            onClick={closeMobileSidebar}
            aria-label="Grantora dashboard"
          >
            <span className="dashboard-sidebar__brand-mark">G</span>
            <span className="dashboard-sidebar__brand-name">Grantora</span>
          </Link>
          <button
            className="dashboard-sidebar__mobile-close"
            type="button"
            aria-label="Close navigation menu"
            onClick={closeMobileSidebar}
          >
            <X size={20} />
          </button>
        </div>

        <div className="dashboard-sidebar__section-label">WORKSPACE</div>
        <nav className="dashboard-sidebar__nav">
          {navigation.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end
              title={sidebarCollapsed ? label : undefined}
              className={({ isActive }) =>
                `dashboard-sidebar__link${isActive ? " dashboard-sidebar__link--active" : ""}`
              }
              onClick={closeMobileSidebar}
            >
              <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              <span className="dashboard-sidebar__link-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="dashboard-sidebar__footer">
          <div className="dashboard-sidebar__user">
            <span className="dashboard-sidebar__avatar" aria-hidden="true">
              {initials || "G"}
            </span>
            <span className="dashboard-sidebar__user-copy">
              <strong>{fullName}</strong>
              <span>{roleLabels[role]}</span>
            </span>
          </div>
          <LogoutButton className="dashboard-sidebar__logout" />
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar__heading">
            <button
              className="dashboard-topbar__menu"
              type="button"
              aria-label={
                mobileSidebarOpen ? "Close navigation menu" : "Open navigation menu"
              }
              aria-expanded={mobileSidebarOpen}
              onClick={() => {
                setMobileSidebarOpen((open) => !open);
                setNotificationsOpen(false);
              }}
            >
              <Menu size={21} />
            </button>
            <button
              className="dashboard-topbar__collapse"
              type="button"
              aria-label={
                sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
              }
              onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            >
              <ChevronLeft
                size={18}
                className={sidebarCollapsed ? "is-reversed" : ""}
              />
            </button>
            <div>
              <span className="dashboard-topbar__eyebrow">
                {roleLabels[role]}
              </span>
              <h1>{title}</h1>
            </div>
          </div>

          <div className="dashboard-topbar__actions">
            <div className="dashboard-notifications">
              <button
                className="dashboard-notifications__button"
                type="button"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <Bell size={19} />
              </button>
              {notificationsOpen && (
                <div
                  className="dashboard-notifications__panel"
                  role="status"
                >
                  <strong>Notifications</strong>
                  {notificationPath ? (
                    <>
                      <p>View your latest updates and notifications.</p>
                      <Link
                        to={notificationPath}
                        onClick={() => setNotificationsOpen(false)}
                      >
                        Open notifications
                      </Link>
                    </>
                  ) : (
                    <p>You’re all caught up. No new notifications.</p>
                  )}
                </div>
              )}
            </div>

            <div className="dashboard-topbar__profile">
              <span
                className="dashboard-topbar__avatar"
                aria-hidden="true"
              >
                {initials || "G"}
              </span>
              <span className="dashboard-topbar__profile-copy">
                <strong>{fullName}</strong>
                <span>{email || roleLabels[role]}</span>
              </span>
            </div>
          </div>
        </header>

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
