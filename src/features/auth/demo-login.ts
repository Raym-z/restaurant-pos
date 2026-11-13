import { asErrorLike, normalizeSignInError } from "@/lib/supabase/errors";

import { normalizeLoginEmail } from "./otp";

/**
 * Email-and-password sign-in used only by the public demo entry point.
 *
 * The standard `/login` flow remains passwordless. Keeping this path separate
 * prevents the demo route from changing staff authentication behavior.
 */

export type DemoLoginErrorCode =
  | "invalid_email"
  | "password_required"
  | "invalid_credentials"
  | "email_not_confirmed"
  | "unsupported"
  | "unavailable"
  | "session_failed"
  | "generic";

export type DemoLoginState =
  { status: "idle"; error: null } | { status: "error"; error: DemoLoginErrorCode };

export const INITIAL_DEMO_LOGIN_STATE: DemoLoginState = {
  status: "idle",
  error: null,
};

/** The narrow Supabase slice needed by the demo sign-in helper. */
export interface DemoLoginClient {
  auth: {
    signInWithPassword(credentials: {
      email: string;
      password: string;
    }): Promise<{ data: { session: unknown | null }; error: unknown | null }>;
  };
}

export type DemoCredentialsValidation =
  | { ok: true; email: string; password: string }
  | { ok: false; error: "invalid_email" | "password_required" };

/**
 * Validate and normalize the submitted credentials.
 *
 * Email is trimmed and lowercased to match Supabase Auth. The password is kept
 * verbatim because it is case-sensitive and whitespace-significant.
 */
export function validateDemoCredentials(
  emailValue: unknown,
  passwordValue: unknown,
): DemoCredentialsValidation {
  const email = normalizeLoginEmail(emailValue);

  if (!email) {
    return { ok: false, error: "invalid_email" };
  }

  if (typeof passwordValue !== "string" || passwordValue.length === 0) {
    return { ok: false, error: "password_required" };
  }

  return { ok: true, email, password: passwordValue };
}

function normalizeDemoSignInError(error: unknown): DemoLoginErrorCode {
  const code = (asErrorLike(error).code ?? "").toLowerCase();

  if (
    code === "email_provider_disabled" ||
    code === "email_password_disabled" ||
    code === "provider_disabled"
  ) {
    return "unsupported";
  }

  return normalizeSignInError(error);
}

/** Sign in with the credentials the visitor entered, without creating users. */
export async function signInWithDemoPassword(
  client: DemoLoginClient,
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: DemoLoginErrorCode }> {
  try {
    const { data, error } = await client.auth.signInWithPassword({ email, password });

    if (error) {
      return { ok: false, error: normalizeDemoSignInError(error) };
    }

    return data.session ? { ok: true } : { ok: false, error: "session_failed" };
  } catch (error) {
    return { ok: false, error: normalizeDemoSignInError(error) };
  }
}
