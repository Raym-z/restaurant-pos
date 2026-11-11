import type { User } from "@supabase/supabase-js";

import { isMissingSessionError, normalizeAuthError, type NormalizedError } from "./errors";

export type AuthUserOutcome =
  | { status: "authenticated"; user: User }
  | { status: "unauthenticated" }
  | { status: "expired"; error: NormalizedError }
  | { status: "unavailable"; error: NormalizedError };

/** The verified identity needed to resolve a workspace. */
export interface AuthIdentity {
  id: string;
  email: string | null;
}

export type AuthIdentityOutcome =
  | { status: "authenticated"; identity: AuthIdentity }
  | { status: "unauthenticated" }
  | { status: "expired"; error: NormalizedError }
  | { status: "unavailable"; error: NormalizedError };

/**
 * Normalizes the three meaningful `getUser()` outcomes:
 *
 * - A user means authenticated.
 * - A null user with no error means unauthenticated.
 * - `AuthSessionMissingError` means unauthenticated, not an outage.
 * - Confirmed invalid/expired credentials mean expired.
 * - Everything else is a transient verification failure.
 */
export function classifyAuthUserResult(result: {
  user: User | null;
  error: unknown | null;
}): AuthUserOutcome {
  if (result.user) {
    return { status: "authenticated", user: result.user };
  }

  if (!result.error || isMissingSessionError(result.error)) {
    return { status: "unauthenticated" };
  }

  const error = normalizeAuthError(result.error);
  if (error.confirmedAuthFailure) {
    return { status: "expired", error };
  }

  return { status: "unavailable", error };
}

/**
 * Normalizes the outcome of `getClaims()`, which verifies the JWT signature and
 * expiry locally (or through the Auth server for symmetric keys) and returns
 * the token claims rather than a user record.
 */
export function classifyAuthClaimsResult(result: {
  claims: { sub?: unknown; email?: unknown } | null;
  error: unknown | null;
}): AuthIdentityOutcome {
  const sub =
    typeof result.claims?.sub === "string" && result.claims.sub.length > 0
      ? result.claims.sub
      : null;

  if (sub) {
    return {
      status: "authenticated",
      identity: {
        id: sub,
        email: typeof result.claims?.email === "string" ? result.claims.email : null,
      },
    };
  }

  if (!result.error || isMissingSessionError(result.error)) {
    return { status: "unauthenticated" };
  }

  const error = normalizeAuthError(result.error);
  if (error.confirmedAuthFailure) {
    return { status: "expired", error };
  }

  return { status: "unavailable", error };
}
