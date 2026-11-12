import type { QueueActionError } from "./types";

/**
 * Error codes published by the M5.2 waitlist queue read RPC plus the shared
 * authorization and validation codes used by the same backend boundary.
 *
 * `private.raise_app_error` raises SQLSTATE P0001 with the application code in
 * `message` and the safe explanation in `details`. PostgREST surfaces that as
 * HTTP 400, so the POS deliberately matches on `message`, not on the status.
 */
export const QUEUE_ERROR_CODES = [
  "AUTH_REQUIRED",
  "PERMISSION_DENIED",
  "ROLE_REQUIRED",
  "BRANCH_NOT_FOUND",
  "BRANCH_ACCESS_DENIED",
  "STAFF_NOT_ACTIVE",
  "ORGANIZATION_NOT_OPERATIONAL",
  "SUBSCRIPTION_RESTRICTED",
  "RESOURCE_CONFLICT",
  "VALIDATION_ERROR",
  "RATE_LIMIT_EXCEEDED",
  "NOT_FOUND",
  "SERVICE_UNAVAILABLE",
  "INVALID_RESPONSE",
  "WORKSPACE_NOT_READY",
  "INTERNAL_ERROR",
] as const;

export type QueueErrorCode = (typeof QUEUE_ERROR_CODES)[number];

const QUEUE_ERROR_CODE_SET = new Set<string>(QUEUE_ERROR_CODES);

function asErrorLike(error: unknown): {
  message?: string;
  details?: string;
  code?: string;
  status?: number;
} {
  if (!error || typeof error !== "object") {
    return {};
  }

  const candidate = error as Record<string, unknown>;
  return {
    message: typeof candidate.message === "string" ? candidate.message : undefined,
    details: typeof candidate.details === "string" ? candidate.details : undefined,
    code: typeof candidate.code === "string" ? candidate.code : undefined,
    status: typeof candidate.status === "number" ? candidate.status : undefined,
  };
}

function isTransient(error: ReturnType<typeof asErrorLike>): boolean {
  if ((error.status ?? 0) >= 500 || error.status === 0) {
    return true;
  }

  const message = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  return (
    message.includes("fetch failed") ||
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("econnrefused") ||
    message.includes("enotfound") ||
    message.includes("service unavailable")
  );
}

export function normalizeQueueError(error: unknown): QueueActionError {
  const candidate = asErrorLike(error);
  const message = candidate.message?.trim() ?? "";

  if (QUEUE_ERROR_CODE_SET.has(message)) {
    return {
      code: message,
      message: candidate.details?.trim() || message,
      retryable: message === "RATE_LIMIT_EXCEEDED" || message === "SERVICE_UNAVAILABLE",
    };
  }

  if (candidate.code === "42501") {
    return {
      code: "PERMISSION_DENIED",
      message: candidate.details?.trim() || "You do not have access to the queue.",
      retryable: false,
    };
  }

  if (candidate.code === "PGRST116" || candidate.code === "22P02" || candidate.code === "23503") {
    return {
      code: "VALIDATION_ERROR",
      message: candidate.details?.trim() || "The queue request is invalid.",
      retryable: false,
    };
  }

  if (candidate.code === "23505") {
    return {
      code: "RESOURCE_CONFLICT",
      message: candidate.details?.trim() || "The queue changed while loading. Refresh again.",
      retryable: true,
    };
  }

  if (isTransient(candidate)) {
    return {
      code: "SERVICE_UNAVAILABLE",
      message: "The queue service is temporarily unavailable. Please try again.",
      retryable: true,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: candidate.details?.trim() || "The queue could not be loaded.",
    retryable: false,
  };
}
