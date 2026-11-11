import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(
  new URL("../../../../scripts/verify-hosted-development.ts", import.meta.url),
  "utf8",
);

test("the hosted verification script has no password-based authentication", () => {
  assert.doesNotMatch(source, /signInWithPassword/);
  assert.doesNotMatch(source, /POS_DEV_STAFF_PASSWORD/);
  assert.doesNotMatch(source, /\bpassword\s*:/i);
});

test("the hosted verification script uses the passwordless email OTP flow", () => {
  assert.match(source, /signInWithOtp\(/);
  assert.match(source, /shouldCreateUser:\s*false/);
  assert.match(source, /verifyOtp\(/);
  assert.match(source, /type:\s*"email"/);
  assert.match(source, /requireCredential\("POS_DEV_STAFF_EMAIL"\)/);
});

test("OTP entry is interactive or environment-supplied, never hardcoded", () => {
  assert.match(source, /process\.env\.POS_DEV_STAFF_OTP/);
  assert.match(source, /readOtpInteractively\(/);
  assert.match(source, /setRawMode\(true\)/);

  // The code is read from the terminal or environment, not embedded in source.
  assert.doesNotMatch(source, /token:\s*["']\d{6}["']/);
  assert.doesNotMatch(source, /(?:otp|code)\s*=\s*["']\d{6}["']/i);
});

test("Development-only safeguards remain enforced", () => {
  assert.match(source, /parsePublicEnvironment\(/);
  assert.match(source, /assertPublishableKey\(/);
  assert.match(source, /bnticbeepxwhrzimouuh\.supabase\.co/);
  assert.match(source, /!environment\.supabaseUrl\.includes\(PRODUCTION_REF\)/);
  assert.match(source, /createClient<Database>\(/);
});

test("the authenticated session is checked against the staff workspace", () => {
  assert.match(source, /sb\.auth\.getUser\(\)/);
  assert.match(source, /loadWorkspaceRows\(/);
  assert.match(source, /Active staff profile loads/);
  assert.match(source, /Organization-scoped role assignments include the Owner/);
  assert.match(source, /At least one active branch is accessible/);
});
