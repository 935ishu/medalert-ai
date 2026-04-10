import { Link, useRouterState } from "@tanstack/react-router";
import {
  FileBarChart,
  LayoutDashboard,
  Pill,
  ScanLine,
  Settings,
  Stethoscope,
} from "lucide-react";
import { useLangStore } from "../../stores/lang-store";
import { useTranslations } from "../../utils/i18n";

interface NavItemConfig {
  to: string;
  labelKey: "dashboard" | "scanner" | "medicines" | "reports" | "settings";
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItemConfig[] = [
  { to: "/app/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { to: "/app/scanner", labelKey: "scanner", icon: ScanLine },
  { to: "/app/medicines", labelKey: "medicines", icon: Pill },
  { to: "/app/reports", labelKey: "reports", icon: FileBarChart },
  { to: "/app/settings", labelKey: "settings", icon: Settings },
];

interface SidebarProps {
  collapsed?: boolean;
  onClose?: () => void;
}

export function Sidebar({ collapsed = false, onClose }: SidebarProps) {
  const lang = useLangStore((s) => s.language);
  const tr = useTranslations(lang);
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  return (
    <aside
      className="h-full bg-sidebar border-r border-sidebar-border flex flex-col"
      data-ocid="sidebar"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-primary" />
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-base text-foreground">
              Med<span className="text-primary">Alert AI</span>
            </span>
          )}
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map(({ to, labelKey, icon: Icon }) => {
          const isActive = pathname === to || pathname.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors-fast cursor-pointer ${
                isActive ? "sidebar-nav-active" : "sidebar-nav-inactive"
              }`}
              data-ocid={`nav-${labelKey}`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span>{tr(labelKey)}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground text-center">
            Healthcare Monitoring System
          </p>
        </div>
      )}
    </aside>
  );
}
