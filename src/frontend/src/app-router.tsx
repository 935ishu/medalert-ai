import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { AppLayout } from "./components/layout/AppLayout";
import { ToastProvider } from "./components/ui/Toast";
import DashboardPage from "./pages/Dashboard";
import LoginPage from "./pages/Login";
import MedicinesPage from "./pages/Medicines";
import RegisterPage from "./pages/Register";
import ReportsPage from "./pages/Reports";
import ScannerPage from "./pages/Scanner";
import SettingsPage from "./pages/Settings";
import { useAuthStore } from "./stores/auth-store";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <ToastProvider />
      <Outlet />
    </>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app",
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/" });
    }
  },
  component: AppLayout,
});

const appIndexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/app/dashboard" });
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const scannerRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/scanner",
  component: ScannerPage,
});

const medicinesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/medicines",
  component: MedicinesPage,
});

const reportsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/reports",
  component: ReportsPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  registerRoute,
  appRoute.addChildren([
    appIndexRoute,
    dashboardRoute,
    scannerRoute,
    medicinesRoute,
    reportsRoute,
    settingsRoute,
  ]),
]);

export const router = createRouter({ routeTree, defaultPreload: "intent" });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
