import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { Metadata } from "next";

import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("states");
  return { title: t("notFoundTitle") };
}

export default async function NotFound() {
  const t = await getTranslations("states");

  return (
    <main
      id="main-content"
      className="flex min-h-svh items-center justify-center bg-canvas px-6 py-16"
    >
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center">
          <Brand subtitle={t("notFoundBrandSubtitle")} />
        </div>
        <p className="mt-12 text-xs font-semibold tracking-[0.18em] text-brand uppercase">
          {t("notFoundEyebrow")}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
          {t("notFoundTitle")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">{t("notFoundDescription")}</p>
        <div className="mt-7 flex justify-center">
          <Button asChild>
            <Link href="/dashboard">
              <ArrowLeft />
              {t("backToDashboard")}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
