import assert from "node:assert/strict";
import { test } from "node:test";

import type { User } from "@supabase/supabase-js";

import { type AuthUserOutcome } from "../auth-state";
import { decideSessionRoute } from "../session-route";

const user = { id: "user-1", email: "staff@example.com" } as User;

const authenticated: AuthUserOutcome = { status: "authenticated", user };
const unauthenticated: AuthUserOutcome = { status: "unauthenticated" };
const expired: AuthUserOutcome = {
  status: "expired",
  error: {
    code: "AUTH_SESSION_EXPIRED",
    message: "expired",
    confirmedAuthFailure: true,
    transient: false,
  },
};
const unavailable: AuthUserOutcome = {
  status: "unavailable",
  error: {
    code: "AUTH_UNAVAILABLE",
    message: "unavailable",
    confirmedAuthFailure: false,
    transient: true,
  },
};

test("missing session redirects a protected route to login and clears cookies", () => {
  assert.deepEqual(decideSessionRoute(unauthenticated, "/dashboard"), {
    action: "redirect-login",
    reason: null,
    clearSession: true,
  });
});

test("missing session on the login page stays and clears stale cookies", () => {
  assert.deepEqual(decideSessionRoute(unauthenticated, "/login"), {
    action: "allow",
    clearSession: true,
  });
});

test("missing session on the invitation acceptance page stays so the client can establish the invited session", () => {
  assert.deepEqual(decideSessionRoute(unauthenticated, "/accept-invitation"), {
    action: "allow",
    clearSession: true,
  });
});

test("authenticated users on the acceptance page are allowed to accept", () => {
  assert.deepEqual(decideSessionRoute(authenticated, "/accept-invitation"), {
    action: "allow",
    clearSession: false,
  });
});

test("expired session clears cookies and redirects with the expiration reason", () => {
  assert.deepEqual(decideSessionRoute(expired, "/dashboard"), {
    action: "redirect-login",
    reason: "session_expired",
    clearSession: true,
  });
});

test("transient failures preserve the session and do not redirect", () => {
  assert.deepEqual(decideSessionRoute(unavailable, "/dashboard"), {
    action: "preserve",
  });
  assert.deepEqual(decideSessionRoute(unavailable, "/login"), {
    action: "preserve",
  });
});

test("authenticated users pass protected routes and leave the login page", () => {
  assert.deepEqual(decideSessionRoute(authenticated, "/dashboard"), {
    action: "allow",
    clearSession: false,
  });
  assert.deepEqual(decideSessionRoute(authenticated, "/login"), {
    action: "redirect-authenticated",
  });
});
