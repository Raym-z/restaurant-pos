import { isInvitationToken } from "./invitation-token";

/**
 * URL and hash helpers for the staff invitation acceptance handoff.
 *
 * The raw invitation token travels only in the `invitation` query parameter so
 * it survives the login redirect. Supabase Auth delivers the authenticated
 * session in the URL fragment, which is never sent to the server; the fragment
 * is read in the browser and exchanged for an HttpOnly server session.
 */

export const ACCEPT_INVITATION_PATH = "/accept-invitation";
export const LOGIN_PATH = "/login";

/** Same-origin acceptance URL, or the bare page when the token is invalid. */
export function buildAcceptInvitationHref(token: string | null | undefined): string {
  if (!isInvitationToken(token)) {
    return ACCEPT_INVITATION_PATH;
  }

  return `${ACCEPT_INVITATION_PATH}?invitation=${encodeURIComponent(token)}`;
}

/** Same-origin login URL that returns to the acceptance page after sign-in. */
export function buildInvitationSignInHref(token: string | null | undefined): string {
  if (!isInvitationToken(token)) {
    return LOGIN_PATH;
  }

  return `${LOGIN_PATH}?next=${encodeURIComponent(buildAcceptInvitationHref(token))}`;
}

export type InvitationFragmentResult =
  | { kind: "none" }
  | { kind: "session"; accessToken: string; refreshToken: string }
  | { kind: "error"; code: string | null };

/**
 * Parse the Supabase Auth fragment (`#access_token=...&refresh_token=...`).
 *
 * Returns `none` for a page without a fragment so the acceptance request can
 * still run against an existing server session. A fragment that carries an
 * error, or only part of a session, is reported explicitly rather than ignored.
 */
export function parseInvitationFragment(hash: string | null | undefined): InvitationFragmentResult {
  if (typeof hash !== "string") {
    return { kind: "none" };
  }

  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (raw.trim().length === 0) {
    return { kind: "none" };
  }

  const params = new URLSearchParams(raw);
  const errorCode = params.get("error_code") ?? params.get("error");
  if (errorCode) {
    return { kind: "error", code: errorCode };
  }

  const accessToken = params.get("access_token")?.trim() ?? "";
  const refreshToken = params.get("refresh_token")?.trim() ?? "";

  if (accessToken.length === 0 && refreshToken.length === 0) {
    return { kind: "none" };
  }

  if (accessToken.length === 0 || refreshToken.length === 0) {
    return { kind: "error", code: "invalid_fragment" };
  }

  return { kind: "session", accessToken, refreshToken };
}

/**
 * Localized message keys for the invitation outcomes the recipient can act on.
 * Unknown codes fall back to the backend's safe explanation.
 */
export const INVITATION_ERROR_MESSAGE_KEYS = {
  MISSING_TOKEN: "missingToken",
  INVALID_SESSION_LINK: "invalidSessionLink",
  INVALID_RESPONSE: "invalidResponse",
  INVITATION_NOT_FOUND: "errorNotFound",
  INVITATION_ALREADY_ACCEPTED: "errorAlreadyAccepted",
  INVITATION_REVOKED: "errorRevoked",
  INVITATION_EXPIRED: "errorExpired",
  INVITATION_EMAIL_MISMATCH: "errorEmailMismatch",
  STAFF_ALREADY_MEMBER: "errorAlreadyMember",
  AUTH_REQUIRED: "errorAuthRequired",
  SERVICE_UNAVAILABLE: "errorServiceUnavailable",
} as const;

export type InvitationErrorMessageKey =
  (typeof INVITATION_ERROR_MESSAGE_KEYS)[keyof typeof INVITATION_ERROR_MESSAGE_KEYS];

export function invitationErrorMessageKey(code: string): InvitationErrorMessageKey | null {
  return Object.prototype.hasOwnProperty.call(INVITATION_ERROR_MESSAGE_KEYS, code)
    ? INVITATION_ERROR_MESSAGE_KEYS[code as keyof typeof INVITATION_ERROR_MESSAGE_KEYS]
    : null;
}
