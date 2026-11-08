"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeSignInError } from "@/lib/supabase/errors";
import { ACTIVE_BRANCH_COOKIE } from "@/features/workspace/constants";

import { safeNextPath } from "./redirect";

export interface LoginActionState {
  error:
    | "invalid_input"
    | "invalid_credentials"
    | "email_not_confirmed"
    | "unavailable"
    | "generic"
    | null;
}

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

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

export async function signInAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "invalid_input" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: normalizeSignInError(error) };
  }

  const next = safeNextPath(formData.get("next"));
  redirect(next);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();

  try {
    await supabase.auth.signOut({ scope: "local" });
  } finally {
    await clearLocalAuthCookies();
  }

  redirect("/login");
}
