import assert from "node:assert/strict";
import { test } from "node:test";

import { safeNextPath } from "../../auth/redirect";
import {
  buildAcceptInvitationHref,
  buildInvitationSignInHref,
  invitationErrorMessageKey,
  parseInvitationFragment,
} from "../invitation-auth";

const TOKEN = "abc_DEF-123" + "x".repeat(32);
const ACCEPT_HREF = `/accept-invitation?invitation=${TOKEN}`;

test("acceptance href stays on the local origin and keeps the token", () => {
  assert.equal(buildAcceptInvitationHref(TOKEN), ACCEPT_HREF);
  assert.equal(buildAcceptInvitationHref(null), "/accept-invitation");
  assert.equal(buildAcceptInvitationHref("short"), "/accept-invitation");
  assert.equal(buildAcceptInvitationHref("https://evil.example"), "/accept-invitation");
});

test("sign-in href returns to the acceptance page without losing the token", () => {
  const href = buildInvitationSignInHref(TOKEN);
  assert.equal(href, `/login?next=${encodeURIComponent(ACCEPT_HREF)}`);
  assert.equal(buildInvitationSignInHref(null), "/login");

  const next = new URL(href, "http://internal.local").searchParams.get("next");
  assert.equal(safeNextPath(next), ACCEPT_HREF);
});

test("an implicit session fragment is parsed without extra parameters", () => {
  const result = parseInvitationFragment(
    "#access_token=header.payload.signature&expires_in=3600&refresh_token=refresh_value&token_type=bearer&type=invite",
  );

  assert.deepEqual(result, {
    kind: "session",
    accessToken: "header.payload.signature",
    refreshToken: "refresh_value",
  });
});

test("URL-encoded fragment values are decoded", () => {
  const result = parseInvitationFragment(
    "#access_token=a%2Bb&refresh_token=c%2Fd&token_type=bearer&type=magiclink",
  );

  assert.deepEqual(result, {
    kind: "session",
    accessToken: "a+b",
    refreshToken: "c/d",
  });
});

test("missing, empty, or unrelated fragments are ignored", () => {
  for (const hash of [null, undefined, "", "#", "#type=invite", "#foo=bar"]) {
    assert.deepEqual(parseInvitationFragment(hash), { kind: "none" });
  }
});

test("an error fragment is reported instead of silently accepting", () => {
  assert.deepEqual(
    parseInvitationFragment(
      "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid",
    ),
    { kind: "error", code: "otp_expired" },
  );
});

test("a partial session fragment is reported as invalid", () => {
  assert.deepEqual(parseInvitationFragment("#access_token=only_access"), {
    kind: "error",
    code: "invalid_fragment",
  });
  assert.deepEqual(parseInvitationFragment("#refresh_token=only_refresh"), {
    kind: "error",
    code: "invalid_fragment",
  });
});

test("required invitation outcomes map to localized message keys", () => {
  const expected = new Map([
    ["INVITATION_NOT_FOUND", "errorNotFound"],
    ["INVITATION_ALREADY_ACCEPTED", "errorAlreadyAccepted"],
    ["INVITATION_REVOKED", "errorRevoked"],
    ["INVITATION_EXPIRED", "errorExpired"],
    ["INVITATION_EMAIL_MISMATCH", "errorEmailMismatch"],
    ["STAFF_ALREADY_MEMBER", "errorAlreadyMember"],
    ["AUTH_REQUIRED", "errorAuthRequired"],
    ["SERVICE_UNAVAILABLE", "errorServiceUnavailable"],
    ["INVALID_RESPONSE", "invalidResponse"],
  ]);

  for (const [code, key] of expected) {
    assert.equal(invitationErrorMessageKey(code), key);
  }

  assert.equal(invitationErrorMessageKey("UNKNOWN_CODE"), null);
  assert.equal(invitationErrorMessageKey("toString"), null);
});
