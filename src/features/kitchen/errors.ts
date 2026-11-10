import type { KitchenActionError } from "./types";

/**
 * Error codes published by the M4 kitchen RPCs plus shared authorization and
 * validation codes used by the same backend boundary.
 *
 * `private.raise_app_error` raises SQLSTATE P0001 with the application code in
 * `message` and the safe explanation in `detail`.
 */
export const KITCHEN_ERROR_CODES = [
  "AUTH_REQUIRED",
  "PERMISSION_DENIED",
  "ROLE_REQUIRED",
  "BRANCH_NOT_FOUND",
  "BRANCH_ACCESS_DENIED",
  "STAFF_NOT_ACTIVE",
  "ORGANIZATION_NOT_OPERATIONAL",
  "SUBSCRIPTION_RESTRICTED",
  "MENU_ITEM_NOT_FOUND",
  "KITCHEN_TICKET_NOT_FOUND",
  "KITCHEN_TICKET_ITEM_NOT_FOUND",
  "KITCHEN_INVALID_TRANSITION",
  "KITCHEN_TICKET_CANCELLED",
  "KITCHEN_TICKET_INCONSISTENT",
  "KITCHEN_CANCELLATION_INVALID",
  "KITCHEN_STATION_NOT_FOUND",
  "KITCHEN_STATION_INACTIVE",
  "RESOURCE_CONFLICT",
  "VALIDATION_ERROR",
  "RATE_LIMIT_EXCEEDED",
] as const;

export type KitchenErrorCode = (typeof KITCHEN_ERROR_CODES)[number];

const KITCHEN_ERROR_CODE_SET = new Set<string>(KITCHEN_ERROR_CODES);

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

export function normalizeKitchenError(error: unknown): KitchenActionError {
  const candidate = asErrorLike(error);
  const message = candidate.message?.trim() ?? "";

  if (KITCHEN_ERROR_CODE_SET.has(message)) {
    return {
      code: message,
      message: candidate.details?.trim() || message,
      retryable: message === "RATE_LIMIT_EXCEEDED",
    };
  }

  if (candidate.code === "42501") {
    return {
      code: "PERMISSION_DENIED",
      message: candidate.details?.trim() || "You do not have access to kitchen operations.",
      retryable: false,
    };
  }

  if (candidate.code === "PGRST116" || candidate.code === "22P02" || candidate.code === "23503") {
    return {
      code: "KITCHEN_TICKET_NOT_FOUND",
      message: candidate.details?.trim() || "The kitchen record was not found.",
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
      message: "The kitchen service is temporarily unavailable. Please try again.",
      retryable: true,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: candidate.details?.trim() || "The kitchen operation could not be completed.",
    retryable: false,
  };
}
