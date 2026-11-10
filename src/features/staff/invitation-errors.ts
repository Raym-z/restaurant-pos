export interface StaffInvitationActionError {
  code: string;
  message: string;
  retryable: boolean;
}

export const STAFF_INVITATION_ERROR_CODES = [
  "AUTH_REQUIRED",
  "AUTH_INVALID_TOKEN",
  "PERMISSION_DENIED",
  "ROLE_REQUIRED",
  "BRANCH_NOT_FOUND",
  "BRANCH_NOT_ACTIVE",
  "BRANCH_ACCESS_DENIED",
  "STAFF_NOT_ACTIVE",
  "STAFF_ALREADY_MEMBER",
  "ORGANIZATION_NOT_FOUND",
  "ORGANIZATION_NOT_OPERATIONAL",
  "SUBSCRIPTION_RESTRICTED",
  "INVITATION_NOT_FOUND",
  "INVITATION_ALREADY_PENDING",
  "INVITATION_ALREADY_ACCEPTED",
  "INVITATION_REVOKED",
  "INVITATION_EXPIRED",
  "INVITATION_EMAIL_MISMATCH",
  "INVITATION_DELIVERY_FAILED",
  "VALIDATION_ERROR",
  "RESOURCE_CONFLICT",
  "RATE_LIMIT_EXCEEDED",
  "SERVICE_UNAVAILABLE",
] as const;

const CODE_SET = new Set<string>(STAFF_INVITATION_ERROR_CODES);

type ErrorLike = {
  message?: string;
  details?: string;
  code?: string;
  status?: number;
};

function asErrorLike(error: unknown): ErrorLike {
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

function transient(error: ErrorLike): boolean {
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
    message.includes("service unavailable")
  );
}

/**
 * Normalize RPC and Edge Function failures into a stable UI shape.
 *
 * RPC errors use SQLSTATE P0001 with the application code in `message` and the
 * safe explanation in `details`. Edge errors use the shared API envelope and
 * are flattened before this function is called.
 */
export function normalizeStaffInvitationError(error: unknown): StaffInvitationActionError {
  const candidate = asErrorLike(error);
  const message = candidate.message?.trim() ?? "";

  if (CODE_SET.has(message)) {
    return {
      code: message,
      message: candidate.details?.trim() || message,
      retryable:
        message === "RATE_LIMIT_EXCEEDED" ||
        message === "SERVICE_UNAVAILABLE" ||
        message === "INVITATION_DELIVERY_FAILED",
    };
  }

  if (candidate.code === "42501") {
    return {
      code: "PERMISSION_DENIED",
      message: candidate.details?.trim() || "You do not have access to this operation.",
      retryable: false,
    };
  }

  if (candidate.code === "23505") {
    return {
      code: "INVITATION_ALREADY_PENDING",
      message: candidate.details?.trim() || "A pending invitation already exists.",
      retryable: false,
    };
  }

  if (candidate.code === "22P02" || candidate.code === "PGRST116") {
    return {
      code: "INVITATION_NOT_FOUND",
      message: candidate.details?.trim() || "The invitation was not found.",
      retryable: false,
    };
  }

  if (transient(candidate)) {
    return {
      code: "SERVICE_UNAVAILABLE",
      message: "The invitation service is temporarily unavailable. Please try again.",
      retryable: true,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: candidate.details?.trim() || "The invitation operation could not be completed.",
    retryable: false,
  };
}
