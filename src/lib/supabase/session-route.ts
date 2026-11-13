import type { AuthUserOutcome } from "./auth-state";

/**
 * Pure route decision for the session proxy.
 *
 * Keeping this separate from `updateSession()` lets the missing/expired/
 * transient cases be tested without constructing Next.js requests, responses,
 * or Supabase clients.
 */
export type SessionRouteDecision =
  | { action: "allow"; clearSession: boolean }
  | { action: "redirect-login"; reason: "session_expired" | null; clearSession: true }
  | { action: "redirect-authenticated" }
  | { action: "preserve" };

/** Routes an unauthenticated visitor may open without a session. */
const PUBLIC_SESSION_PATHS = new Set(["/login", "/accept-invitation", "/logindemo"]);

export function decideSessionRoute(
  outcome: AuthUserOutcome,
  pathname: string,
): SessionRouteDecision {
  const onLoginPage = pathname === "/login";
  const onDemoLoginPage = pathname === "/logindemo";

  if (outcome.status === "authenticated") {
    return onLoginPage || onDemoLoginPage
      ? { action: "redirect-authenticated" }
      : { action: "allow", clearSession: false };
  }

  if (outcome.status === "unauthenticated") {
    if (PUBLIC_SESSION_PATHS.has(pathname)) {
      return { action: "allow", clearSession: true };
    }

    return { action: "redirect-login", reason: null, clearSession: true };
  }

  if (outcome.status === "expired") {
    return { action: "redirect-login", reason: "session_expired", clearSession: true };
  }

  return { action: "preserve" };
}
