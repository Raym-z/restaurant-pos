import type { User } from "@supabase/supabase-js";

import { isMissingSessionError, normalizeAuthError, type NormalizedError } from "./errors";

export type AuthUserOutcome =
  | { status: "authenticated"; user: User }
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
