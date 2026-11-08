import assert from "node:assert/strict";
import { test } from "node:test";

import {
  POS_BROWSER_AUTH_COOKIE_OPTIONS,
  POS_SERVER_AUTH_COOKIE_OPTIONS,
  POS_SESSION_MAX_AGE_SECONDS,
  applyServerAuthCookiePolicy,
  getAuthCookieOptions,
} from "../cookie-policy";

test("POS session lifetime is a deliberate 12 hours", () => {
  assert.equal(POS_SESSION_MAX_AGE_SECONDS, 12 * 60 * 60);
  assert.equal(getAuthCookieOptions("development").maxAge, 12 * 60 * 60);
  assert.equal(getAuthCookieOptions("production").maxAge, 12 * 60 * 60);
});

test("secure cookies are enabled only for production HTTPS", () => {
  assert.equal(getAuthCookieOptions("production").secure, true);
  assert.equal(getAuthCookieOptions("development").secure, false);
  assert.equal(getAuthCookieOptions("test").secure, false);
});

test("server auth cookies are HttpOnly and browser options are not", () => {
  assert.equal(POS_SERVER_AUTH_COOKIE_OPTIONS.httpOnly, true);
  assert.equal("httpOnly" in POS_BROWSER_AUTH_COOKIE_OPTIONS, false);
  assert.equal(POS_SERVER_AUTH_COOKIE_OPTIONS.sameSite, "lax");
  assert.equal(POS_SERVER_AUTH_COOKIE_OPTIONS.path, "/");
});

test("the policy overrides Supabase's default lifetime but preserves removals", () => {
  const setCookie = applyServerAuthCookiePolicy({ maxAge: 400 * 24 * 60 * 60 });
  assert.equal(setCookie.maxAge, POS_SESSION_MAX_AGE_SECONDS);
  assert.equal(setCookie.httpOnly, true);
  assert.equal(setCookie.secure, POS_SERVER_AUTH_COOKIE_OPTIONS.secure);

  const removal = applyServerAuthCookiePolicy({ maxAge: 0 });
  assert.equal(removal.maxAge, 0);
  assert.equal(removal.httpOnly, true);
});
