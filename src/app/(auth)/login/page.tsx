import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/components/login-form";
import { safeNextPath } from "@/features/auth/redirect";
import { classifyAuthUserResult } from "@/lib/supabase/auth-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("login") };
}

interface LoginPageProps {
  searchParams: Promise<{ next?: string; reason?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const sessionExpired = params.reason === "session_expired";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  const outcome = classifyAuthUserResult({ user, error });

  if (outcome.status === "authenticated") {
    redirect(next);
  }

  return <LoginForm next={next} sessionExpired={sessionExpired} />;
}
