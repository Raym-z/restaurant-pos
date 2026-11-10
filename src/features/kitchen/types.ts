import type { StaffRole } from "@/types/roles";

export interface KitchenActionError {
  code: string;
  message: string;
  retryable: boolean;
}

export type KitchenLoadResult<T> = { ok: true; data: T } | { ok: false; error: KitchenActionError };

export type KitchenActionResult<T> =
  | { ok: true; data: T; committed: true }
  | { ok: false; error: KitchenActionError; committed: boolean };

export interface KitchenViewer {
  roles: readonly StaffRole[];
  branchId: string;
  branchName: string;
  timezone: string;
  isOrganizationScoped: boolean;
  isOrgAdmin: boolean;
}

export type KitchenViewerResult =
  | { status: "ready"; viewer: KitchenViewer }
  | { status: "unauthenticated" }
  | { status: "unavailable"; error: KitchenActionError };
