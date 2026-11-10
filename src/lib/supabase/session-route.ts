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

export function decideSessionRoute(
  outcome: AuthUserOutcome,
  pathname: string,
): SessionRouteDecision {
  const onLoginPage = pathname === "/login";
  const onAcceptInvitationPage = pathname === "/accept-invitation";

  if (outcome.status === "authenticated") {
    return onLoginPage
      ? { action: "redirect-authenticated" }
      : { action: "allow", clearSession: false };
  }

  if (outcome.status === "unauthenticated") {
    if (onLoginPage || onAcceptInvitationPage) {
      return { action: "allow", clearSession: true };
    }

    return { action: "redirect-login", reason: null, clearSession: true };
  }

  if (outcome.status === "expired") {
    return { action: "redirect-login", reason: "session_expired", clearSession: true };
  }

  return { action: "preserve" };
}
