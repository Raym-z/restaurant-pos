export interface MenuActionError {
  code: string;
  message: string;
  /** True when retrying the same request may succeed. */
  retryable: boolean;
}

/**
 * Application codes raised by the existing menu and authorization RPCs through
 * `private.raise_app_error` (SQLSTATE P0001, code in `message`, explanation in
 * `detail`). Unknown codes fall back to the backend's safe explanation.
 */
export const MENU_ERROR_CODES = [
  "AUTH_REQUIRED",
  "PERMISSION_DENIED",
  "ROLE_REQUIRED",
  "BRANCH_NOT_FOUND",
  "BRANCH_ACCESS_DENIED",
  "STAFF_NOT_ACTIVE",
  "ORGANIZATION_NOT_OPERATIONAL",
  "SUBSCRIPTION_RESTRICTED",
  "MENU_ITEM_NOT_FOUND",
  "INVALID_MENU_PRICE",
  "RESOURCE_CONFLICT",
  "VALIDATION_ERROR",
  "RATE_LIMIT_EXCEEDED",
] as const;

const MENU_ERROR_CODE_SET = new Set<string>(MENU_ERROR_CODES);

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

export function normalizeMenuError(error: unknown): MenuActionError {
  const candidate = asErrorLike(error);
  const message = candidate.message?.trim() ?? "";

  if (MENU_ERROR_CODE_SET.has(message)) {
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
      code: "MENU_ITEM_NOT_FOUND",
      message: candidate.details?.trim() || "The requested menu record was not found.",
      retryable: false,
    };
  }

  if (candidate.code === "23505") {
    return {
      code: "RESOURCE_CONFLICT",
      message: candidate.details?.trim() || "The request conflicts with the current menu data.",
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
    message: candidate.details?.trim() || "The menu operation could not be completed.",
    retryable: false,
  };
}

export type MenuLoadResult<T> = { ok: true; data: T } | { ok: false; error: MenuActionError };
