export type MedicineStatus = "safe" | "near-expiry" | "expired";

export interface Medicine {
  id: number;
  name: string;
  expiryDate: string; // ISO date string YYYY-MM-DD
  batchNumber: string;
  manufacturer: string;
  dosage: string;
  quantity: number;
  notes: string;
  status: MedicineStatus;
  createdAt: number; // timestamp ms
  updatedAt: number;
}

export interface UserInfo {
  userId: string;
  username: string;
  role: "admin" | "user";
}

export interface AuthResult {
  ok?: { token: string; user: UserInfo };
  err?: string;
}

export interface AddMedicineRequest {
  name: string;
  expiryDate: string;
  batchNumber: string;
  manufacturer: string;
  dosage: string;
  quantity: number;
  notes: string;
}

export interface UpdateMedicineRequest extends AddMedicineRequest {
  id: number;
}

export interface MedicineResult {
  ok?: Medicine;
  err?: string;
}

export interface MedicinesResult {
  ok?: Medicine[];
  err?: string;
}

export interface DashboardStats {
  total: number;
  expired: number;
  nearExpiry: number;
  safe: number;
}

export interface AuthSession {
  token: string;
  user: UserInfo;
}
