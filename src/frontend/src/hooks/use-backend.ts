import type {
  AddMedicineRequest,
  AuthResult,
  DashboardStats,
  Medicine,
  MedicineResult,
  MedicinesResult,
  UpdateMedicineRequest,
  UserInfo,
} from "../types/medicine";
import { computeStatus } from "../utils/date-utils";
import { SAMPLE_MEDICINES } from "../utils/sample-data";

// Since the backend.d.ts has no methods yet (bindings not generated),
// we use a mock implementation backed by in-memory + localStorage for persistence.
// When the backend is deployed, replace these with actor calls.

const STORAGE_KEY = "medalert-medicines";
const USERS_KEY = "medalert-users";

interface StoredUser {
  userId: string;
  username: string;
  passwordHash: string;
  role: "admin" | "user";
}

function loadMedicines(): Medicine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Medicine[];
  } catch {
    // ignore
  }
  // Seed with sample data on first load
  const seeded = SAMPLE_MEDICINES;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveMedicines(meds: Medicine[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meds));
}

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw) as StoredUser[];
  } catch {
    // ignore
  }
  const defaultUsers: StoredUser[] = [
    {
      userId: "u1",
      username: "admin",
      passwordHash: "admin123",
      role: "admin",
    },
    {
      userId: "u2",
      username: "doctor",
      passwordHash: "doctor123",
      role: "user",
    },
  ];
  localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  return defaultUsers;
}

function saveUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Token store: token -> userId
const activeSessions: Record<string, string> = {};

export const backendApi = {
  register(username: string, password: string): AuthResult {
    const users = loadUsers();
    if (users.find((u) => u.username === username)) {
      return { err: "Username already exists" };
    }
    const newUser: StoredUser = {
      userId: `u${Date.now()}`,
      username,
      passwordHash: password,
      role: "user",
    };
    users.push(newUser);
    saveUsers(users);
    const token = `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    activeSessions[token] = newUser.userId;
    const userInfo: UserInfo = {
      userId: newUser.userId,
      username: newUser.username,
      role: newUser.role,
    };
    return { ok: { token, user: userInfo } };
  },

  login(username: string, password: string): AuthResult {
    const users = loadUsers();
    const found = users.find(
      (u) => u.username === username && u.passwordHash === password,
    );
    if (!found) return { err: "Invalid username or password" };
    const token = `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    activeSessions[token] = found.userId;
    const userInfo: UserInfo = {
      userId: found.userId,
      username: found.username,
      role: found.role,
    };
    return { ok: { token, user: userInfo } };
  },

  logout(token: string): void {
    delete activeSessions[token];
  },

  whoAmI(token: string): UserInfo | null {
    const userId = activeSessions[token];
    if (!userId) return null;
    const users = loadUsers();
    const u = users.find((x) => x.userId === userId);
    if (!u) return null;
    return { userId: u.userId, username: u.username, role: u.role };
  },

  addMedicine(_token: string, req: AddMedicineRequest): MedicineResult {
    const meds = loadMedicines();
    const newMed: Medicine = {
      id: Date.now(),
      ...req,
      status: computeStatus(req.expiryDate),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    meds.push(newMed);
    saveMedicines(meds);
    return { ok: newMed };
  },

  updateMedicine(_token: string, req: UpdateMedicineRequest): MedicineResult {
    const meds = loadMedicines();
    const idx = meds.findIndex((m) => m.id === req.id);
    if (idx === -1) return { err: "Medicine not found" };
    const updated: Medicine = {
      ...meds[idx],
      ...req,
      status: computeStatus(req.expiryDate),
      updatedAt: Date.now(),
    };
    meds[idx] = updated;
    saveMedicines(meds);
    return { ok: updated };
  },

  deleteMedicine(_token: string, id: number): { ok: null } | { err: string } {
    const meds = loadMedicines();
    const idx = meds.findIndex((m) => m.id === id);
    if (idx === -1) return { err: "Medicine not found" };
    meds.splice(idx, 1);
    saveMedicines(meds);
    return { ok: null };
  },

  getMedicine(_token: string, id: number): Medicine | null {
    const meds = loadMedicines();
    return meds.find((m) => m.id === id) ?? null;
  },

  getMedicines(_token: string): MedicinesResult {
    const meds = loadMedicines();
    return {
      ok: meds.map((m) => ({ ...m, status: computeStatus(m.expiryDate) })),
    };
  },

  searchMedicines(_token: string, term: string): MedicinesResult {
    const meds = loadMedicines();
    const q = term.toLowerCase();
    const filtered = meds.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.manufacturer.toLowerCase().includes(q) ||
        m.batchNumber.toLowerCase().includes(q),
    );
    return {
      ok: filtered.map((m) => ({ ...m, status: computeStatus(m.expiryDate) })),
    };
  },

  filterByStatus(_token: string, status: string): MedicinesResult {
    const meds = loadMedicines();
    if (status === "all") {
      return {
        ok: meds.map((m) => ({ ...m, status: computeStatus(m.expiryDate) })),
      };
    }
    const filtered = meds.filter((m) => computeStatus(m.expiryDate) === status);
    return {
      ok: filtered.map((m) => ({ ...m, status: computeStatus(m.expiryDate) })),
    };
  },

  getDashboardStats(_token: string): DashboardStats {
    const meds = loadMedicines();
    const statuses = meds.map((m) => computeStatus(m.expiryDate));
    return {
      total: meds.length,
      expired: statuses.filter((s) => s === "expired").length,
      nearExpiry: statuses.filter((s) => s === "near-expiry").length,
      safe: statuses.filter((s) => s === "safe").length,
    };
  },

  getRecentActivity(_token: string): Medicine[] {
    const meds = loadMedicines();
    return [...meds].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  },
};
