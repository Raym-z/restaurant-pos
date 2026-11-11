import { asErrorLike, isNetworkFailure } from "@/lib/supabase/errors";

/**
 * Passwordless email OTP login helpers.
 *
 * The POS signs staff in with a one-time code delivered by Supabase Auth. The
 * email must already belong to an Auth user, so `shouldCreateUser` is always
 * false: logging in can never provision a new account.
 */

export const LOGIN_OTP_LENGTH = 6;
export const LOGIN_OTP_PATTERN = /^\d{6}$/;

/**
 * Mirrors Supabase Auth's per-address email send interval. The UI counts down
 * locally so a repeated request does not burn an Auth rate-limit slot.
 */
export const LOGIN_OTP_RESEND_COOLDOWN_SECONDS = 60;

/** Supabase Auth options for every passwordless login request. */
export const LOGIN_OTP_REQUEST_OPTIONS = { shouldCreateUser: false } as const;

export type LoginOtpErrorCode =
  | "invalid_email"
  | "rate_limited"
  | "unavailable"
  | "generic"
  | "invalid_code"
  | "expired_code"
  | "session_failed";

export type LoginOtpRequestState =
  | { status: "idle"; error: null }
  | { status: "code_sent"; email: string; error: null }
  | { status: "error"; error: LoginOtpErrorCode };

export type LoginOtpVerifyState =
  | { status: "idle"; error: null }
  | { status: "error"; error: LoginOtpErrorCode };

export const INITIAL_LOGIN_OTP_REQUEST_STATE: LoginOtpRequestState = {
  status: "idle",
  error: null,
};

export const INITIAL_LOGIN_OTP_VERIFY_STATE: LoginOtpVerifyState = {
  status: "idle",
  error: null,
};

/** The narrow slice of the Supabase client used by the login flow. */
export interface LoginOtpClient {
  auth: {
    signInWithOtp(args: {
      email: string;
      options: { shouldCreateUser: false };
    }): Promise<{ error: unknown | null }>;
    verifyOtp(args: {
      email: string;
      token: string;
      type: "email";
    }): Promise<{ data: { session: unknown | null }; error: unknown | null }>;
  };
}

export type LoginOtpVerifyResult = { ok: true } | { ok: false; error: LoginOtpErrorCode };

/** Request a login code without ever allowing Auth to create an account. */
export async function requestLoginOtp(
  client: LoginOtpClient,
  email: string,
): Promise<LoginOtpRequestState> {
  try {
    const { error } = await client.auth.signInWithOtp({
      email,
      options: LOGIN_OTP_REQUEST_OPTIONS,
    });

    if (error) {
      return { status: "error", error: normalizeOtpRequestError(error) };
    }

    return { status: "code_sent", email, error: null };
  } catch (error) {
    return { status: "error", error: normalizeOtpRequestError(error) };
  }
}

/** Verify a login code and report whether a session was actually established. */
export async function verifyLoginOtp(
  client: LoginOtpClient,
  email: string,
  token: string,
): Promise<LoginOtpVerifyResult> {
  try {
    const { data, error } = await client.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      return { ok: false, error: normalizeOtpVerifyError(error) };
    }

    return data.session ? { ok: true } : { ok: false, error: "session_failed" };
  } catch (error) {
    return { ok: false, error: normalizeOtpVerifyError(error) };
  }
}

/**
 * Normalize a login address to the lowercase form Supabase Auth stores.
 *
 * Deliberately uses a small local check instead of importing a schema library:
 * this module is also read by the client component, and the login bundle does
 * not need to carry validation code that only the server action uses.
 */
export function normalizeLoginEmail(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();
  if (email.length === 0 || email.length > 254) {
    return null;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

/** Accept only a complete six-digit code; strip the spaces mobile keyboards add. */
export function normalizeLoginOtp(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const token = value.replace(/\s+/g, "");
  return LOGIN_OTP_PATTERN.test(token) ? token : null;
}

/** Live-input formatter for the six-digit code field. */
export function sanitizeLoginOtpInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, LOGIN_OTP_LENGTH);
}

export function isLoginOtpComplete(value: string): boolean {
  return LOGIN_OTP_PATTERN.test(value);
}

function isRateLimited(code: string, message: string): boolean {
  return (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    code === "rate_limit_exceeded" ||
    code === "too_many_requests" ||
    message.includes("rate limit") ||
    message.includes("too many requests")
  );
}

function isInvalidEmail(code: string, message: string): boolean {
  return (
    code === "email_address_invalid" ||
    code === "invalid_email" ||
    code === "validation_failed" ||
    message.includes("invalid email") ||
    message.includes("email address is invalid")
  );
}

/**
 * Map a failed OTP send to a safe user-facing code.
 *
 * Supabase deliberately does not distinguish an unknown address from one that
 * can only use a social provider. Those failures map to the generic code below,
 * so the UI never states whether an account exists.
 */
export function normalizeOtpRequestError(error: unknown): LoginOtpErrorCode {
  const candidate = asErrorLike(error);
  const code = (candidate.code ?? "").toLowerCase();
  const message = (candidate.message ?? "").toLowerCase();

  if (candidate.status === 429 || isRateLimited(code, message)) {
    return "rate_limited";
  }

  if (isInvalidEmail(code, message)) {
    return "invalid_email";
  }

  if (isNetworkFailure(candidate) || (candidate.status ?? 0) >= 500) {
    return "unavailable";
  }

  return "generic";
}

/**
 * Map a failed OTP verification to a safe user-facing code.
 *
 * Supabase reports both an expired and a mistyped code as `otp_expired` with
 * the message "Token has expired or is invalid". The distinction below keeps
 * the clearer message whenever the provider supplies one, and falls back to the
 * combined invalid-code message otherwise.
 */
export function normalizeOtpVerifyError(error: unknown): LoginOtpErrorCode {
  const candidate = asErrorLike(error);
  const code = (candidate.code ?? "").toLowerCase();
  const message = (candidate.message ?? "").toLowerCase();

  if (candidate.status === 429 || isRateLimited(code, message)) {
    return "rate_limited";
  }

  if (isNetworkFailure(candidate) || (candidate.status ?? 0) >= 500) {
    return "unavailable";
  }

  if (code === "otp_expired" || code === "token_expired" || code === "expired_token") {
    return message.includes("invalid") ? "invalid_code" : "expired_code";
  }

  if (
    code === "invalid_otp" ||
    code === "otp_invalid" ||
    code === "invalid_token" ||
    code === "token_invalid"
  ) {
    return "invalid_code";
  }

  if (message.includes("expired")) {
    return "expired_code";
  }

  if (message.includes("invalid") || message.includes("token")) {
    return "invalid_code";
  }

  return "generic";
}
