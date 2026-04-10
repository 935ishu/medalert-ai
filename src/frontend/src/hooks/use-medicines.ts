import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/auth-store";
import type {
  AddMedicineRequest,
  MedicineStatus,
  UpdateMedicineRequest,
} from "../types/medicine";
import { backendApi } from "./use-backend";

export const MEDICINES_KEY = ["medicines"] as const;

export function useMedicines() {
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: MEDICINES_KEY,
    queryFn: async () => {
      if (!token) return [];
      const result = backendApi.getMedicines(token);
      return result.ok ?? [];
    },
    enabled: !!token,
  });
}

export function useMedicineSearch(
  term: string,
  statusFilter: MedicineStatus | "all",
) {
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: ["medicines", "search", term, statusFilter],
    queryFn: async () => {
      if (!token) return [];
      if (term.trim()) {
        const result = backendApi.searchMedicines(token, term);
        const list = result.ok ?? [];
        if (statusFilter !== "all") {
          return list.filter((m) => m.status === statusFilter);
        }
        return list;
      }
      const result = backendApi.filterByStatus(token, statusFilter);
      return result.ok ?? [];
    },
    enabled: !!token,
  });
}

export function useAddMedicine() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (req: AddMedicineRequest) => {
      if (!token) throw new Error("Not authenticated");
      const result = backendApi.addMedicine(token, req);
      if (result.err) throw new Error(result.err);
      return result.ok!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDICINES_KEY });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateMedicine() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (req: UpdateMedicineRequest) => {
      if (!token) throw new Error("Not authenticated");
      const result = backendApi.updateMedicine(token, req);
      if (result.err) throw new Error(result.err);
      return result.ok!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDICINES_KEY });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteMedicine() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      if (!token) throw new Error("Not authenticated");
      const result = backendApi.deleteMedicine(token, id);
      if ("err" in result && result.err) throw new Error(result.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDICINES_KEY });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
