import { z } from "zod";

import type { StaffRole } from "@/types/roles";
import { BRANCH_SCOPED_ROLES } from "@/types/roles";

export const STAFF_INVITATION_STATUSES = ["pending", "accepted", "revoked", "expired"] as const;

export type StaffInvitationStatus = (typeof STAFF_INVITATION_STATUSES)[number];

export const StaffInvitationStatusSchema = z.enum(STAFF_INVITATION_STATUSES);

export const INVITABLE_ROLES_BY_OWNER = ["admin", "manager", "cashier", "kitchen_staff"] as const;

export const INVITABLE_ROLES_BY_ADMIN = ["manager", "cashier", "kitchen_staff"] as const;

export type InvitableRole =
  (typeof INVITABLE_ROLES_BY_OWNER)[number] | (typeof INVITABLE_ROLES_BY_ADMIN)[number];

export const InvitableRoleSchema = z.enum(["admin", "manager", "cashier", "kitchen_staff"]);

export const RoleScopeSchema = z.enum(["organization", "branch"]);

export const StaffInvitationSchema = z
  .object({
    invitationId: z.string().uuid(),
    email: z.string().email().max(320),
    displayName: z.string().min(1).max(120),
    roleCode: InvitableRoleSchema,
    scope: RoleScopeSchema,
    branchId: z.string().uuid().nullable(),
    status: StaffInvitationStatusSchema,
    expiresAt: z.string().min(1),
    lastSentAt: z.string().nullable(),
    sendCount: z.number().int().min(1),
    invitedByName: z.string().min(1),
    createdAt: z.string().min(1),
    acceptedAt: z.string().nullable(),
    revokedAt: z.string().nullable(),
  })
  .strict();

export type StaffInvitation = z.infer<typeof StaffInvitationSchema>;

export const ListStaffInvitationsResponseSchema = z
  .object({
    invitations: z.array(StaffInvitationSchema),
  })
  .strict();

export const CreateStaffInvitationInputSchema = z
  .object({
    email: z.string().trim().email().max(320),
    displayName: z.string().trim().min(1).max(120),
    role: InvitableRoleSchema,
    scope: RoleScopeSchema,
    branchId: z.string().uuid().nullish(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.role !== "admin" && value.scope !== "branch") {
      ctx.addIssue({
        code: "custom",
        path: ["scope"],
        message: "Manager, Cashier, and Kitchen Staff require branch scope",
      });
    }

    if (value.scope === "branch" && !value.branchId) {
      ctx.addIssue({
        code: "custom",
        path: ["branchId"],
        message: "Branch-scoped invitations require a branch",
      });
    }

    if (value.scope === "organization" && value.branchId != null) {
      ctx.addIssue({
        code: "custom",
        path: ["branchId"],
        message: "Organization-scoped invitations must not include a branch",
      });
    }
  });

export type CreateStaffInvitationInput = z.infer<typeof CreateStaffInvitationInputSchema>;

export const AcceptStaffInvitationResponseSchema = z
  .object({
    staffId: z.string().uuid(),
    organizationId: z.string().uuid(),
    roleCode: InvitableRoleSchema,
    scope: RoleScopeSchema,
    branchId: z.string().uuid().nullable(),
  })
  .strict();

export type AcceptStaffInvitationResponse = z.infer<typeof AcceptStaffInvitationResponseSchema>;

export const RevokeStaffInvitationResponseSchema = z
  .object({
    invitationId: z.string().uuid(),
    status: z.enum(["revoked", "already_revoked"]),
  })
  .strict();

/**
 * Roles the current actor may invite. Only organization-scoped Owner/Admin may
 * invite. Owner may invite Admin; Admin may not.
 */
export function invitableRolesFor(
  roles: readonly { role: StaffRole; scope: "organization" | "branch" }[],
): InvitableRole[] {
  const isOwner = roles.some(
    (assignment) => assignment.role === "owner" && assignment.scope === "organization",
  );
  const isAdmin = roles.some(
    (assignment) =>
      (assignment.role === "owner" || assignment.role === "admin") &&
      assignment.scope === "organization",
  );

  if (isOwner) {
    return [...INVITABLE_ROLES_BY_OWNER];
  }

  if (isAdmin) {
    return [...INVITABLE_ROLES_BY_ADMIN];
  }

  return [];
}

export function requiresBranchScope(role: InvitableRole): boolean {
  return (BRANCH_SCOPED_ROLES as readonly string[]).includes(role);
}
