import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { acceptStaffInvitation, type AcceptStaffInvitationArgs } from "../accept-invitation";
import { INVITATION_TOKEN_PATTERN, isInvitationToken, sha256Hex } from "../invitation-token";

const VALID_TOKEN = "a".repeat(43);
const ORGANIZATION_ID = "11111111-1111-4111-8111-111111111111";

test("sha256Hex returns the standard lowercase SHA-256 digest", async () => {
  assert.equal(
    await sha256Hex("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  assert.match(await sha256Hex(VALID_TOKEN), /^[0-9a-f]{64}$/);
});

test("sha256Hex matches Node's SHA-256 implementation for an invitation token", async () => {
  const expected = createHash("sha256").update(VALID_TOKEN).digest("hex");

  assert.equal(await sha256Hex(VALID_TOKEN), expected);
});

test("invitation token validation accepts exactly 43 base64url characters", () => {
  assert.equal(INVITATION_TOKEN_PATTERN.test(VALID_TOKEN), true);
  assert.equal(isInvitationToken(VALID_TOKEN), true);
  assert.equal(isInvitationToken(`${VALID_TOKEN}_`), false);
  assert.equal(isInvitationToken("a".repeat(42)), false);
  assert.equal(isInvitationToken(""), false);
  assert.equal(isInvitationToken(null), false);
  assert.equal(isInvitationToken(undefined), false);
});

test("acceptance calls accept_staff_invitation with a 64-character p_token_hash_hex", async () => {
  const calls: Array<{
    functionName: string;
    args: AcceptStaffInvitationArgs;
  }> = [];
  const expectedHash = createHash("sha256").update(VALID_TOKEN).digest("hex");

  const result = await acceptStaffInvitation(async (functionName, args) => {
    calls.push({ functionName, args });
    return {
      data: {
        staffId: "22222222-2222-4222-8222-222222222222",
        organizationId: ORGANIZATION_ID,
        roleCode: "manager",
        scope: "branch",
        branchId: "33333333-3333-4333-8333-333333333333",
      },
      error: null,
    };
  }, VALID_TOKEN);

  assert.equal(calls.length, 1);
  const call = calls[0]!;

  assert.equal(call.functionName, "accept_staff_invitation");
  assert.deepEqual(call.args, { p_token_hash_hex: expectedHash });
  assert.equal(/^[0-9a-f]{64}$/.test(call.args.p_token_hash_hex), true);
  assert.equal(Object.keys(call.args).join(","), "p_token_hash_hex");
  assert.equal("p_token" in call.args, false);
  assert.deepEqual(result, {
    ok: true,
    organizationId: ORGANIZATION_ID,
    roleCode: "manager",
  });
});

test("missing or invalid tokens never reach the RPC", async () => {
  for (const value of [null, undefined, "", "short", "a".repeat(42)] as const) {
    const calls: unknown[] = [];
    const result = await acceptStaffInvitation(async (...args) => {
      calls.push(args);
      return { data: null, error: null };
    }, value);

    assert.equal(calls.length, 0);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "INVITATION_NOT_FOUND");
    }
  }
});

test("RPC errors are normalized without exposing the raw token", async () => {
  const result = await acceptStaffInvitation(
    async () => ({
      data: null,
      error: {
        message: "INVITATION_REVOKED",
        details: "This invitation has been revoked",
      },
    }),
    VALID_TOKEN,
  );

  assert.deepEqual(result, {
    ok: false,
    error: {
      code: "INVITATION_REVOKED",
      message: "This invitation has been revoked",
      retryable: false,
    },
  });
});

test("thrown transport failures are reported as retryable", async () => {
  const result = await acceptStaffInvitation(async () => {
    throw { message: "fetch failed" };
  }, VALID_TOKEN);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.code, "SERVICE_UNAVAILABLE");
    assert.equal(result.error.retryable, true);
  }
});

test("an incomplete RPC response is reported as invalid", async () => {
  const result = await acceptStaffInvitation(
    async () => ({ data: { organizationId: ORGANIZATION_ID }, error: null }),
    VALID_TOKEN,
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.code, "INVALID_RESPONSE");
  }
});

test("the acceptance screen delegates to the hash-based helper", () => {
  const screen = readFileSync(
    new URL("../components/accept-invitation-screen.tsx", import.meta.url),
    "utf8",
  );
  const helper = readFileSync(new URL("../accept-invitation.ts", import.meta.url), "utf8");

  assert.match(screen, /acceptStaffInvitation\(/);
  assert.doesNotMatch(screen, /\bp_token\s*:/);
  assert.match(helper, /p_token_hash_hex/);
  assert.match(helper, /sha256Hex/);
});
