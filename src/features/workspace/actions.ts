"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { ACTIVE_BRANCH_COOKIE, ACTIVE_BRANCH_COOKIE_MAX_AGE } from "./constants";
import type { BranchSwitchResult } from "./types";

const branchIdSchema = z.string().uuid();

/**
 * Validates a requested branch against the RLS-protected branch collection
 * before persisting it as a UI preference. RLS remains the authorization
 * boundary; this action only prevents an inaccessible branch from becoming
 * the active context.
 */
export async function setActiveBranchAction(branchId: string): Promise<BranchSwitchResult> {
  const parsed = branchIdSchema.safeParse(branchId);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_BRANCH" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("branches")
    .select("id")
    .eq("id", parsed.data)
    .maybeSingle();

  if (error) {
    return { ok: false, error: "UNAVAILABLE" };
  }

  if (!data) {
    return { ok: false, error: "BRANCH_ACCESS_DENIED" };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BRANCH_COOKIE, parsed.data, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACTIVE_BRANCH_COOKIE_MAX_AGE,
  });

  revalidatePath("/", "layout");
  return { ok: true };
}
