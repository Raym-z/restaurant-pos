import assert from "node:assert/strict";
import { test } from "node:test";

import type { User } from "@supabase/supabase-js";

import { classifyAuthUserResult } from "../auth-state";
import { isMissingSessionError, normalizeAuthError } from "../errors";

const user = { id: "user-1", email: "staff@example.com" } as User;

test("an authenticated user is classified as authenticated", () => {
  const outcome = classifyAuthUserResult({ user, error: null });
  assert.equal(outcome.status, "authenticated");
});

test("null user with no error is unauthenticated", () => {
  const outcome = classifyAuthUserResult({ user: null, error: null });
  assert.equal(outcome.status, "unauthenticated");
});

test("AuthSessionMissingError and session_missing are unauthenticated", () => {
  assert.equal(
    classifyAuthUserResult({
      user: null,
      error: { name: "AuthSessionMissingError", message: "Auth session missing!" },
    }).status,
    "unauthenticated",
  );

  assert.equal(
    classifyAuthUserResult({
      user: null,
      error: { code: "session_missing", message: "No session" },
    }).status,
    "unauthenticated",
  );

  assert.equal(isMissingSessionError({ name: "AuthSessionMissingError" }), true);
  assert.equal(isMissingSessionError({ code: "session_missing" }), true);
  assert.equal(isMissingSessionError({ status: 503 }), false);
});

test("missing sessions normalize as non-transient unauthenticated state", () => {
  const normalized = normalizeAuthError({ name: "AuthSessionMissingError" });
  assert.equal(normalized.code, "AUTH_SESSION_MISSING");
  assert.equal(normalized.transient, false);
  assert.equal(normalized.confirmedAuthFailure, false);
});

test("genuine transient errors remain unavailable and preserve the session", () => {
  assert.equal(
    classifyAuthUserResult({ user: null, error: { status: 503 } }).status,
    "unavailable",
  );
  assert.equal(
    classifyAuthUserResult({
      user: null,
      error: { name: "AuthRetryableFetchError", message: "fetch failed" },
    }).status,
    "unavailable",
  );
});

test("confirmed expired sessions are classified as expired", () => {
  const outcome = classifyAuthUserResult({ user: null, error: { status: 401 } });
  assert.equal(outcome.status, "expired");
  if (outcome.status === "expired") {
    assert.equal(outcome.error.code, "AUTH_SESSION_EXPIRED");
  }
});
