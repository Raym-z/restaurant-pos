import type { Metadata } from "next";
import { NextIntlClientProvider, createTranslator } from "next-intl";
import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { Brand } from "@/components/layout/brand";
import { Card } from "@/components/ui/card";
import { DemoCredentialsNote } from "@/features/auth/components/demo-credentials-note";
import { DemoLoginForm } from "@/features/auth/components/demo-login-form";
import { safeNextPath } from "@/features/auth/redirect";
import englishMessages from "@/i18n/messages/en.json";
import { classifyAuthUserResult } from "@/lib/supabase/auth-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslator({
    locale: "en",
    messages: englishMessages,
    namespace: "meta",
  });

  return { title: t("loginDemo") };
}

interface DemoLoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

/**
 * Public portfolio demo entry point.
 *
 * `/logindemo` deliberately lives outside the `(app)` route group so it never
 * inherits the authenticated shell. The proxy allows unauthenticated visitors
 * here, and an authenticated visitor is sent into the normal workspace.
 */
export default async function DemoLoginPage({ searchParams }: DemoLoginPageProps) {
  const params = await searchParams;
  const next = safeNextPath(params.next);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (classifyAuthUserResult({ user, error }).status === "authenticated") {
    redirect(next);
  }

  // This portfolio entry point always uses the canonical English copy, while
  // the rest of the application keeps its normal locale resolution.
  const t = createTranslator({
    locale: "en",
    messages: englishMessages,
    namespace: "auth.demo",
  });

  return (
    <NextIntlClientProvider locale="en" messages={englishMessages}>
      <main id="main-content" className="relative isolate min-h-svh overflow-hidden bg-canvas">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-28 -left-28 size-80 rounded-full bg-brand-soft/80 blur-3xl" />
          <div className="absolute -right-28 -bottom-28 size-96 rounded-full bg-warning-soft/90 blur-3xl" />
        </div>

        <div className="mx-auto grid min-h-svh w-full max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 lg:px-8 lg:py-16">
          <section className="mx-auto w-full max-w-md lg:mx-0">
            <Brand />

            <div className="mt-8 space-y-3">
              <p className="text-xs font-semibold tracking-[0.16em] text-brand uppercase">
                {t("eyebrow")}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                {t("title")}
              </h1>
              <p className="text-sm leading-6 text-ink-muted sm:text-base">{t("description")}</p>
            </div>

            <Card className="mt-8 p-6 sm:p-8">
              <DemoLoginForm next={next} />
            </Card>

            <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-ink-subtle">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {t("staffOnly")}
            </p>
          </section>

          <section className="mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
            <DemoCredentialsNote />
          </section>
        </div>
      </main>
    </NextIntlClientProvider>
  );
}
