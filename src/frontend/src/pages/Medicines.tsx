import {
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  FlaskConical,
  Hash,
  Layers,
  Package,
  Pill,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { MedicineCard } from "@/components/ui/MedicineCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import {
  useAddMedicine,
  useDeleteMedicine,
  useMedicineSearch,
  useMedicines,
  useUpdateMedicine,
} from "../hooks/use-medicines";
import { useLangStore } from "../stores/lang-store";
import type {
  AddMedicineRequest,
  Medicine,
  MedicineStatus,
  UpdateMedicineRequest,
} from "../types/medicine";
import {
  computeStatus,
  daysUntilExpiry,
  formatDate,
  todayISO,
} from "../utils/date-utils";
import { useTranslations } from "../utils/i18n";

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;
type SortKey = "expiryDate" | "createdAt" | "name";
type ViewMode = "grid" | "table";

// ─── Form types ──────────────────────────────────────────────────────────────

type MedicineFormData = {
  name: string;
  expiryDate: string;
  batchNumber: string;
  manufacturer: string;
  dosage: string;
  quantity: string;
  notes: string;
};

// ─── MedicineForm ─────────────────────────────────────────────────────────────

function MedicineForm({
  defaultValues,
  onSubmit,
  isPending,
  t,
  submitLabel,
}: {
  defaultValues?: Partial<MedicineFormData>;
  onSubmit: (data: MedicineFormData) => void;
  isPending: boolean;
  t: (k: Parameters<ReturnType<typeof useTranslations>>[0]) => string;
  submitLabel: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MedicineFormData>({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Name */}
      <div className="space-y-1.5">
        <Label
          htmlFor="med-name"
          className="text-foreground text-sm font-medium"
        >
          {t("name")} <span className="text-expired">*</span>
        </Label>
        <div className="relative">
          <Pill className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="med-name"
            className="pl-9 bg-secondary border-input text-foreground"
            placeholder="e.g. Paracetamol 500mg"
            {...register("name", { required: "Name is required" })}
            data-ocid="form-name"
          />
        </div>
        {errors.name && (
          <p className="text-xs text-expired">{errors.name.message}</p>
        )}
      </div>

      {/* Expiry Date */}
      <div className="space-y-1.5">
        <Label
          htmlFor="med-expiry"
          className="text-foreground text-sm font-medium"
        >
          {t("expiryDate")} <span className="text-expired">*</span>
        </Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="med-expiry"
            type="date"
            className="pl-9 bg-secondary border-input text-foreground"
            min={todayISO()}
            {...register("expiryDate", {
              required: "Expiry date is required",
              validate: (v) => {
                if (!v) return "Expiry date is required";
                const d = new Date(v);
                if (Number.isNaN(d.getTime())) return "Invalid date";
                return true;
              },
            })}
            data-ocid="form-expiry"
          />
        </div>
        {errors.expiryDate && (
          <p className="text-xs text-expired">{errors.expiryDate.message}</p>
        )}
      </div>

      {/* Batch + Manufacturer */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label
            htmlFor="med-batch"
            className="text-foreground text-sm font-medium"
          >
            {t("batchNumber")} <span className="text-expired">*</span>
          </Label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="med-batch"
              className="pl-9 bg-secondary border-input text-foreground"
              placeholder="e.g. B2024-001"
              {...register("batchNumber", {
                required: "Batch number is required",
              })}
              data-ocid="form-batch"
            />
          </div>
          {errors.batchNumber && (
            <p className="text-xs text-expired">{errors.batchNumber.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="med-mfr"
            className="text-foreground text-sm font-medium"
          >
            {t("manufacturer")} <span className="text-expired">*</span>
          </Label>
          <div className="relative">
            <FlaskConical className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="med-mfr"
              className="pl-9 bg-secondary border-input text-foreground"
              placeholder="e.g. Sun Pharma"
              {...register("manufacturer", {
                required: "Manufacturer is required",
              })}
              data-ocid="form-manufacturer"
            />
          </div>
          {errors.manufacturer && (
            <p className="text-xs text-expired">
              {errors.manufacturer.message}
            </p>
          )}
        </div>
      </div>

      {/* Dosage + Quantity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label
            htmlFor="med-dosage"
            className="text-foreground text-sm font-medium"
          >
            {t("dosage")} <span className="text-expired">*</span>
          </Label>
          <div className="relative">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="med-dosage"
              className="pl-9 bg-secondary border-input text-foreground"
              placeholder="e.g. 10 mg"
              {...register("dosage", { required: "Dosage is required" })}
              data-ocid="form-dosage"
            />
          </div>
          {errors.dosage && (
            <p className="text-xs text-expired">{errors.dosage.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="med-qty"
            className="text-foreground text-sm font-medium"
          >
            {t("quantity")} <span className="text-expired">*</span>
          </Label>
          <div className="relative">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="med-qty"
              type="number"
              min="0"
              className="pl-9 bg-secondary border-input text-foreground"
              placeholder="0"
              {...register("quantity", {
                required: "Quantity is required",
                min: { value: 0, message: "Must be ≥ 0" },
              })}
              data-ocid="form-quantity"
            />
          </div>
          {errors.quantity && (
            <p className="text-xs text-expired">{errors.quantity.message}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label
          htmlFor="med-notes"
          className="text-foreground text-sm font-medium"
        >
          {t("notes")}
        </Label>
        <Textarea
          id="med-notes"
          className="bg-secondary border-input text-foreground resize-none"
          rows={2}
          placeholder="Optional notes..."
          {...register("notes")}
          data-ocid="form-notes"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          data-ocid="form-submit"
        >
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

// ─── MedicineDetailModal ──────────────────────────────────────────────────────

function MedicineDetailModal({
  medicine,
  open,
  onClose,
  t,
}: {
  medicine: Medicine | null;
  open: boolean;
  onClose: () => void;
  t: (k: Parameters<ReturnType<typeof useTranslations>>[0]) => string;
}) {
  if (!medicine) return null;
  const days = daysUntilExpiry(medicine.expiryDate);

  const fields = [
    {
      icon: <Pill className="w-4 h-4" />,
      label: t("name"),
      value: medicine.name,
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      label: t("expiryDate"),
      value: formatDate(medicine.expiryDate),
    },
    {
      icon: <Hash className="w-4 h-4" />,
      label: t("batchNumber"),
      value: medicine.batchNumber,
    },
    {
      icon: <FlaskConical className="w-4 h-4" />,
      label: t("manufacturer"),
      value: medicine.manufacturer,
    },
    {
      icon: <Package className="w-4 h-4" />,
      label: t("dosage"),
      value: medicine.dosage,
    },
    {
      icon: <Layers className="w-4 h-4" />,
      label: t("quantity"),
      value: String(medicine.quantity),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="bg-card border-border max-w-md"
        data-ocid="medicine-detail-modal"
      >
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-3">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <Pill className="w-5 h-5" />
            </span>
            {medicine.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between py-3 px-4 bg-muted/40 rounded-lg">
          <StatusBadge status={medicine.status} />
          <span
            className={
              medicine.status === "expired"
                ? "text-sm font-medium text-expired"
                : medicine.status === "near-expiry"
                  ? "text-sm font-medium text-near-expiry"
                  : "text-sm font-medium text-safe"
            }
          >
            {medicine.status === "expired"
              ? `Expired ${Math.abs(days)}d ago`
              : `${days} days remaining`}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {fields.map(({ icon, label, value }) => (
            <div
              key={label}
              className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
            >
              <span className="text-muted-foreground shrink-0">{icon}</span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm text-foreground font-medium truncate">
                  {value}
                </p>
              </div>
            </div>
          ))}
          {medicine.notes && (
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">{t("notes")}</p>
              <p className="text-sm text-foreground">{medicine.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── MedicinesTableRow ────────────────────────────────────────────────────────

function MedicinesTableRow({
  medicine,
  onView,
  onEdit,
  onDelete,
}: {
  medicine: Medicine;
  onView: (m: Medicine) => void;
  onEdit: (m: Medicine) => void;
  onDelete: (m: Medicine) => void;
}) {
  const days = daysUntilExpiry(medicine.expiryDate);
  return (
    <tr
      className="border-b border-border/50 hover:bg-muted/30 transition-colors-fast cursor-pointer"
      onClick={() => onView(medicine)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onView(medicine);
      }}
      tabIndex={0}
      data-ocid="medicine-table-row"
    >
      <td className="px-4 py-3">
        <div className="font-medium text-foreground text-sm truncate max-w-[180px]">
          {medicine.name}
        </div>
        <div className="text-xs text-muted-foreground">
          {medicine.manufacturer}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-foreground">
        {formatDate(medicine.expiryDate)}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
        {medicine.batchNumber}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {medicine.dosage}
      </td>
      <td className="px-4 py-3 text-right text-sm tabular-nums text-foreground">
        {medicine.quantity}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={medicine.status} />
      </td>
      <td className="px-4 py-3 text-right">
        <span
          className={`text-xs font-medium ${
            medicine.status === "expired"
              ? "text-expired"
              : medicine.status === "near-expiry"
                ? "text-near-expiry"
                : "text-safe"
          }`}
        >
          {medicine.status === "expired" ? `-${Math.abs(days)}d` : `+${days}d`}
        </span>
      </td>
      <td
        className="px-4 py-3"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onView(medicine)}
            className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors-fast"
            aria-label={`View ${medicine.name}`}
            data-ocid="table-view-btn"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(medicine)}
            className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors-fast"
            aria-label={`Edit ${medicine.name}`}
            data-ocid="table-edit-btn"
          >
            <svg
              aria-hidden="true"
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onDelete(medicine)}
            className="p-1.5 rounded text-muted-foreground hover:text-expired hover:bg-expired/10 transition-colors-fast"
            aria-label={`Delete ${medicine.name}`}
            data-ocid="table-delete-btn"
          >
            <svg
              aria-hidden="true"
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

const SKELETON_KEYS = [
  "sk1",
  "sk2",
  "sk3",
  "sk4",
  "sk5",
  "sk6",
  "sk7",
  "sk8",
] as const;

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MedicinesPage() {
  const { language } = useLangStore();
  const t = useTranslations(language);

  // Query state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MedicineStatus | "all">(
    "all",
  );
  const [sortKey, setSortKey] = useState<SortKey>("expiryDate");
  const [sortAsc, setSortAsc] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);

  // Modal state
  const [addOpen, setAddOpen] = useState(false);
  const [editMed, setEditMed] = useState<Medicine | null>(null);
  const [deleteMed, setDeleteMed] = useState<Medicine | null>(null);
  const [viewMed, setViewMed] = useState<Medicine | null>(null);

  // Data hooks
  const allQuery = useMedicines();
  const searchQuery = useMedicineSearch(debouncedSearch, statusFilter);
  const addMed = useAddMedicine();
  const updateMed = useUpdateMedicine();
  const deleteMedMut = useDeleteMedicine();

  const isFiltered = debouncedSearch !== "" || statusFilter !== "all";
  const rawList = isFiltered ? (searchQuery.data ?? []) : (allQuery.data ?? []);
  const isLoading = isFiltered ? searchQuery.isLoading : allQuery.isLoading;

  // Debounce search input
  const handleSearch = useCallback((val: string) => {
    setSearchTerm(val);
    setPage(1);
    const timeout = setTimeout(() => setDebouncedSearch(val), 300);
    return () => clearTimeout(timeout);
  }, []);

  // Sort
  const sorted = useMemo(() => {
    return [...rawList].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "expiryDate")
        cmp = a.expiryDate.localeCompare(b.expiryDate);
      else if (sortKey === "createdAt") cmp = a.createdAt - b.createdAt;
      else cmp = a.name.localeCompare(b.name);
      return sortAsc ? cmp : -cmp;
    });
  }, [rawList, sortKey, sortAsc]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((p) => !p);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
    setPage(1);
  };

  // Status filter tabs
  const filterTabs: { key: MedicineStatus | "all"; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "safe", label: t("filterSafe") },
    { key: "near-expiry", label: t("filterNear") },
    { key: "expired", label: t("filterExpired") },
  ];

  // Counts from all data
  const allData = allQuery.data ?? [];
  const counts = useMemo(
    () => ({
      all: allData.length,
      safe: allData.filter((m) => m.status === "safe").length,
      "near-expiry": allData.filter((m) => m.status === "near-expiry").length,
      expired: allData.filter((m) => m.status === "expired").length,
    }),
    [allData],
  );

  // Add handler
  const handleAdd = async (data: MedicineFormData) => {
    const req: AddMedicineRequest = {
      ...data,
      quantity: Number(data.quantity),
    };
    try {
      await addMed.mutateAsync(req);
      toast.success("Medicine added successfully");
      setAddOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add medicine");
    }
  };

  // Edit handler
  const handleEdit = async (data: MedicineFormData) => {
    if (!editMed) return;
    const req: UpdateMedicineRequest = {
      id: editMed.id,
      ...data,
      quantity: Number(data.quantity),
    };
    try {
      await updateMed.mutateAsync(req);
      toast.success("Medicine updated successfully");
      setEditMed(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update medicine");
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deleteMed) return;
    try {
      await deleteMedMut.mutateAsync(deleteMed.id);
      toast.success(`${deleteMed.name} deleted`);
      setDeleteMed(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete medicine");
    }
  };

  const sortIcon = (key: SortKey) => (
    <ArrowUpDown
      className={`w-3.5 h-3.5 ml-1 transition-colors ${sortKey === key ? "text-primary" : "text-muted-foreground"}`}
    />
  );

  return (
    <div className="flex flex-col h-full bg-background min-h-0">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 bg-card border-b border-border">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              {t("medicines")}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {allData.length} total · {counts.expired} expired ·{" "}
              {counts["near-expiry"]} near expiry
            </p>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md gap-2"
            data-ocid="add-medicine-btn"
          >
            <Plus className="w-4 h-4" />
            {t("addMedicine")}
          </Button>
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-4 bg-background border-b border-border/50 space-y-3">
        {/* Search + view toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t("searchMedicines")}
              className="pl-9 bg-secondary border-input text-foreground"
              data-ocid="medicines-search"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setDebouncedSearch("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort select */}
          <div className="flex items-center gap-2 ml-auto">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground shrink-0" />
            <Select
              value={`${sortKey}:${sortAsc ? "asc" : "desc"}`}
              onValueChange={(v) => {
                const [k, dir] = v.split(":");
                setSortKey(k as SortKey);
                setSortAsc(dir === "asc");
                setPage(1);
              }}
            >
              <SelectTrigger
                className="w-44 bg-secondary border-input text-sm"
                data-ocid="sort-select"
              >
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="expiryDate:asc">Expiry ↑</SelectItem>
                <SelectItem value="expiryDate:desc">Expiry ↓</SelectItem>
                <SelectItem value="name:asc">Name A→Z</SelectItem>
                <SelectItem value="name:desc">Name Z→A</SelectItem>
                <SelectItem value="createdAt:desc">Newest first</SelectItem>
                <SelectItem value="createdAt:asc">Oldest first</SelectItem>
              </SelectContent>
            </Select>

            {/* View toggle */}
            <div className="flex items-center border border-border rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`px-2.5 py-1.5 text-xs transition-colors-fast ${
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Grid view"
                data-ocid="view-grid"
              >
                <svg
                  aria-hidden="true"
                  className="w-3.5 h-3.5"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <rect x="1" y="1" width="6" height="6" rx="1" />
                  <rect x="9" y="1" width="6" height="6" rx="1" />
                  <rect x="1" y="9" width="6" height="6" rx="1" />
                  <rect x="9" y="9" width="6" height="6" rx="1" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-2.5 py-1.5 text-xs transition-colors-fast ${
                  viewMode === "table"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Table view"
                data-ocid="view-table"
              >
                <svg
                  aria-hidden="true"
                  className="w-3.5 h-3.5"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <rect x="1" y="2" width="14" height="2.5" rx="0.5" />
                  <rect x="1" y="6.5" width="14" height="2.5" rx="0.5" />
                  <rect x="1" y="11" width="14" height="2.5" rx="0.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Status filter tabs */}
        <div
          className="flex items-center gap-1"
          role="tablist"
          aria-label="Filter by status"
        >
          {filterTabs.map(({ key, label }) => {
            const count = counts[key as keyof typeof counts] ?? 0;
            const isActive = statusFilter === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setStatusFilter(key);
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors-fast ${
                  isActive
                    ? key === "safe"
                      ? "badge-safe border"
                      : key === "near-expiry"
                        ? "badge-near-expiry border"
                        : key === "expired"
                          ? "badge-expired border"
                          : "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                data-ocid={`filter-tab-${key}`}
              >
                {label}
                <span className="text-xs opacity-70 tabular-nums">
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content area ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto scrollbar-thin px-6 py-4">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {SKELETON_KEYS.map((k) => (
              <Skeleton key={k} className="h-44 rounded-lg bg-muted" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && sorted.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
            data-ocid="medicines-empty-state"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Pill className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-semibold text-lg">
                {t("noMedicines")}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {isFiltered
                  ? "Try adjusting your search or filter."
                  : "Add your first medicine to get started."}
              </p>
            </div>
            {!isFiltered && (
              <Button
                onClick={() => setAddOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                data-ocid="empty-add-btn"
              >
                <Plus className="w-4 h-4" />
                {t("addMedicine")}
              </Button>
            )}
          </motion.div>
        )}

        {/* Grid view */}
        {!isLoading && sorted.length > 0 && viewMode === "grid" && (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginated.map((med, i) => (
                <motion.div
                  key={med.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  onClick={() => setViewMed(med)}
                  className="cursor-pointer"
                  data-ocid="medicine-grid-item"
                >
                  <MedicineCard
                    medicine={med}
                    onEdit={(m) => {
                      setEditMed(m);
                    }}
                    onDelete={(m) => setDeleteMed(m)}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Table view */}
        {!isLoading && sorted.length > 0 && viewMode === "table" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card border border-border rounded-lg overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-ocid="medicines-table">
                <thead>
                  <tr className="bg-muted/30 border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="px-4 py-3 text-left font-medium">
                      <button
                        type="button"
                        onClick={() => toggleSort("name")}
                        className="flex items-center hover:text-foreground transition-colors-fast"
                      >
                        {t("name")}
                        {sortIcon("name")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      <button
                        type="button"
                        onClick={() => toggleSort("expiryDate")}
                        className="flex items-center hover:text-foreground transition-colors-fast"
                      >
                        {t("expiryDate")}
                        {sortIcon("expiryDate")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      {t("batchNumber")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      {t("dosage")}
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      {t("quantity")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      {t("status")}
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      <button
                        type="button"
                        onClick={() => toggleSort("expiryDate")}
                        className="flex items-center justify-end hover:text-foreground transition-colors-fast ml-auto"
                      >
                        Days{sortIcon("expiryDate")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      {t("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((med) => (
                    <MedicinesTableRow
                      key={med.id}
                      medicine={med}
                      onView={(m) => setViewMed(m)}
                      onEdit={(m) => setEditMed(m)}
                      onDelete={(m) => setDeleteMed(m)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Pagination ────────────────────────────────────────────────── */}
      {!isLoading && sorted.length > PAGE_SIZE && (
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-t border-border bg-card">
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              className="h-8 w-8 p-0 border-border"
              aria-label="Previous page"
              data-ocid="pagination-prev"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                let pg = i + 1;
                if (totalPages > 7) {
                  if (page <= 4) pg = i + 1;
                  else if (page >= totalPages - 3) pg = totalPages - 6 + i;
                  else pg = page - 3 + i;
                }
                return (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setPage(pg)}
                    className={`h-8 w-8 rounded text-xs font-medium transition-colors-fast ${
                      pg === page
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    data-ocid={`pagination-page-${pg}`}
                  >
                    {pg}
                  </button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="h-8 w-8 p-0 border-border"
              aria-label="Next page"
              data-ocid="pagination-next"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Add Medicine Modal ───────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent
          className="bg-card border-border max-w-lg"
          data-ocid="add-medicine-modal"
        >
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              {t("addMedicine")}
            </DialogTitle>
          </DialogHeader>
          <MedicineForm
            onSubmit={handleAdd}
            isPending={addMed.isPending}
            t={t}
            submitLabel={t("addMedicine")}
          />
        </DialogContent>
      </Dialog>

      {/* ── Edit Medicine Modal ──────────────────────────────────────── */}
      <Dialog
        open={!!editMed}
        onOpenChange={(o) => {
          if (!o) setEditMed(null);
        }}
      >
        <DialogContent
          className="bg-card border-border max-w-lg"
          data-ocid="edit-medicine-modal"
        >
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <svg
                aria-hidden="true"
                className="w-5 h-5 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              {t("editMedicine")}
            </DialogTitle>
          </DialogHeader>
          {editMed && (
            <MedicineForm
              defaultValues={{
                name: editMed.name,
                expiryDate: editMed.expiryDate,
                batchNumber: editMed.batchNumber,
                manufacturer: editMed.manufacturer,
                dosage: editMed.dosage,
                quantity: String(editMed.quantity),
                notes: editMed.notes,
              }}
              onSubmit={handleEdit}
              isPending={updateMed.isPending}
              t={t}
              submitLabel={t("save")}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteMed}
        onOpenChange={(o) => {
          if (!o) setDeleteMed(null);
        }}
        title={t("confirmDelete")}
        description={`${t("confirmDeleteMsg")} — "${deleteMed?.name}"`}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        onConfirm={handleDelete}
        variant="destructive"
      />

      {/* ── Detail View Modal ────────────────────────────────────────── */}
      <MedicineDetailModal
        medicine={viewMed}
        open={!!viewMed}
        onClose={() => setViewMed(null)}
        t={t}
      />
    </div>
  );
}
