import type { StaffRole } from "@/types/roles";

export interface QueueActionError {
  code: string;
  message: string;
  retryable: boolean;
}

export type QueueLoadResult<T> = { ok: true; data: T } | { ok: false; error: QueueActionError };

export interface QueueViewer {
  roles: readonly StaffRole[];
  branchId: string;
  branchName: string;
  timezone: string;
  isOrganizationScoped: boolean;
  isOrgAdmin: boolean;
}

export type QueueViewerResult =
  | { status: "ready"; viewer: QueueViewer }
  | { status: "unauthenticated" }
  | { status: "unavailable"; error: QueueActionError };
