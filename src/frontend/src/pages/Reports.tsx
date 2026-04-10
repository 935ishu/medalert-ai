import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Download,
  FileText,
  Printer,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useDashboardStats } from "../hooks/use-dashboard";
import { useMedicines } from "../hooks/use-medicines";
import { useAuthStore } from "../stores/auth-store";
import type { Medicine, MedicineStatus } from "../types/medicine";
import { formatDate } from "../utils/date-utils";

type SortField =
  | "name"
  | "expiryDate"
  | "batchNumber"
  | "manufacturer"
  | "status";
type SortDir = "asc" | "desc";
type StatusFilter = "all" | MedicineStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "safe", label: "Safe" },
  { value: "near-expiry", label: "Near Expiry" },
  { value: "expired", label: "Expired" },
];

const SKELETON_ROWS = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5", "sk-6"] as const;
const STATUS_ORDER: Record<MedicineStatus, number> = {
  expired: 0,
  "near-expiry": 1,
  safe: 2,
};
function sortMedicines(
  list: Medicine[],
  field: SortField,
  dir: SortDir,
): Medicine[] {
  return [...list].sort((a, b) => {
    let cmp = 0;
    if (field === "status") {
      cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    } else if (field === "expiryDate") {
      cmp = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    } else {
      cmp = a[field].localeCompare(b[field]);
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

function SortIcon({
  field,
  active,
  dir,
}: { field: SortField; active: SortField; dir: SortDir }) {
  if (active !== field)
    return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />;
  return dir === "asc" ? (
    <ChevronUp className="w-3.5 h-3.5 text-primary" />
  ) : (
    <ChevronDown className="w-3.5 h-3.5 text-primary" />
  );
}

export default function ReportsPage() {
  const { data: medicines = [], isLoading } = useMedicines();
  const { data: stats } = useDashboardStats();
  const user = useAuthStore((s) => s.user);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortField, setSortField] = useState<SortField>("status");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    const base =
      statusFilter === "all"
        ? medicines
        : medicines.filter((m) => m.status === statusFilter);
    return sortMedicines(base, sortField, sortDir);
  }, [medicines, statusFilter, sortField, sortDir]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  async function handleDownloadPDF() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentW = pageW - margin * 2;
    const now = new Date();

    // Header band
    doc.setFillColor(18, 18, 30);
    doc.rect(0, 0, pageW, 28, "F");

    doc.setFontSize(20);
    doc.setTextColor(130, 220, 180);
    doc.setFont("helvetica", "bold");
    doc.text("MedAlert AI", margin, 13);

    doc.setFontSize(10);
    doc.setTextColor(180, 180, 210);
    doc.setFont("helvetica", "normal");
    doc.text("Medicine Inventory Report", margin, 21);

    // Report metadata
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 210);
    const metaX = pageW - margin;
    doc.text(`Generated: ${now.toLocaleString("en-IN")}`, metaX, 13, {
      align: "right",
    });
    if (user)
      doc.text(`User: ${user.username} (${user.role})`, metaX, 19, {
        align: "right",
      });
    const filterLabel =
      STATUS_FILTERS.find((f) => f.value === statusFilter)?.label ?? "All";
    doc.text(
      `Filter: ${filterLabel}  |  Records: ${filtered.length}`,
      metaX,
      25,
      { align: "right" },
    );

    let y = 38;

    // Summary stats
    doc.setFillColor(26, 26, 42);
    doc.roundedRect(margin, y, contentW, 22, 3, 3, "F");
    const summaryStats = [
      {
        label: "Total",
        value: stats?.total ?? medicines.length,
        color: [148, 163, 255] as [number, number, number],
      },
      {
        label: "Safe",
        value: stats?.safe ?? 0,
        color: [100, 220, 160] as [number, number, number],
      },
      {
        label: "Near Expiry",
        value: stats?.nearExpiry ?? 0,
        color: [240, 200, 80] as [number, number, number],
      },
      {
        label: "Expired",
        value: stats?.expired ?? 0,
        color: [240, 90, 80] as [number, number, number],
      },
    ];
    const colW = contentW / summaryStats.length;
    summaryStats.forEach((s, i) => {
      const cx = margin + colW * i + colW / 2;
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...s.color);
      doc.text(String(s.value), cx, y + 11, { align: "center" });
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(160, 160, 180);
      doc.text(s.label, cx, y + 17, { align: "center" });
    });

    y += 30;

    // Table header
    const cols = [
      { label: "Medicine Name", w: 55 },
      { label: "Batch No.", w: 35 },
      { label: "Manufacturer", w: 50 },
      { label: "Dosage", w: 25 },
      { label: "Qty", w: 18 },
      { label: "Expiry Date", w: 32 },
      { label: "Status", w: 30 },
    ];
    doc.setFillColor(30, 30, 50);
    doc.rect(margin, y, contentW, 9, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(200, 200, 230);
    let cx = margin + 3;
    for (const col of cols) {
      doc.text(col.label, cx, y + 6);
      cx += col.w;
    }
    y += 9;

    // Table rows
    const pageH = doc.internal.pageSize.getHeight();
    for (let idx = 0; idx < filtered.length; idx++) {
      const med = filtered[idx];
      if (y + 9 > pageH - margin) {
        doc.addPage();
        y = margin;
      }
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 22 : 26, isEven ? 22 : 26, isEven ? 36 : 42);
      doc.rect(margin, y, contentW, 8.5, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(220, 220, 240);
      const cells = [
        med.name,
        med.batchNumber,
        med.manufacturer,
        med.dosage,
        String(med.quantity),
        formatDate(med.expiryDate),
      ];
      let rx = margin + 3;
      cells.forEach((cell, ci) => {
        const maxW = cols[ci].w - 4;
        const truncated = doc.splitTextToSize(cell, maxW)[0] as string;
        doc.text(truncated, rx, y + 6);
        rx += cols[ci].w;
      });
      // Status pill
      const statusColors: Record<MedicineStatus, [number, number, number]> = {
        safe: [100, 220, 160],
        "near-expiry": [240, 200, 80],
        expired: [240, 90, 80],
      };
      const statusLabels: Record<MedicineStatus, string> = {
        safe: "Safe",
        "near-expiry": "Near Expiry",
        expired: "Expired",
      };
      doc.setTextColor(...statusColors[med.status]);
      doc.setFont("helvetica", "bold");
      doc.text(statusLabels[med.status], rx, y + 6);
      y += 8.5;
    }

    // Footer
    y = doc.internal.pageSize.getHeight() - 10;
    doc.setDrawColor(40, 40, 60);
    doc.line(margin, y - 4, pageW - margin, y - 4);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 150);
    doc.text(
      "Generated by MedAlert AI — Healthcare Medicine Monitoring System",
      margin,
      y,
    );
    doc.text("Page 1", pageW - margin, y, { align: "right" });

    const filename = `medalert-report-${now.toISOString().split("T")[0]}.pdf`;
    doc.save(filename);
  }

  function handlePrint() {
    window.print();
  }

  const COLS: { label: string; field: SortField }[] = [
    { label: "Medicine Name", field: "name" },
    { label: "Batch No.", field: "batchNumber" },
    { label: "Manufacturer", field: "manufacturer" },
    { label: "Expiry Date", field: "expiryDate" },
    { label: "Status", field: "status" },
  ];

  return (
    <div className="p-6 space-y-6 min-h-full" data-ocid="reports-page">
      {/* Page title + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Inventory overview &amp; downloadable PDF export
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-2"
            data-ocid="reports-print-btn"
          >
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button
            size="sm"
            onClick={handleDownloadPDF}
            className="gap-2"
            data-ocid="reports-download-btn"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        data-ocid="reports-stats"
      >
        <StatCard
          label="Total Medicines"
          value={stats?.total ?? medicines.length}
          variant="default"
          loading={isLoading}
        />
        <StatCard
          label="Safe"
          value={stats?.safe ?? 0}
          variant="safe"
          loading={isLoading}
        />
        <StatCard
          label="Near Expiry"
          value={stats?.nearExpiry ?? 0}
          variant="near"
          loading={isLoading}
        />
        <StatCard
          label="Expired"
          value={stats?.expired ?? 0}
          variant="expired"
          loading={isLoading}
        />
      </div>

      {/* Filters */}
      <div
        className="flex items-center gap-2 flex-wrap"
        data-ocid="reports-filters"
      >
        <span className="text-sm text-muted-foreground mr-1">
          Filter by status:
        </span>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors-fast border ${
              statusFilter === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-border/80"
            }`}
            data-ocid={`reports-filter-${f.value}`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div
        className="rounded-xl border border-border bg-card overflow-hidden"
        data-ocid="reports-table"
      >
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-8">
                  #
                </th>
                {COLS.map((col) => (
                  <th key={col.field} className="text-left px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleSort(col.field)}
                      className="flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-foreground transition-colors-fast"
                      data-ocid={`reports-sort-${col.field}`}
                    >
                      {col.label}
                      <SortIcon
                        field={col.field}
                        active={sortField}
                        dir={sortDir}
                      />
                    </button>
                  </th>
                ))}
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  Dosage
                </th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                  Qty
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                SKELETON_ROWS.map((id) => (
                  <tr key={id} className="border-b border-border/50">
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-6" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-36" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-10" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-16 text-center"
                    data-ocid="reports-empty"
                  >
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <FileText className="w-10 h-10 opacity-30" />
                      <p className="font-medium">No medicines found</p>
                      <p className="text-xs">
                        Try changing your filter or add medicines first.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((med, idx) => (
                  <tr
                    key={med.id}
                    className="border-b border-border/40 hover:bg-muted/30 transition-colors-fast"
                    data-ocid={`reports-row-${med.id}`}
                  >
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-[200px]">
                      <span className="truncate block" title={med.name}>
                        {med.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {med.batchNumber || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[160px]">
                      <span className="truncate block" title={med.manufacturer}>
                        {med.manufacturer || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground tabular-nums">
                      {formatDate(med.expiryDate)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={med.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {med.dosage || "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground font-medium">
                      {med.quantity}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Stat card ── */
interface StatCardProps {
  label: string;
  value: number;
  variant: "default" | "safe" | "near" | "expired";
  loading: boolean;
}

function StatCard({ label, value, variant, loading }: StatCardProps) {
  const classes: Record<StatCardProps["variant"], string> = {
    default: "bg-card border-border",
    safe: "stat-card-safe",
    near: "stat-card-near",
    expired: "stat-card-expired",
  };
  const textClasses: Record<StatCardProps["variant"], string> = {
    default: "text-foreground",
    safe: "text-safe",
    near: "text-near-expiry",
    expired: "text-expired",
  };

  return (
    <div
      className={`rounded-xl border p-4 ${classes[variant]}`}
      data-ocid={`reports-stat-${variant}`}
    >
      {loading ? (
        <>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-4 w-24" />
        </>
      ) : (
        <>
          <p
            className={`text-3xl font-bold font-display tabular-nums ${textClasses[variant]}`}
          >
            {value}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
        </>
      )}
    </div>
  );
}
