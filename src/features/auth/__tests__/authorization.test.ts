import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const layout = readFileSync(
  new URL("../../../app/(app)/layout.tsx", import.meta.url),
  "utf8",
);
const loginActions = readFileSync(new URL("../actions.ts", import.meta.url), "utf8");
const invitationActions = readFileSync(
  new URL("../../staff/accept-invitation-actions.ts", import.meta.url),
  "utf8",
);
const invitationScreen = readFileSync(
  new URL("../../staff/components/accept-invitation-screen.tsx", import.meta.url),
  "utf8",
);
const magicLinkTemplate = readFileSync(
  new URL("../../../../docs/email-templates/magic-link.html", import.meta.url),
  "utf8",
);

test("a successful OTP never grants access before the staff workspace is authorized", () => {
  const shellIndex = layout.indexOf("<AppShell>");

  assert.ok(shellIndex > -1, "the authenticated shell must still render staff screens");

  for (const guard of [
    'result.status === "unauthenticated"',
    'result.status === "no_active_staff"',
    'result.status === "no_roles"',
    'result.status === "no_branches"',
    'result.status === "auth_error"',
  ]) {
    const guardIndex = layout.indexOf(guard);
    assert.ok(guardIndex > -1, `missing guard: ${guard}`);
    assert.ok(guardIndex < shellIndex, `guard runs after the shell: ${guard}`);
  }

  assert.match(layout, /redirect\("\/login"\)/);
  assert.match(layout, /redirect\("\/login\?reason=session_expired"\)/);
  assert.match(layout, /<SessionStateScreen variant="no-active-staff" \/>/);
  assert.match(layout, /<SessionStateScreen variant="no-roles" \/>/);
  assert.match(layout, /variant="no-branches"/);
});

test("the login flow never trusts a client-supplied organization or role", () => {
  assert.doesNotMatch(loginActions, /organization_id|organizationId|role_code|roleCode/);
  assert.doesNotMatch(loginActions, /formData\.get\("(?:organization|role)/);

  const formReads = [...loginActions.matchAll(/formData\.get\("([^"]+)"\)/g)].map(
    (match) => match[1],
  );

  assert.deepEqual(formReads.sort(), ["code", "email", "email", "next"]);
});

test("both invitation paths keep their server-side token and session handoff", () => {
  // New-account invitation: email link fragment -> server session -> acceptance RPC.
  assert.match(invitationScreen, /parseInvitationFragment\(/);
  assert.match(invitationScreen, /establishInvitationSessionAction\(/);
  assert.match(invitationActions, /setSession\(/);
  assert.match(invitationActions, /acceptStaffInvitation\(/);

  // Existing-account invitation: the Magic Link template still carries the
  // confirmation link that delivers the invitation token handoff.
  assert.match(magicLinkTemplate, /href="\{\{ \.ConfirmationURL \}\}"/);

  // Login is separate from invitation acceptance.
  assert.doesNotMatch(loginActions, /accept_staff_invitation|acceptStaffInvitation/);
  assert.doesNotMatch(invitationActions, /signInWithOtp|verifyOtp/);
});
