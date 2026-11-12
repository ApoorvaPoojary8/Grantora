import {
  BarChart3,
  Bell,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  FileClock,
  FilePlus2,
  FolderKanban,
  LayoutDashboard,
  Settings2,
  UserRound,
  UsersRound,
} from "lucide-react";

export const dashboardNavigation = {
  ADMIN: [
    { label: "Dashboard", path: "/admin-dashboard", icon: LayoutDashboard },
    { label: "Scheme Management", path: "/admin/schemes", icon: FolderKanban },
    {
      label: "Beneficiary Management",
      path: "/admin/beneficiaries",
      icon: UsersRound,
    },
    {
      label: "Application Management",
      path: "/admin/applications",
      icon: ClipboardList,
    },
    {
      label: "Eligibility Configuration",
      path: "/admin/eligibility",
      icon: Settings2,
    },
    {
      label: "Verification & Approvals",
      path: "/admin/verification",
      icon: ClipboardCheck,
    },
    {
      label: "Grant Disbursement",
      path: "/admin/disbursement",
      icon: CircleDollarSign,
    },
    {
      label: "Reports and Analytics",
      path: "/admin/reports",
      icon: BarChart3,
    },
    { label: "Profile", path: "/admin/profile", icon: UserRound },
    { label: "Workflow Settings", path: "/admin/workflow-settings", icon: Settings2 },
  ],
  BENEFICIARY: [
    {
      label: "Dashboard",
      path: "/beneficiary-dashboard",
      icon: LayoutDashboard,
    },
    { label: "Browse Schemes", path: "/beneficiary/schemes", icon: FolderKanban },
    {
      label: "My Applications",
      path: "/beneficiary/applications",
      icon: ClipboardList,
    },
    {
      label: "Apply for Grant",
      path: "/beneficiary/apply",
      icon: FilePlus2,
    },
    {
      label: "Eligibility Results",
      path: "/beneficiary/eligibility",
      icon: CheckCircle2,
    },
    { label: "My Profile", path: "/beneficiary/profile", icon: UserRound },
    {
      label: "Notifications",
      path: "/beneficiary/notifications",
      icon: Bell,
    },
  ],
  OFFICER: [
    { label: "Dashboard", path: "/officer-dashboard", icon: LayoutDashboard },
    {
      label: "Assigned Applications",
      path: "/officer/assigned",
      icon: ClipboardList,
    },
    {
      label: "Pending Verification",
      path: "/officer/pending-verification",
      icon: ClipboardCheck,
    },
    {
      label: "Application Review",
      path: "/officer/review",
      icon: FileCheck2,
    },
    {
      label: "Verification History",
      path: "/officer/history",
      icon: FileClock,
    },
    { label: "Profile", path: "/officer/profile", icon: UserRound },
    { label: "Notifications", path: "/officer/notifications", icon: Bell },
  ],
};

export const roleLabels = {
  ADMIN: "Administrator",
  BENEFICIARY: "Beneficiary",
  OFFICER: "Officer",
};

export const dashboardHomePaths = {
  ADMIN: "/admin-dashboard",
  BENEFICIARY: "/beneficiary-dashboard",
  OFFICER: "/officer-dashboard",
};
