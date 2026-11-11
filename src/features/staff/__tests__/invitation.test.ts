import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  CreateStaffInvitationInputSchema,
  invitableRolesFor,
  requiresBranchScope,
} from "../invitation-contracts";
import { normalizeStaffInvitationError } from "../invitation-errors";

test("owner may invite every assignable role", () => {
  assert.deepEqual(invitableRolesFor([{ role: "owner", scope: "organization" }]), [
    "admin",
    "manager",
    "cashier",
    "kitchen_staff",
  ]);
});

test("organization admin may not invite another admin", () => {
  assert.deepEqual(invitableRolesFor([{ role: "admin", scope: "organization" }]), [
    "manager",
    "cashier",
    "kitchen_staff",
  ]);
});

test("branch-scoped roles and non-admins cannot invite", () => {
  assert.deepEqual(invitableRolesFor([{ role: "manager", scope: "branch" }]), []);
  assert.deepEqual(invitableRolesFor([{ role: "cashier", scope: "branch" }]), []);
  assert.deepEqual(invitableRolesFor([{ role: "kitchen_staff", scope: "branch" }]), []);
});

test("branch roles require branch scope", () => {
  assert.equal(requiresBranchScope("manager"), true);
  assert.equal(requiresBranchScope("cashier"), true);
  assert.equal(requiresBranchScope("kitchen_staff"), true);
  assert.equal(requiresBranchScope("admin"), false);
});

test("invitation input rejects organization-scoped branch roles", () => {
  const result = CreateStaffInvitationInputSchema.safeParse({
    email: "manager@example.test",
    displayName: "Manager",
    role: "manager",
    scope: "organization",
    branchId: null,
  });
  assert.equal(result.success, false);
});

test("invitation input requires a branch for branch scope", () => {
  const result = CreateStaffInvitationInputSchema.safeParse({
    email: "cashier@example.test",
    displayName: "Cashier",
    role: "cashier",
    scope: "branch",
  });
  assert.equal(result.success, false);
});

test("invitation input accepts organization-scoped admin", () => {
  const result = CreateStaffInvitationInputSchema.safeParse({
    email: "admin@example.test",
    displayName: "Admin",
    role: "admin",
    scope: "organization",
    branchId: null,
  });
  assert.equal(result.success, true);
});

test("normalizes backend invitation error codes", () => {
  assert.deepEqual(
    normalizeStaffInvitationError({
      message: "INVITATION_ALREADY_PENDING",
      details: "A pending invitation already exists for this email",
    }),
    {
      code: "INVITATION_ALREADY_PENDING",
      message: "A pending invitation already exists for this email",
      retryable: false,
    },
  );
});

test("normalizes unique violations and permission failures", () => {
  assert.equal(
    normalizeStaffInvitationError({ code: "23505", details: "duplicate" }).code,
    "INVITATION_ALREADY_PENDING",
  );
  assert.equal(
    normalizeStaffInvitationError({ code: "42501", details: "denied" }).code,
    "PERMISSION_DENIED",
  );
});

test("marks delivery and transient failures as retryable", () => {
  assert.equal(
    normalizeStaffInvitationError({
      message: "INVITATION_DELIVERY_FAILED",
      details: "unavailable",
    }).retryable,
    true,
  );
  assert.equal(normalizeStaffInvitationError({ message: "fetch failed" }).retryable, true);
});

test("invitation and acceptance translation keys exist in both locales", () => {
  const read = (locale: "en" | "id") =>
    JSON.parse(
      readFileSync(new URL(`../../../i18n/messages/${locale}.json`, import.meta.url), "utf8"),
    ) as Record<string, unknown>;

  const paths = [
    ["staff", "invitations", "title"],
    ["staff", "invitations", "expires"],
    ["staff", "invitations", "resend"],
    ["staff", "invitations", "revoke"],
    ["staff", "invitations", "status", "pending"],
    ["staff", "invitations", "status", "accepted"],
    ["staff", "invitations", "status", "revoked"],
    ["staff", "invitations", "status", "expired"],
    ["staff", "form", "noPermissionTitle"],
    ["staff", "form", "successTitle"],
    ["auth", "acceptInvitation", "title"],
    ["auth", "acceptInvitation", "successTitle"],
    ["auth", "acceptInvitation", "finishingSignIn"],
    ["auth", "acceptInvitation", "invalidSessionLink"],
    ["auth", "acceptInvitation", "errorNotFound"],
    ["auth", "acceptInvitation", "errorAlreadyAccepted"],
    ["auth", "acceptInvitation", "errorRevoked"],
    ["auth", "acceptInvitation", "errorExpired"],
    ["auth", "acceptInvitation", "errorEmailMismatch"],
    ["auth", "acceptInvitation", "errorAlreadyMember"],
    ["auth", "acceptInvitation", "errorAuthRequired"],
    ["auth", "acceptInvitation", "errorServiceUnavailable"],
    ["auth", "acceptInvitation", "retry"],
    ["auth", "acceptInvitation", "signedInAs"],
    ["status", "revoked"],
    ["status", "expired"],
  ] as const;

  for (const locale of ["en", "id"] as const) {
    const messages = read(locale);
    for (const path of paths) {
      let value: unknown = messages;
      for (const segment of path) {
        value =
          typeof value === "object" && value !== null
            ? (value as Record<string, unknown>)[segment]
            : undefined;
      }
      assert.equal(typeof value, "string", `${locale}.${path.join(".")} must exist`);
    }
  }
});
