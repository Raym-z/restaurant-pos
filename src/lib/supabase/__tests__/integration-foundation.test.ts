import assert from "node:assert/strict";
import { test } from "node:test";

import { DEVELOPMENT_SUPABASE_REF, PRODUCTION_SUPABASE_REF, parsePublicEnvironment } from "../env";
import {
  isConfirmedAuthFailure,
  normalizeAuthError,
  normalizeDatabaseError,
  normalizeSignInError,
} from "../errors";

test("environment accepts only the development project or a local instance", () => {
  const development = parsePublicEnvironment({
    NEXT_PUBLIC_SUPABASE_URL: `https://${DEVELOPMENT_SUPABASE_REF}.supabase.co`,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  });

  assert.equal(development.supabaseUrl, `https://${DEVELOPMENT_SUPABASE_REF}.supabase.co`);

  const local = parsePublicEnvironment({
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-key",
  });
  assert.equal(local.supabaseUrl, "http://127.0.0.1:54321");
});

test("environment rejects the production project", () => {
  assert.throws(
    () =>
      parsePublicEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: `https://${PRODUCTION_SUPABASE_REF}.supabase.co`,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-key",
      }),
    /production/i,
  );
});

test("environment rejects secret keys and service-role JWTs", () => {
  assert.throws(
    () =>
      parsePublicEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: `https://${DEVELOPMENT_SUPABASE_REF}.supabase.co`,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_development",
      }),
    /secret keys are forbidden/i,
  );

  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url");
  assert.throws(
    () =>
      parsePublicEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: `https://${DEVELOPMENT_SUPABASE_REF}.supabase.co`,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: `${header}.${payload}.signature`,
      }),
    /service-role/i,
  );
});

test("environment rejects unrelated hosted projects and missing keys", () => {
  assert.throws(
    () =>
      parsePublicEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: "https://another-project.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-key",
      }),
    /development Supabase project/i,
  );

  assert.throws(
    () =>
      parsePublicEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: `https://${DEVELOPMENT_SUPABASE_REF}.supabase.co`,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      }),
    /Missing or invalid/i,
  );
});

test("confirmed auth failures are limited to invalid or expired credentials", () => {
  assert.equal(isConfirmedAuthFailure({ status: 401 }), true);
  assert.equal(isConfirmedAuthFailure({ code: "invalid_grant" }), true);
  assert.equal(isConfirmedAuthFailure({ code: "refresh_token_not_found" }), true);

  assert.equal(isConfirmedAuthFailure({ status: 500 }), false);
  assert.equal(isConfirmedAuthFailure({ name: "AuthRetryableFetchError" }), false);
  assert.equal(isConfirmedAuthFailure({ status: 400 }), false);
});

test("transient auth failures preserve the session", () => {
  const network = normalizeAuthError({ name: "AuthRetryableFetchError", message: "fetch failed" });
  assert.equal(network.transient, true);
  assert.equal(network.confirmedAuthFailure, false);
  assert.equal(network.code, "AUTH_UNAVAILABLE");

  const server = normalizeAuthError({ status: 503 });
  assert.equal(server.transient, true);
  assert.equal(server.confirmedAuthFailure, false);
});

test("expired sessions are normalized as confirmed failures", () => {
  const expired = normalizeAuthError({ status: 401, code: "invalid_grant" });
  assert.equal(expired.code, "AUTH_SESSION_EXPIRED");
  assert.equal(expired.confirmedAuthFailure, true);
  assert.equal(expired.transient, false);
});

test("sign-in errors map invalid credentials separately from outages", () => {
  assert.equal(
    normalizeSignInError({ status: 400, code: "invalid_credentials" }),
    "invalid_credentials",
  );
  assert.equal(
    normalizeSignInError({ status: 400, code: "email_not_confirmed" }),
    "email_not_confirmed",
  );
  assert.equal(normalizeSignInError({ status: 400, code: "invalid_grant" }), "invalid_credentials");
  assert.equal(normalizeSignInError({ name: "AuthRetryableFetchError" }), "unavailable");
  assert.equal(normalizeSignInError({ status: 503 }), "unavailable");
  assert.equal(normalizeSignInError({ status: 422, code: "unexpected" }), "generic");
});

test("database errors normalize permission and network failures", () => {
  assert.equal(normalizeDatabaseError({ code: "42501" }).code, "PERMISSION_DENIED");
  assert.equal(normalizeDatabaseError({ status: 503 }).code, "NETWORK_ERROR");
  assert.equal(normalizeDatabaseError({ code: "PGRST116" }).code, "NOT_FOUND");
  assert.equal(normalizeDatabaseError({ code: "XX000" }).code, "INTERNAL_ERROR");
});
