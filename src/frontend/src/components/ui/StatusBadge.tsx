import type { MedicineStatus } from "../../types/medicine";

interface StatusBadgeProps {
  status: MedicineStatus;
  className?: string;
}

const labels: Record<MedicineStatus, string> = {
  safe: "Safe",
  "near-expiry": "Near Expiry",
  expired: "Expired",
};

const classes: Record<MedicineStatus, string> = {
  safe: "badge-safe",
  "near-expiry": "badge-near-expiry",
  expired: "badge-expired",
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classes[status]} ${className}`}
      data-ocid={`status-badge-${status}`}
    >
      <span className="mr-1 w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {labels[status]}
    </span>
  );
}
