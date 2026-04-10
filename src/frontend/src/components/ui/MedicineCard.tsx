import { Calendar, Edit, Package, Trash2 } from "lucide-react";
import type { Medicine } from "../../types/medicine";
import { daysUntilExpiry, formatDate } from "../../utils/date-utils";
import { StatusBadge } from "./StatusBadge";

interface MedicineCardProps {
  medicine: Medicine;
  onEdit?: (medicine: Medicine) => void;
  onDelete?: (medicine: Medicine) => void;
}

const progressColors: Record<string, string> = {
  safe: "bg-safe/70",
  "near-expiry": "bg-near-expiry/70",
  expired: "bg-expired/70",
};

export function MedicineCard({
  medicine,
  onEdit,
  onDelete,
}: MedicineCardProps) {
  const days = daysUntilExpiry(medicine.expiryDate);
  const maxDays = 365;
  const progress =
    medicine.status === "expired"
      ? 0
      : Math.min(Math.max((days / maxDays) * 100, 0), 100);

  return (
    <div
      className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3 transition-smooth hover:border-primary/30 hover:shadow-md"
      data-ocid="medicine-card"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate text-sm">
            {medicine.name}
          </h3>
          <p className="text-muted-foreground text-xs mt-0.5">
            {medicine.manufacturer}
          </p>
        </div>
        <StatusBadge status={medicine.status} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Package className="w-3 h-3 shrink-0" />
          <span className="truncate">Dosage: {medicine.dosage}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 shrink-0" />
          <span>{formatDate(medicine.expiryDate)}</span>
        </div>
        <div className="text-foreground/70">
          Stock:{" "}
          <span className="text-foreground font-medium">
            {medicine.quantity}
          </span>
        </div>
        <div
          className={
            medicine.status === "expired"
              ? "text-expired"
              : medicine.status === "near-expiry"
                ? "text-near-expiry"
                : "text-safe"
          }
        >
          {medicine.status === "expired"
            ? `${Math.abs(days)}d ago`
            : `${days}d left`}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-smooth ${progressColors[medicine.status]}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {(onEdit || onDelete) && (
        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(medicine)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors-fast px-2 py-1 rounded hover:bg-primary/10"
              data-ocid="medicine-card-edit"
              aria-label={`Edit ${medicine.name}`}
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(medicine)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-expired transition-colors-fast px-2 py-1 rounded hover:bg-expired/10 ml-auto"
              data-ocid="medicine-card-delete"
              aria-label={`Delete ${medicine.name}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
