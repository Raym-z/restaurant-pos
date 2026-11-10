import { AcceptStaffInvitationResponseSchema } from "./invitation-contracts";
import {
  normalizeStaffInvitationError,
  type StaffInvitationActionError,
} from "./invitation-errors";
import { isInvitationToken, sha256Hex } from "./invitation-token";

export const ACCEPT_STAFF_INVITATION_RPC = "accept_staff_invitation" as const;

export interface AcceptStaffInvitationArgs {
  p_token_hash_hex: string;
}

export type AcceptStaffInvitationRpc = (
  functionName: typeof ACCEPT_STAFF_INVITATION_RPC,
  args: AcceptStaffInvitationArgs,
) => PromiseLike<{ data: unknown; error: unknown }>;

export type AcceptStaffInvitationResult =
  | { ok: true; organizationId: string; roleCode: string }
  | { ok: false; error: StaffInvitationActionError };

const invalidResponse = (): AcceptStaffInvitationResult => ({
  ok: false,
  error: {
    code: "INVALID_RESPONSE",
    message: "The invitation was accepted, but the response could not be read.",
    retryable: false,
  },
});

const invalidToken = (): AcceptStaffInvitationResult => ({
  ok: false,
  error: {
    code: "INVITATION_NOT_FOUND",
    message: "This acceptance link is incomplete.",
    retryable: false,
  },
});

/**
 * Hash the raw invitation token and call the authoritative acceptance RPC.
 *
 * The RPC parameter is `p_token_hash_hex`; the raw token is deliberately never
 * passed to the database client.
 */
export async function acceptStaffInvitation(
  callRpc: AcceptStaffInvitationRpc,
  rawToken: string | null | undefined,
): Promise<AcceptStaffInvitationResult> {
  if (!isInvitationToken(rawToken)) {
    return invalidToken();
  }

  const tokenHash = await sha256Hex(rawToken);

  let response: { data: unknown; error: unknown };
  try {
    response = await callRpc(ACCEPT_STAFF_INVITATION_RPC, {
      p_token_hash_hex: tokenHash,
    });
  } catch (error) {
    return { ok: false, error: normalizeStaffInvitationError(error) };
  }

  if (response.error) {
    return { ok: false, error: normalizeStaffInvitationError(response.error) };
  }

  const parsed = AcceptStaffInvitationResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return invalidResponse();
  }

  return {
    ok: true,
    organizationId: parsed.data.organizationId,
    roleCode: parsed.data.roleCode,
  };
}
