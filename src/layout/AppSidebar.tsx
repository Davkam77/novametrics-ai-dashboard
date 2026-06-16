import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { GridIcon, BoltIcon, PieChartIcon, TableIcon, UserCircleIcon, PageIcon, LockIcon } from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import { useAppMode } from "../context/ModeContext";

type NavItem = {
  label: string;
  path: string;
  icon: ReactNode;
  description: string;
};

const navItems: NavItem[] = [
  {
    label: "Overview",
    path: "/",
    icon: <GridIcon />,
    description: "Executive summary",
  },
  {
    label: "AI Usage",
    path: "/ai-usage",
    icon: <BoltIcon />,
    description: "Tokens and model mix",
  },
  {
    label: "Automations",
    path: "/automations",
    icon: <PieChartIcon />,
    description: "Workflow execution health",
  },
  {
    label: "API Analytics",
    path: "/api-analytics",
    icon: <TableIcon />,
    description: "Traffic and latency",
  },
  {
    label: "API Keys",
    path: "/api-keys",
    icon: <LockIcon />,
    description: "Secure access tokens",
  },
  {
    label: "Users",
    path: "/users",
    icon: <UserCircleIcon />,
    description: "Customer and plan overview",
  },
  {
    label: "Settings",
    path: "/settings",
    icon: <PageIcon />,
    description: "Workspace preferences",
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { mode } = useAppMode();
  const { status, profile } = useAuth();

  const isCompact = !isExpanded && !isHovered && !isMobileOpen;
  const canSeeUsers =
    mode !== "real" ||
    (status === "authenticated" && profile?.platformRole === "admin");
  const canSeeApiKeys = mode === "real" && status === "authenticated" && Boolean(profile);

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-gray-200 bg-white/90 px-4 backdrop-blur-xl transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-950/90 ${
        isExpanded || isHovered || isMobileOpen ? "w-[280px]" : "w-[92px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex items-center gap-3 border-b border-gray-200 py-6 dark:border-gray-800 ${isCompact ? "justify-center" : "justify-start"}`}>
        <Link
          to="/"
          className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50 px-3 py-2 dark:border-brand-500/20 dark:bg-brand-500/10"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white">
            NM
          </span>
          {!isCompact && (
            <span className="leading-tight">
              <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                NovaMetrics AI
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                Analytics workspace
              </span>
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 no-scrollbar">
        <p className={`mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-gray-400 ${isCompact ? "text-center" : "px-2"}`}>
          {isCompact ? "N" : "Navigation"}
        </p>
        <ul className="space-y-2">
          {navItems
            .filter(
              (item) =>
                (item.path !== "/users" || canSeeUsers) &&
                (item.path !== "/api-keys" || canSeeApiKeys),
            )
            .map((item) => {
            const active = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`menu-item group ${active ? "menu-item-active" : "menu-item-inactive"} ${
                    isCompact ? "justify-center" : "justify-start"
                  }`}
                  title={item.label}
                >
                  <span className={`menu-item-icon-size ${active ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                    {item.icon}
                  </span>
                  {!isCompact && (
                    <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{item.label}</span>
                        <span className="block truncate text-xs font-normal text-gray-500 dark:text-gray-400">
                          {item.description}
                        </span>
                      </span>
                    </span>
                  )}
                </Link>
              </li>
            );
            })}
        </ul>
      </nav>

    </aside>
  );
};

export default AppSidebar;
