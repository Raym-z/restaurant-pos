import assert from "node:assert/strict";
import { test } from "node:test";

import {
  POS_SERVER_AUTH_COOKIE_OPTIONS,
  POS_SESSION_MAX_AGE_SECONDS,
  applyServerAuthCookiePolicy,
  getAuthCookieOptions,
} from "../cookie-policy";

test("POS session cookie uses a 12-hour sliding idle timeout", () => {
  assert.equal(POS_SESSION_MAX_AGE_SECONDS, 12 * 60 * 60);
  assert.equal(getAuthCookieOptions("development").maxAge, 12 * 60 * 60);
  assert.equal(getAuthCookieOptions("production").maxAge, 12 * 60 * 60);
});

test("secure cookies are enabled only when NODE_ENV is production", () => {
  assert.equal(getAuthCookieOptions("production").secure, true);
  assert.equal(getAuthCookieOptions("development").secure, false);
  assert.equal(getAuthCookieOptions("test").secure, false);
});

test("server auth cookies are HttpOnly with the expected attributes", () => {
  assert.equal(POS_SERVER_AUTH_COOKIE_OPTIONS.httpOnly, true);
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
