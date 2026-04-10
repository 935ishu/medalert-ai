import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type UserId = string;
export interface UpdateMedicineRequest {
    id: bigint;
    manufacturer: string;
    expiryDate: string;
    name: string;
    notes: string;
    batchNumber: string;
}
export type SessionToken = string;
export type MedicineResult = {
    __kind__: "ok";
    ok: Medicine;
} | {
    __kind__: "err";
    err: string;
};
export type MedicinesResult = {
    __kind__: "ok";
    ok: Array<Medicine>;
} | {
    __kind__: "err";
    err: string;
};
export interface Medicine {
    id: bigint;
    manufacturer: string;
    expiryDate: string;
    userId: UserId;
    name: string;
    createdAt: bigint;
    updatedAt: bigint;
    notes: string;
    batchNumber: string;
}
export type AuthResult = {
    __kind__: "ok";
    ok: {
        token: SessionToken;
        user: UserInfo;
    };
} | {
    __kind__: "err";
    err: string;
};
export interface UserInfo {
    id: UserId;
    username: string;
    role: UserRole;
}
export interface AddMedicineRequest {
    manufacturer: string;
    expiryDate: string;
    name: string;
    notes: string;
    batchNumber: string;
}
export enum UserRole {
    admin = "admin",
    user = "user"
}
export interface backendInterface {
    addMedicine(token: SessionToken, req: AddMedicineRequest): Promise<MedicineResult>;
    deleteMedicine(token: SessionToken, id: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    filterByStatus(token: SessionToken, status: string): Promise<MedicinesResult>;
    getDashboardStats(token: SessionToken): Promise<{
        nearExpiry: bigint;
        total: bigint;
        expired: bigint;
        safe: bigint;
    }>;
    getMedicine(token: SessionToken, id: bigint): Promise<Medicine | null>;
    getMedicines(token: SessionToken): Promise<MedicinesResult>;
    getRecentActivity(token: SessionToken): Promise<Array<Medicine>>;
    login(username: string, password: string): Promise<AuthResult>;
    logout(token: SessionToken): Promise<void>;
    register(username: string, password: string): Promise<AuthResult>;
    searchMedicines(token: SessionToken, term: string): Promise<MedicinesResult>;
    updateMedicine(token: SessionToken, req: UpdateMedicineRequest): Promise<MedicineResult>;
    whoAmI(token: SessionToken): Promise<UserInfo | null>;
}
