import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { Metadata } from "next";

import { PageHeader, PageStack } from "@/components/layout/page";
import { UnauthorizedState } from "@/components/states/unauthorized-state";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("accessRestricted") };
}

export default async function UnauthorizedPage() {
  const t = await getTranslations("states");

  return (
    <PageStack>
      <PageHeader title={t("accessRestricted")} description={t("accessRestrictedDescription")} />
      <UnauthorizedState
        action={
          <Button asChild variant="secondary">
            <Link href="/dashboard">
              <ArrowLeft />
              {t("returnToDashboard")}
            </Link>
          </Button>
        }
      />
    </PageStack>
  );
}
