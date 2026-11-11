import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  INITIAL_LOGIN_OTP_REQUEST_STATE,
  INITIAL_LOGIN_OTP_VERIFY_STATE,
  LOGIN_OTP_LENGTH,
  LOGIN_OTP_REQUEST_OPTIONS,
  LOGIN_OTP_RESEND_COOLDOWN_SECONDS,
  isLoginOtpComplete,
  normalizeLoginEmail,
  normalizeLoginOtp,
  normalizeOtpRequestError,
  normalizeOtpVerifyError,
  requestLoginOtp,
  sanitizeLoginOtpInput,
  verifyLoginOtp,
  type LoginOtpClient,
} from "../otp";

function fakeClient(overrides: Partial<LoginOtpClient["auth"]> = {}): LoginOtpClient {
  return {
    auth: {
      signInWithOtp: async () => ({ error: null }),
      verifyOtp: async () => ({ data: { session: { access_token: "token" } }, error: null }),
      ...overrides,
    },
  };
}

test("passwordless login never creates an Auth user", () => {
  assert.deepEqual(LOGIN_OTP_REQUEST_OPTIONS, { shouldCreateUser: false });
  assert.equal(LOGIN_OTP_REQUEST_OPTIONS.shouldCreateUser, false);
});

test("login email normalization trims, lowercases, and rejects invalid values", () => {
  assert.equal(normalizeLoginEmail("  Manager@Example.COM "), "manager@example.com");
  assert.equal(normalizeLoginEmail("owner@example.com"), "owner@example.com");

  for (const value of [null, undefined, 42, "", "   ", "not-an-email", "@example.com", "a@b"]) {
    assert.equal(normalizeLoginEmail(value), null);
  }

  assert.equal(normalizeLoginEmail(`${"a".repeat(250)}@example.com`), null);
});

test("a login code is exactly six digits", () => {
  assert.equal(normalizeLoginOtp("123456"), "123456");
  assert.equal(normalizeLoginOtp(" 123 456 "), "123456");

  for (const value of [null, undefined, 123456, "12345", "1234567", "abcdef", ""]) {
    assert.equal(normalizeLoginOtp(value), null);
  }

  assert.equal(LOGIN_OTP_LENGTH, 6);
  assert.equal(isLoginOtpComplete("000000"), true);
  assert.equal(isLoginOtpComplete("00000"), false);
});

test("the code field strips non-digits and enforces the six-digit limit", () => {
  assert.equal(sanitizeLoginOtpInput("12a3-45b6"), "123456");
  assert.equal(sanitizeLoginOtpInput("123456789"), "123456");
  assert.equal(sanitizeLoginOtpInput(""), "");
});

test("both login steps start from a clean idle state", () => {
  assert.deepEqual(INITIAL_LOGIN_OTP_REQUEST_STATE, { status: "idle", error: null });
  assert.deepEqual(INITIAL_LOGIN_OTP_VERIFY_STATE, { status: "idle", error: null });
  assert.ok(LOGIN_OTP_RESEND_COOLDOWN_SECONDS > 0);
});

test("OTP send failures map to safe user-facing codes", () => {
  assert.equal(
    normalizeOtpRequestError({ status: 429, code: "over_email_send_rate_limit" }),
    "rate_limited",
  );
  assert.equal(
    normalizeOtpRequestError({ status: 429, message: "email rate limit exceeded" }),
    "rate_limited",
  );
  assert.equal(
    normalizeOtpRequestError({ status: 400, code: "email_address_invalid" }),
    "invalid_email",
  );
  assert.equal(
    normalizeOtpRequestError({ name: "AuthRetryableFetchError", message: "fetch failed" }),
    "unavailable",
  );
  assert.equal(normalizeOtpRequestError({ status: 503 }), "unavailable");
  assert.equal(normalizeOtpRequestError({ status: 422, code: "unexpected" }), "generic");
});

