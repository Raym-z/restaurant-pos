export type AppErrorCode =
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_SESSION_MISSING"
  | "AUTH_SESSION_EXPIRED"
  | "AUTH_UNAVAILABLE"
  | "PERMISSION_DENIED"
  | "NOT_FOUND"
  | "NETWORK_ERROR"
  | "INTERNAL_ERROR";

export interface NormalizedError {
  code: AppErrorCode;
  message: string;
  /** True only for confirmed invalid, expired, or revoked credentials. */
  confirmedAuthFailure: boolean;
  /** True when the cause may be temporary and the session must be preserved. */
  transient: boolean;
}

export interface ErrorLike {
  name?: string;
  message?: string;
  code?: string;
  status?: number;
}

const CONFIRMED_AUTH_CODES = new Set([
  "invalid_credentials",
  "invalid_grant",
  "invalid_refresh_token",
  "refresh_token_not_found",
  "session_not_found",
  "session_expired",
  "bad_jwt",
  "invalid_jwt",
  "user_not_found",
]);

export function asErrorLike(error: unknown): ErrorLike {
  if (!error || typeof error !== "object") {
    return {};
  }

  const candidate = error as ErrorLike;
  return {
    name: candidate.name,
    message: candidate.message,
    code: candidate.code,
    status: candidate.status,
  };
}

export function isNetworkFailure(error: ErrorLike): boolean {
  if (error.status === 0) {
    return true;
  }
  if (error.name === "AuthRetryableFetchError") {
    return true;
  }
  const message = error.message?.toLowerCase() ?? "";
  return (
    message.includes("fetch failed") ||
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("econnrefused") ||
    message.includes("enotfound")
  );
}

/**
 * Supabase Auth signals an absent cookie-backed session with
 * `AuthSessionMissingError` / `session_missing`. That is an unauthenticated
 * state, not a temporary service outage.
 */
export function isMissingSessionError(error: unknown): boolean {
  const candidate = asErrorLike(error);
  const name = candidate.name?.toLowerCase() ?? "";
  const code = candidate.code?.toLowerCase() ?? "";
  const message = candidate.message?.toLowerCase() ?? "";

  return (
    name === "authsessionmissingerror" ||
    code === "session_missing" ||
    message.includes("auth session missing")
  );
}

export function isConfirmedAuthFailure(error: unknown): boolean {
  const candidate = asErrorLike(error);
  const code = candidate.code?.toLowerCase() ?? "";

  if (CONFIRMED_AUTH_CODES.has(code)) {
    return true;
  }

  if (candidate.status === 401) {
    return true;
  }

  // 403 and bare 400 responses are not enough on their own. They may come
  // from a gateway or an authorization layer, not from expired credentials.
  return false;
}

export function normalizeAuthError(error: unknown): NormalizedError {
  const candidate = asErrorLike(error);

  if (isMissingSessionError(error)) {
    return {
      code: "AUTH_SESSION_MISSING",
      message: "No active session was found. Please sign in.",
      confirmedAuthFailure: false,
      transient: false,
    };
  }

  if (isConfirmedAuthFailure(error)) {
    return {
      code: "AUTH_SESSION_EXPIRED",
      message: "Your session is no longer valid. Please sign in again.",
      confirmedAuthFailure: true,
      transient: false,
    };
  }

  if (isNetworkFailure(candidate) || (candidate.status ?? 0) >= 500) {
    return {
      code: "AUTH_UNAVAILABLE",
      message: "We could not verify your session right now. Your session was not cleared.",
      confirmedAuthFailure: false,
      transient: true,
    };
  }

  return {
    code: "AUTH_UNAVAILABLE",
    message: "We could not verify your session right now. Your session was not cleared.",
    confirmedAuthFailure: false,
    transient: true,
  };
}

export function normalizeDatabaseError(error: unknown): NormalizedError {
  const candidate = asErrorLike(error);
  const code = candidate.code ?? "";

  if (code === "42501") {
    return {
      code: "PERMISSION_DENIED",
      message: "You do not have access to this information.",
      confirmedAuthFailure: false,
      transient: false,
    };
  }

  if (code === "PGRST116") {
    return {
      code: "NOT_FOUND",
      message: "The requested information was not found.",
      confirmedAuthFailure: false,
      transient: false,
    };
  }

  if (isNetworkFailure(candidate) || (candidate.status ?? 0) >= 500) {
    return {
      code: "NETWORK_ERROR",
      message: "The backend is temporarily unavailable. Please try again.",
      confirmedAuthFailure: false,
      transient: true,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: "The requested information could not be loaded.",
    confirmedAuthFailure: false,
    transient: false,
  };
}

export function normalizeSignInError(
  error: unknown,
): "invalid_credentials" | "email_not_confirmed" | "unavailable" | "generic" {
  const candidate = asErrorLike(error);
  const code = candidate.code?.toLowerCase() ?? "";

  if (code === "email_not_confirmed") {
    return "email_not_confirmed";
  }

  if (
    code === "invalid_credentials" ||
    code === "invalid_grant" ||
    (candidate.status === 400 && code === "")
  ) {
    return "invalid_credentials";
  }

  if (isNetworkFailure(candidate) || (candidate.status ?? 0) >= 500) {
    return "unavailable";
  }

  return "generic";
}
