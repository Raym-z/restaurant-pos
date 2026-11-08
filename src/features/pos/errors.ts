import type { PosActionError } from "./types";

/**
 * Error codes published by the M3 backend RPCs. `private.raise_app_error`
 * raises SQLSTATE P0001 with the application code in `message` and a
 * human-readable explanation in `detail`.
 */
export const POS_ERROR_CODES = [
  "AUTH_REQUIRED",
  "PERMISSION_DENIED",
  "ROLE_REQUIRED",
  "BRANCH_NOT_FOUND",
  "BRANCH_ACCESS_DENIED",
  "STAFF_NOT_ACTIVE",
  "ORGANIZATION_NOT_OPERATIONAL",
  "SUBSCRIPTION_RESTRICTED",
  "TABLE_NOT_FOUND",
  "MENU_ITEM_NOT_FOUND",
  "MENU_ITEM_UNAVAILABLE",
  "INVALID_MENU_PRICE",
  "INVALID_MODIFIER_SELECTION",
  "DINING_SESSION_NOT_FOUND",
  "SESSION_NOT_ACTIVE",
  "SESSION_ALREADY_CLOSED",
  "SESSION_BALANCE_OUTSTANDING",
  "ORDER_NOT_FOUND",
  "ORDER_INVALID_STATUS",
  "ORDER_MODIFICATION_NOT_ALLOWED",
  "ORDER_EMPTY",
  "ORDER_ITEM_QUANTITY_INVALID",
  "ORDER_ITEM_NOT_FOUND",
  "IDEMPOTENCY_CONFLICT",
  "IDEMPOTENCY_IN_PROGRESS",
  "RESOURCE_CONFLICT",
  "VALIDATION_ERROR",
  "RATE_LIMIT_EXCEEDED",
] as const;

export type PosErrorCode = (typeof POS_ERROR_CODES)[number];

const POS_ERROR_CODE_SET = new Set<string>(POS_ERROR_CODES);

function asErrorLike(error: unknown): {
  name?: string;
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
  status?: number;
} {
  if (!error || typeof error !== "object") {
    return {};
  }

  const candidate = error as Record<string, unknown>;
  return {
    name: typeof candidate.name === "string" ? candidate.name : undefined,
    message: typeof candidate.message === "string" ? candidate.message : undefined,
    details: typeof candidate.details === "string" ? candidate.details : undefined,
    hint: typeof candidate.hint === "string" ? candidate.hint : undefined,
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

export function normalizePosError(error: unknown): PosActionError {
  const candidate = asErrorLike(error);
  const message = candidate.message?.trim() ?? "";

  if (POS_ERROR_CODE_SET.has(message)) {
    return {
      code: message,
      message: candidate.details?.trim() || message,
      retryable: message === "RATE_LIMIT_EXCEEDED",
    };
  }

  if (candidate.code === "42501") {
    return {
      code: "PERMISSION_DENIED",
      message: candidate.details?.trim() || "You do not have access to this operation.",
      retryable: false,
    };
  }

  if (candidate.code === "PGRST116" || candidate.code === "22P02") {
    return {
      code: "NOT_FOUND",
      message: candidate.details?.trim() || "The requested record was not found.",
      retryable: false,
    };
  }

  if (candidate.code === "23505") {
    return {
      code: "RESOURCE_CONFLICT",
      message: candidate.details?.trim() || "The request conflicts with the current state.",
      retryable: false,
    };
  }

  if (isTransient(candidate)) {
    return {
      code: "SERVICE_UNAVAILABLE",
      message: "The backend is temporarily unavailable. Please try again.",
      retryable: true,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: candidate.details?.trim() || "The operation could not be completed.",
    retryable: false,
  };
}
