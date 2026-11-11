"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { classifyAuthUserResult } from "@/lib/supabase/auth-state";

import { acceptStaffInvitation } from "./accept-invitation";
import type { StaffInvitationActionError } from "./invitation-errors";
import { isInvitationToken } from "./invitation-token";

/**
 * Server-side invitation acceptance.
 *
 * POS session cookies are HttpOnly, so the browser cannot read the session that
 * authorizes `accept_staff_invitation`. Acceptance therefore runs on the server
 * and the RPC receives the authenticated identity from the request cookies.
 */
export type AcceptInvitationOutcome =
  | { kind: "accepted"; organizationId: string; roleCode: string }
  | { kind: "sign_in" }
  | {
      kind: "error";
      error: StaffInvitationActionError;
      authenticated: boolean;
      email: string | null;
    };

const incompleteLink: StaffInvitationActionError = {
  code: "INVITATION_NOT_FOUND",
  message: "This acceptance link is incomplete.",
  retryable: false,
};

export async function acceptInvitationAction(token: string): Promise<AcceptInvitationOutcome> {
  if (!isInvitationToken(token)) {
    return { kind: "error", error: incompleteLink, authenticated: false, email: null };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  const outcome = classifyAuthUserResult({ user, error });

  if (outcome.status === "unauthenticated" || outcome.status === "expired") {
    return { kind: "sign_in" };
  }

  if (outcome.status !== "authenticated") {
    return {
      kind: "error",
      authenticated: false,
      email: null,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "The invitation service is temporarily unavailable. Please try again.",
        retryable: true,
      },
    };
  }

  const result = await acceptStaffInvitation(
    (functionName, args) => supabase.rpc(functionName, args),
    token,
  );

  if (!result.ok) {
    return {
      kind: "error",
      error: result.error,
      authenticated: true,
      email: outcome.user.email ?? null,
    };
  }

  return {
    kind: "accepted",
    organizationId: result.organizationId,
    roleCode: result.roleCode,
  };
}

export type EstablishInvitationSessionOutcome = { ok: true } | { ok: false };

const MAX_SESSION_TOKEN_LENGTH = 16_384;

/**
 * Exchange the Supabase invite/magic-link fragment for an HttpOnly POS session.
 *
 * The browser posts the short-lived tokens it received in the URL fragment. The
 * server stores them through the normal POS cookie policy, so no auth token is
 * written to browser storage by this feature.
 */
export async function establishInvitationSessionAction(input: {
  accessToken: string;
  refreshToken: string;
}): Promise<EstablishInvitationSessionOutcome> {
  const accessToken = typeof input?.accessToken === "string" ? input.accessToken.trim() : "";
  const refreshToken = typeof input?.refreshToken === "string" ? input.refreshToken.trim() : "";

  if (
    accessToken.length === 0 ||
    refreshToken.length === 0 ||
    accessToken.length > MAX_SESSION_TOKEN_LENGTH ||
    refreshToken.length > MAX_SESSION_TOKEN_LENGTH
  ) {
    return { ok: false };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    return { ok: false };
  }

  return { ok: true };
}
