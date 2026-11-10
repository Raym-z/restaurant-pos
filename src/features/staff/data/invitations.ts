import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { ListStaffInvitationsResponseSchema, type StaffInvitation } from "../invitation-contracts";
import {
  normalizeStaffInvitationError,
  type StaffInvitationActionError,
} from "../invitation-errors";

export type StaffInvitationsLoadResult =
  { ok: true; invitations: StaffInvitation[] } | { ok: false; error: StaffInvitationActionError };

export async function loadStaffInvitations(): Promise<StaffInvitationsLoadResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("list_staff_invitations", {
    p_limit: 100,
  });

  if (error) {
    return { ok: false, error: normalizeStaffInvitationError(error) };
  }

  const parsed = ListStaffInvitationsResponseSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "INVALID_RESPONSE",
        message: "Pending invitations could not be read.",
        retryable: false,
      },
    };
  }

  return { ok: true, invitations: parsed.data.invitations };
}
