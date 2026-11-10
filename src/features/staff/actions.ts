"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  CreateStaffInvitationInputSchema,
  RevokeStaffInvitationResponseSchema,
  StaffInvitationSchema,
  type CreateStaffInvitationInput,
  type StaffInvitation,
} from "./invitation-contracts";
import {
  normalizeStaffInvitationError,
  type StaffInvitationActionError,
} from "./invitation-errors";

export type StaffInvitationActionResult<T> =
  { ok: true; data: T } | { ok: false; error: StaffInvitationActionError };

const validationFailure = (message: string): StaffInvitationActionResult<never> => ({
  ok: false,
  error: { code: "VALIDATION_ERROR", message, retryable: false },
});

async function extractFunctionError(error: unknown): Promise<unknown> {
  const context = (error as { context?: unknown }).context;

  if (context instanceof Response) {
    try {
      const body = (await context.clone().json()) as {
        error?: unknown;
      };
      if (body.error) {
        return body.error;
      }
    } catch {
      // Fall through to the original error.
    }
  }

  return error;
}

async function invokeStaffInvite(
  body: Record<string, unknown>,
): Promise<StaffInvitationActionResult<StaffInvitation>> {
  const supabase = await createSupabaseServerClient();

  let response: Awaited<ReturnType<typeof supabase.functions.invoke>>;
  try {
    response = await supabase.functions.invoke("staff-invite", { body });
  } catch (error) {
    return { ok: false, error: normalizeStaffInvitationError(error) };
  }

  if (response.error) {
    return {
      ok: false,
      error: normalizeStaffInvitationError(await extractFunctionError(response.error)),
    };
  }

  const envelope = response.data as { success?: boolean; data?: unknown } | null;
  if (!envelope?.success) {
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "The invitation service returned an unexpected response.",
        retryable: false,
      },
    };
  }

  const parsed = StaffInvitationSchema.safeParse(envelope.data);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "INVALID_RESPONSE",
        message:
          "The invitation was created, but the response could not be read. Refresh before retrying.",
        retryable: false,
      },
    };
  }

  revalidatePath("/staff");
  return { ok: true, data: parsed.data };
}

export async function inviteStaffAction(
  input: CreateStaffInvitationInput,
): Promise<StaffInvitationActionResult<StaffInvitation>> {
  const parsed = CreateStaffInvitationInputSchema.safeParse(input);
  if (!parsed.success) {
    return validationFailure("Check the name, email, role, and branch.");
  }

  return invokeStaffInvite({
    action: "invite",
    email: parsed.data.email,
    displayName: parsed.data.displayName,
    role: parsed.data.role,
    scope: parsed.data.scope,
    branchId: parsed.data.branchId ?? null,
  });
}

export async function resendStaffInvitationAction(
  invitationId: string,
): Promise<StaffInvitationActionResult<StaffInvitation>> {
  if (!/^[0-9a-f-]{36}$/i.test(invitationId)) {
    return validationFailure("The invitation identifier is invalid.");
  }

  return invokeStaffInvite({ action: "resend", invitationId });
}

export async function revokeStaffInvitationAction(
  invitationId: string,
  reason = "Revoked from staff administration",
): Promise<StaffInvitationActionResult<{ invitationId: string; status: string }>> {
  if (!/^[0-9a-f-]{36}$/i.test(invitationId)) {
    return validationFailure("The invitation identifier is invalid.");
  }

  const trimmedReason = reason.trim();
  if (trimmedReason.length === 0 || trimmedReason.length > 500) {
    return validationFailure("A revocation reason is required.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("revoke_staff_invitation", {
    p_invitation_id: invitationId,
    p_reason: trimmedReason,
  });

  if (error) {
    return { ok: false, error: normalizeStaffInvitationError(error) };
  }

  const parsed = RevokeStaffInvitationResponseSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "INVALID_RESPONSE",
        message:
          "The invitation was revoked, but the response could not be read. Refresh before retrying.",
        retryable: false,
      },
    };
  }

  revalidatePath("/staff");
  return { ok: true, data: parsed.data };
}
