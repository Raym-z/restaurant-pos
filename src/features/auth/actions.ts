"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ACTIVE_BRANCH_COOKIE } from "@/features/workspace/constants";

import {
  normalizeLoginEmail,
  normalizeLoginOtp,
  normalizeOtpRequestError,
  normalizeOtpVerifyError,
  requestLoginOtp,
  verifyLoginOtp,
  type LoginOtpRequestState,
  type LoginOtpVerifyState,
} from "./otp";
import { safeNextPath } from "./redirect";

function isAuthCookieName(name: string): boolean {
  return name.startsWith("sb-") && name.includes("-auth-token");
}

async function clearLocalAuthCookies(): Promise<void> {
  const cookieStore = await cookies();

  for (const cookie of cookieStore.getAll()) {
    if (isAuthCookieName(cookie.name) || cookie.name === ACTIVE_BRANCH_COOKIE) {
      cookieStore.delete(cookie.name);
    }
  }
}

async function clearActiveBranchCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_BRANCH_COOKIE);
}

/**
 * Send a one-time login code.
 *
 * `shouldCreateUser: false` is mandatory: staff accounts are only provisioned
 * through the invitation flow, so a login request must never create a user.
 * Supabase does not disclose whether an address belongs to an Auth account, and
 * its unknown/social-only error is mapped to a generic message below.
 */
async function requestLoginCode(email: string): Promise<LoginOtpRequestState> {
  try {
    const supabase = await createSupabaseServerClient();
    return await requestLoginOtp(supabase, email);
  } catch (error) {
    return { status: "error", error: normalizeOtpRequestError(error) };
  }
}

export async function requestLoginCodeAction(
  _previousState: LoginOtpRequestState,
  formData: FormData,
): Promise<LoginOtpRequestState> {
  const email = normalizeLoginEmail(formData.get("email"));

  if (!email) {
    return { status: "error", error: "invalid_email" };
  }

  return requestLoginCode(email);
}

/** Resend entry point for the verification step. The address is re-validated. */
export async function resendLoginCodeAction(email: string): Promise<LoginOtpRequestState> {
  const normalized = normalizeLoginEmail(email);

  if (!normalized) {
    return { status: "error", error: "invalid_email" };
  }

  return requestLoginCode(normalized);
}

/**
 * Verify the code and establish the POS session.
 *
 * Verification runs in a Server Action rather than the browser so the returned
 * session is written through the existing HttpOnly SSR cookie policy. This is
 * the same session handoff used by invitation acceptance.
 */
export async function verifyLoginCodeAction(
  _previousState: LoginOtpVerifyState,
  formData: FormData,
): Promise<LoginOtpVerifyState> {
  const email = normalizeLoginEmail(formData.get("email"));
  const token = normalizeLoginOtp(formData.get("code"));

  if (!email || !token) {
    return { status: "error", error: "invalid_code" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await verifyLoginOtp(supabase, email, token);

    if (!result.ok) {
      return { status: "error", error: result.error };
    }
  } catch (error) {
    return { status: "error", error: normalizeOtpVerifyError(error) };
  }

  // Do not let a newly signed-in staff member inherit the previous user's
  // branch selection from a shared POS device.
  await clearActiveBranchCookie();

  redirect(safeNextPath(formData.get("next")));
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();

  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // A retryable Supabase/network failure must not block local sign-out.
  } finally {
    await clearLocalAuthCookies();
  }

  redirect("/login");
}
