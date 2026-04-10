import type { MedicineStatus } from "../types/medicine";

const NEAR_EXPIRY_DAYS = 7;

export function isExpired(expiryDate: string): boolean {
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiry < today;
}

export function isNearExpiry(expiryDate: string): boolean {
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const threshold = new Date(today);
  threshold.setDate(threshold.getDate() + NEAR_EXPIRY_DAYS);
  return expiry >= today && expiry <= threshold;
}

export function computeStatus(expiryDate: string): MedicineStatus {
  if (isExpired(expiryDate)) return "expired";
  if (isNearExpiry(expiryDate)) return "near-expiry";
  return "safe";
}

export function daysUntilExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = expiry.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function todayISO(): string {
  return toISODate(new Date());
}