test("OTP verification failures distinguish invalid and expired codes", () => {
  assert.equal(
    normalizeOtpVerifyError({
      status: 403,
      code: "otp_expired",
      message: "Token has expired or is invalid",
    }),
    "invalid_code",
  );
  assert.equal(
    normalizeOtpVerifyError({ code: "otp_expired", message: "Email link is expired" }),
    "expired_code",
  );
  assert.equal(normalizeOtpVerifyError({ code: "invalid_otp" }), "invalid_code");
  assert.equal(normalizeOtpVerifyError({ message: "Token is invalid" }), "invalid_code");
  assert.equal(normalizeOtpVerifyError({ status: 429 }), "rate_limited");
  assert.equal(normalizeOtpVerifyError({ status: 503 }), "unavailable");
  assert.equal(normalizeOtpVerifyError({ status: 422, code: "unexpected" }), "generic");
});

test("requesting a code enforces shouldCreateUser false", async () => {
  const calls: Array<{ email: string; options: { shouldCreateUser: false } }> = [];

  const state = await requestLoginOtp(
    fakeClient({
      signInWithOtp: async (args) => {
        calls.push(args);
        return { error: null };
      },
    }),
    "staff@example.com",
  );

  assert.deepEqual(calls, [
    { email: "staff@example.com", options: { shouldCreateUser: false } },
  ]);
  assert.deepEqual(state, {
    status: "code_sent",
    email: "staff@example.com",
    error: null,
  });
});

test("OTP delivery failures become safe error states", async () => {
  const rateLimited = await requestLoginOtp(
    fakeClient({ signInWithOtp: async () => ({ error: { status: 429 } }) }),
    "staff@example.com",
  );
  assert.deepEqual(rateLimited, { status: "error", error: "rate_limited" });

  const unavailable = await requestLoginOtp(
    fakeClient({
      signInWithOtp: async () => {
        throw { name: "AuthRetryableFetchError", message: "fetch failed" };
      },
    }),
    "staff@example.com",
  );
  assert.deepEqual(unavailable, { status: "error", error: "unavailable" });
});

test("verifying a code uses email OTP and reports an established session", async () => {
  const calls: Array<{ email: string; token: string; type: "email" }> = [];

  const result = await verifyLoginOtp(
    fakeClient({
      verifyOtp: async (args) => {
        calls.push(args);
        return { data: { session: { access_token: "access" } }, error: null };
      },
    }),
    "staff@example.com",
    "123456",
  );

  assert.deepEqual(calls, [{ email: "staff@example.com", token: "123456", type: "email" }]);
  assert.deepEqual(result, { ok: true });
});

test("invalid and expired codes become safe errors", async () => {
  const invalid = await verifyLoginOtp(
    fakeClient({
      verifyOtp: async () => ({
        data: { session: null },
        error: {
          status: 403,
          code: "otp_expired",
          message: "Token has expired or is invalid",
        },
      }),
    }),
    "staff@example.com",
    "000000",
  );
  assert.deepEqual(invalid, { ok: false, error: "invalid_code" });

  const expired = await verifyLoginOtp(
    fakeClient({
      verifyOtp: async () => ({
        data: { session: null },
        error: { code: "otp_expired", message: "Code expired" },
      }),
    }),
    "staff@example.com",
    "000000",
  );
  assert.deepEqual(expired, { ok: false, error: "expired_code" });
});

test("a verification without a session is a handoff failure", async () => {
  const result = await verifyLoginOtp(
    fakeClient({ verifyOtp: async () => ({ data: { session: null }, error: null }) }),
    "staff@example.com",
    "123456",
  );

  assert.deepEqual(result, { ok: false, error: "session_failed" });
});

test("a thrown verification failure never claims a session", async () => {
  const result = await verifyLoginOtp(
    fakeClient({
      verifyOtp: async () => {
        throw { status: 0 };
      },
    }),
    "staff@example.com",
    "123456",
  );

  assert.deepEqual(result, { ok: false, error: "unavailable" });
});

