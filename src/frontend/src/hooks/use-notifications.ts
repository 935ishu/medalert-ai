import { useMemo } from "react";
import { useMedicines } from "./use-medicines";

export interface NotificationItem {
  id: number;
  medicineId: number;
  medicineName: string;
  type: "expired" | "near-expiry";
  message: string;
  expiryDate: string;
}

export function useNotifications() {
  const { data: medicines = [] } = useMedicines();

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];
    for (const m of medicines) {
      if (m.status === "expired") {
        items.push({
          id: m.id * 10 + 1,
          medicineId: m.id,
          medicineName: m.name,
          type: "expired",
          message: `${m.name} has expired`,
          expiryDate: m.expiryDate,
        });
      } else if (m.status === "near-expiry") {
        items.push({
          id: m.id * 10 + 2,
          medicineId: m.id,
          medicineName: m.name,
          type: "near-expiry",
          message: `${m.name} expires soon`,
          expiryDate: m.expiryDate,
        });
      }
    }
    return items;
  }, [medicines]);

  const expiredCount = notifications.filter((n) => n.type === "expired").length;
  const nearExpiryCount = notifications.filter(
    (n) => n.type === "near-expiry",
  ).length;
  const totalAlerts = notifications.length;

  return { notifications, expiredCount, nearExpiryCount, totalAlerts };
}
