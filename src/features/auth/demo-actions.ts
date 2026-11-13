"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ACTIVE_BRANCH_COOKIE } from "@/features/workspace/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { signInWithDemoPassword, validateDemoCredentials, type DemoLoginState } from "./demo-login";
import { safeNextPath } from "./redirect";

async function clearActiveBranchCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_BRANCH_COOKIE);
}

/**
 * Establish a staff session from the `/logindemo` form.
 *
 * The action mirrors the OTP login handoff: Supabase writes the session through
 * the existing HttpOnly SSR cookie policy, and the visitor lands on the normal
 * authenticated workspace so organization, branch, and role resolution stay
 * unchanged.
 */
export async function demoSignInAction(
  _previousState: DemoLoginState,
  formData: FormData,
): Promise<DemoLoginState> {
  const validation = validateDemoCredentials(formData.get("email"), formData.get("password"));

  if (!validation.ok) {
    return { status: "error", error: validation.error };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await signInWithDemoPassword(supabase, validation.email, validation.password);

    if (!result.ok) {
      return { status: "error", error: result.error };
    }
  } catch {
    return { status: "error", error: "unavailable" };
  }

  // A demo visitor must not inherit a previous staff member's branch choice on
  // a shared device.
  await clearActiveBranchCookie();

  redirect(safeNextPath(formData.get("next")));
}