test("login actions send and verify OTP on the server without a password path", () => {
  const actions = readFileSync(new URL("../actions.ts", import.meta.url), "utf8");
  const otp = readFileSync(new URL("../otp.ts", import.meta.url), "utf8");

  assert.match(actions, /requestLoginOtp\(/);
  assert.match(actions, /verifyLoginOtp\(/);
  assert.match(actions, /createSupabaseServerClient\(/);
  assert.match(actions, /clearActiveBranchCookie\(/);
  assert.doesNotMatch(actions, /signInWithPassword/);
  assert.doesNotMatch(actions, /createSupabaseBrowserClient/);

  assert.match(otp, /signInWithOtp\(/);
  assert.match(otp, /verifyOtp\(/);
  assert.match(otp, /type: "email"/);
  assert.match(otp, /shouldCreateUser: false/);
});

test("the login UI has no password field and never stores tokens in browser storage", () => {
  const form = readFileSync(new URL("../components/login-form.tsx", import.meta.url), "utf8");
  const codeForm = readFileSync(
    new URL("../components/login-code-form.tsx", import.meta.url),
    "utf8",
  );
  const ui = `${form}\n${codeForm}`;

  assert.doesNotMatch(ui, /type="password"|name="password"|autoComplete="current-password"/);
  assert.doesNotMatch(ui, /localStorage|sessionStorage|document\.cookie/);
  assert.doesNotMatch(ui, /createSupabaseBrowserClient/);
  assert.match(ui, /requestLoginCodeAction/);
  assert.match(ui, /verifyLoginCodeAction/);
  assert.match(ui, /resendLoginCodeAction/);

  // Duplicate submissions are blocked by the pending state and resend cooldown.
  assert.match(ui, /disabled=\{requestPending\}/);
  assert.match(ui, /disabled=\{pending \|\| !complete\}/);
  assert.match(ui, /LOGIN_OTP_RESEND_COOLDOWN_SECONDS/);
  assert.match(ui, /autoComplete="one-time-code"/);
});

test("the Magic Link template shows the OTP and still preserves invitation links", () => {
  const template = readFileSync(
    new URL("../../../../docs/email-templates/magic-link.html", import.meta.url),
    "utf8",
  );
  const readme = readFileSync(
    new URL("../../../../docs/email-templates/README.md", import.meta.url),
    "utf8",
  );

  assert.match(template, /\{\{ \.Token \}\}/);
  assert.match(template, /\{\{ \.ConfirmationURL \}\}/);
  assert.match(template, /\{\{ \.Email \}\}/);
  assert.match(template, /Your Restaurant POS sign-in code/);
  assert.doesNotMatch(template, /href="\{\{ \.Token \}\}"/);
  assert.doesNotMatch(template, /<script|<img/i);
  assert.doesNotMatch(template, /Sign in to Restaurant POS<\/a>/);

  assert.match(readme, /Your Restaurant POS sign-in code/);
  assert.match(readme, /\{\{ \.Token \}\}/);
});

function hasStringPath(value: unknown, path: readonly string[]): boolean {
  let current: unknown = value;

  for (const segment of path) {
    if (!current || typeof current !== "object") {
      return false;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === "string" && current.length > 0;
}

test("all new login strings are localized in English and Indonesian", () => {
  const dictionaries = ["en", "id"].map((locale) =>
    JSON.parse(
      readFileSync(new URL(`../../../i18n/messages/${locale}.json`, import.meta.url), "utf8"),
    ),
  );

  const paths = [
    ["auth", "login", "eyebrow"],
    ["auth", "login", "title"],
    ["auth", "login", "description"],
    ["auth", "login", "fields", "email"],
    ["auth", "login", "fields", "code"],
    ["auth", "login", "sendCode"],
    ["auth", "login", "sendingCode"],
    ["auth", "login", "verifyDescription"],
    ["auth", "login", "codeHint"],
    ["auth", "login", "verify"],
    ["auth", "login", "verifying"],
    ["auth", "login", "resend"],
    ["auth", "login", "resending"],
    ["auth", "login", "resendIn"],
    ["auth", "login", "changeEmail"],
    ["auth", "login", "codeResent"],
    ["auth", "login", "codeSecurity"],
    ["auth", "login", "sessionExpired"],
    ["auth", "login", "staffOnly"],
    ["auth", "errors", "invalid_email"],
    ["auth", "errors", "rate_limited"],
    ["auth", "errors", "unavailable"],
    ["auth", "errors", "generic"],
    ["auth", "errors", "invalid_code"],
    ["auth", "errors", "expired_code"],
    ["auth", "errors", "session_failed"],
  ];

  for (const [index, dictionary] of dictionaries.entries()) {
    for (const path of paths) {
      assert.equal(
        hasStringPath(dictionary, path),
        true,
        `${index === 0 ? "en" : "id"}: ${path.join(".")}`,
      );
    }
  }
});
