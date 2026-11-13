import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import type { User } from "@supabase/supabase-js";

import type { AuthUserOutcome } from "../../../lib/supabase/auth-state";
import { decideSessionRoute } from "../../../lib/supabase/session-route";
import { DEMO_CREDENTIALS } from "../demo-credentials";
import {
  INITIAL_DEMO_LOGIN_STATE,
  signInWithDemoPassword,
  validateDemoCredentials,
  type DemoLoginClient,
} from "../demo-login";

function fakeClient(overrides: Partial<DemoLoginClient["auth"]> = {}): DemoLoginClient {
  return {
    auth: {
      signInWithPassword: async () => ({
        data: { session: { access_token: "access" } },
        error: null,
      }),
      ...overrides,
    },
  };
}

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

test("the displayed demo credentials are the approved values", () => {
  assert.deepEqual(DEMO_CREDENTIALS, {
    email: "demouser@raymondwillytan.com",
    password: "#DemoUser789$",
  });
});

test("demo credential validation normalizes email and preserves the password", () => {
  assert.deepEqual(validateDemoCredentials("  Demo@Example.COM ", " pass pass "), {
    ok: true,
    email: "demo@example.com",
    password: " pass pass ",
  });

  for (const value of [null, undefined, 42, "", "   ", "not-an-email", "@example.com"]) {
    assert.deepEqual(validateDemoCredentials(value, "secret"), {
      ok: false,
      error: "invalid_email",
    });
  }

  assert.deepEqual(validateDemoCredentials("demo@example.com", ""), {
    ok: false,
    error: "password_required",
  });
  assert.deepEqual(validateDemoCredentials("demo@example.com", null), {
    ok: false,
    error: "password_required",
  });

  assert.deepEqual(INITIAL_DEMO_LOGIN_STATE, { status: "idle", error: null });
});

test("password sign-in uses signInWithPassword and requires an established session", async () => {
  const calls: Array<{ email: string; password: string }> = [];

  const result = await signInWithDemoPassword(
    fakeClient({
      signInWithPassword: async (credentials) => {
        calls.push(credentials);
        return { data: { session: { access_token: "access" } }, error: null };
      },
    }),
    "demo@example.com",
    "secret",
  );

  assert.deepEqual(calls, [{ email: "demo@example.com", password: "secret" }]);
  assert.deepEqual(result, { ok: true });

  const noSession = await signInWithDemoPassword(
    fakeClient({
      signInWithPassword: async () => ({ data: { session: null }, error: null }),
    }),
    "demo@example.com",
    "secret",
  );
  assert.deepEqual(noSession, { ok: false, error: "session_failed" });
});

test("demo sign-in failures map to safe user-facing codes", async () => {
  const cases: Array<[unknown, string]> = [
    [{ status: 400, code: "invalid_credentials" }, "invalid_credentials"],
    [{ status: 400, code: "email_not_confirmed" }, "email_not_confirmed"],
    [{ status: 400, code: "email_provider_disabled" }, "unsupported"],
    [{ name: "AuthRetryableFetchError", message: "fetch failed" }, "unavailable"],
    [{ status: 503 }, "unavailable"],
    [{ status: 422, code: "unexpected" }, "generic"],
  ];

  for (const [error, expected] of cases) {
    const result = await signInWithDemoPassword(
      fakeClient({ signInWithPassword: async () => ({ data: { session: null }, error }) }),
      "demo@example.com",
      "secret",
    );

    assert.deepEqual(result, { ok: false, error: expected });
  }

  const thrown = await signInWithDemoPassword(
    fakeClient({
      signInWithPassword: async () => {
        throw { status: 0 };
      },
    }),
    "demo@example.com",
    "secret",
  );
  assert.deepEqual(thrown, { ok: false, error: "unavailable" });
});

test("the demo route is public while every other route stays protected", () => {
  assert.deepEqual(decideSessionRoute(unauthenticated, "/logindemo"), {
    action: "allow",
    clearSession: true,
  });
  assert.deepEqual(decideSessionRoute(authenticated, "/logindemo"), {
    action: "redirect-authenticated",
  });
  assert.deepEqual(decideSessionRoute(expired, "/logindemo"), {
    action: "redirect-login",
    reason: "session_expired",
    clearSession: true,
  });

  assert.deepEqual(decideSessionRoute(unauthenticated, "/dashboard"), {
    action: "redirect-login",
    reason: null,
    clearSession: true,
  });
  assert.deepEqual(decideSessionRoute(unauthenticated, "/tables/table-1"), {
    action: "redirect-login",
    reason: null,
    clearSession: true,
  });
  assert.deepEqual(decideSessionRoute(unauthenticated, "/accept-invitation"), {
    action: "allow",
    clearSession: true,
  });
  assert.deepEqual(decideSessionRoute(authenticated, "/accept-invitation"), {
    action: "allow",
    clearSession: false,
  });
});

