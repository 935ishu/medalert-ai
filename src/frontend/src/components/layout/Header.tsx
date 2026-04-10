import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, Menu, User, X } from "lucide-react";
import { useState } from "react";
import { backendApi } from "../../hooks/use-backend";
import { useNotifications } from "../../hooks/use-notifications";
import { useAuthStore } from "../../stores/auth-store";

interface HeaderProps {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export function Header({ onMenuToggle, sidebarOpen }: HeaderProps) {
  const { token, user, clearSession } = useAuthStore();
  const { notifications, totalAlerts } = useNotifications();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);

  const handleLogout = () => {
    if (token) backendApi.logout(token);
    clearSession();
    navigate({ to: "/" });
  };

  return (
    <header
      className="h-16 bg-card border-b border-border flex items-center px-4 gap-3 shrink-0"
      data-ocid="header"
    >
      {/* Mobile menu toggle */}
      <button
        type="button"
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors-fast"
        aria-label="Toggle sidebar"
        data-ocid="header-menu-toggle"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notifications */}
      <Popover open={notifOpen} onOpenChange={setNotifOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors-fast"
            aria-label={`Notifications${totalAlerts > 0 ? ` (${totalAlerts})` : ""}`}
            data-ocid="header-notifications"
          >
            <Bell className="w-5 h-5" />
            {totalAlerts > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] min-h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalAlerts > 9 ? "9+" : totalAlerts}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-80 p-0 bg-popover border-border"
          data-ocid="notifications-panel"
        >
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Notifications
              {totalAlerts > 0 && (
                <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs px-1.5">
                  {totalAlerts}
                </Badge>
              )}
            </h3>
          </div>
          <div className="max-h-72 overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                No notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-border/50 last:border-0 flex items-start gap-3 ${
                    n.type === "expired" ? "bg-expired/5" : "bg-near-expiry/5"
                  }`}
                >
                  <span
                    className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                      n.type === "expired" ? "bg-expired" : "bg-near-expiry"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium truncate">
                      {n.medicineName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {n.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* User info */}
      <div className="flex items-center gap-2.5 pl-2 border-l border-border">
        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div className="hidden sm:flex flex-col min-w-0">
          <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
            {user?.username ?? "Guest"}
          </span>
          <span className="text-xs text-muted-foreground capitalize">
            {user?.role ?? "user"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors-fast ml-1"
          aria-label="Logout"
          data-ocid="header-logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
