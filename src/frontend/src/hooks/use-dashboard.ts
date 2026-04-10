import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../stores/auth-store";
import { backendApi } from "./use-backend";

export function useDashboardStats() {
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      if (!token) return { total: 0, expired: 0, nearExpiry: 0, safe: 0 };
      return backendApi.getDashboardStats(token);
    },
    enabled: !!token,
  });
}

export function useRecentActivity() {
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: async () => {
      if (!token) return [];
      return backendApi.getRecentActivity(token);
    },
    enabled: !!token,
  });
}