test("the demo page is outside the authenticated layout and redirects signed-in visitors", () => {
  const page = readFileSync(new URL("../../../app/logindemo/page.tsx", import.meta.url), "utf8");

  assert.match(page, /export const dynamic = "force-dynamic"/);
  assert.match(page, /classifyAuthUserResult\(/);
  assert.match(page, /status === "authenticated"/);
  assert.match(page, /redirect\(next\)/);
  assert.match(page, /safeNextPath\(params\.next\)/);
  assert.match(page, /<DemoLoginForm next=\{next\} \/>/);
  assert.match(page, /<DemoCredentialsNote \/>/);
  assert.match(page, /NextIntlClientProvider locale="en"/);
  assert.match(page, /createTranslator\(\{/);
  assert.match(page, /namespace: "auth\.demo"/);

  // The page must not render or import the authenticated application shell.
  assert.doesNotMatch(page, /getWorkspace|WorkspaceProvider|<AppShell/);
});

test("the demo form has email and password fields, a visibility toggle, and pending state", () => {
  const form = readFileSync(new URL("../components/demo-login-form.tsx", import.meta.url), "utf8");

  assert.match(form, /useActionState\(/);
  assert.match(form, /name="email"/);
  assert.match(form, /name="password"/);
  assert.match(form, /autoComplete="email"/);
  assert.match(form, /autoComplete="current-password"/);
  assert.match(form, /type=\{showPassword \? "text" : "password"\}/);
  assert.match(form, /aria-pressed=\{showPassword\}/);
  assert.match(form, /setShowPassword/);
  assert.match(form, /validateDemoCredentials\(/);
  assert.match(form, /isLoading=\{pending\}/);
  assert.match(form, /role="alert"/);

  // The browser form never auto-fills demo credentials or persists tokens.
  assert.equal(form.includes(DEMO_CREDENTIALS.email), false);
  assert.equal(form.includes(DEMO_CREDENTIALS.password), false);
  assert.doesNotMatch(form, /localStorage|sessionStorage|document\.cookie/);
});

test("the sticky note renders the single credential constant and allows copying", () => {
  const note = readFileSync(
    new URL("../components/demo-credentials-note.tsx", import.meta.url),
    "utf8",
  );

  assert.match(note, /import \{ DEMO_CREDENTIALS \} from "\.\.\/demo-credentials"/);
  assert.match(note, /DEMO_CREDENTIALS\.email/);
  assert.match(note, /DEMO_CREDENTIALS\.password/);
  assert.match(note, /select-all/);
  assert.match(note, /navigator\.clipboard\.writeText/);
});

test("the demo action signs in on the server and never treats display values as credentials", () => {
  const action = readFileSync(new URL("../demo-actions.ts", import.meta.url), "utf8");

  assert.match(action, /^"use server";/);
  assert.match(action, /createSupabaseServerClient\(/);
  assert.match(action, /signInWithDemoPassword\(/);
  assert.match(action, /clearActiveBranchCookie\(/);
  assert.match(action, /redirect\(safeNextPath\(formData\.get\("next"\)\)\)/);
  assert.equal(action.includes(DEMO_CREDENTIALS.email), false);
  assert.equal(action.includes(DEMO_CREDENTIALS.password), false);
  assert.doesNotMatch(action, /organization_id|organizationId|role_code|roleCode/);
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

test("all demo login strings are localized in English and Indonesian", () => {
  const dictionaries = ["en", "id"].map((locale) =>
    JSON.parse(
      readFileSync(new URL(`../../../i18n/messages/${locale}.json`, import.meta.url), "utf8"),
    ),
  );

  const paths = [
    ["meta", "loginDemo"],
    ["auth", "demo", "eyebrow"],
    ["auth", "demo", "title"],
    ["auth", "demo", "description"],
    ["auth", "demo", "fields", "email"],
    ["auth", "demo", "fields", "password"],
    ["auth", "demo", "emailPlaceholder"],
    ["auth", "demo", "passwordPlaceholder"],
    ["auth", "demo", "showPassword"],
    ["auth", "demo", "hidePassword"],
    ["auth", "demo", "signIn"],
    ["auth", "demo", "signingIn"],
    ["auth", "demo", "noteEyebrow"],
    ["auth", "demo", "noteTitle"],
    ["auth", "demo", "noteDescription"],
    ["auth", "demo", "noteEmailLabel"],
    ["auth", "demo", "notePasswordLabel"],
    ["auth", "demo", "copy"],
    ["auth", "demo", "copied"],
    ["auth", "demo", "copyFailed"],
    ["auth", "demo", "noteFootnote"],
    ["auth", "demo", "staffOnly"],
    ["auth", "demo", "errors", "invalid_email"],
    ["auth", "demo", "errors", "password_required"],
    ["auth", "demo", "errors", "invalid_credentials"],
    ["auth", "demo", "errors", "email_not_confirmed"],
    ["auth", "demo", "errors", "unsupported"],
    ["auth", "demo", "errors", "unavailable"],
    ["auth", "demo", "errors", "session_failed"],
    ["auth", "demo", "errors", "generic"],
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

  const english = dictionaries[0] as {
    auth: { demo: { title: string; description: string; noteTitle: string } };
  };
  assert.equal(english.auth.demo.title, "Welcome back");
  assert.equal(english.auth.demo.description, "Sign in to access your restaurant workspace.");
  assert.equal(english.auth.demo.noteTitle, "Use this account for demo purposes");
});
