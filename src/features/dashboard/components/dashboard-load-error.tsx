import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { PageStack } from "@/components/layout/page";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";

import type { DashboardActionError } from "../types";

export async function DashboardLoadError({
  error: _error,
  retryHref,
}: {
  error: DashboardActionError;
  retryHref: string;
}) {
  const t = await getTranslations("dashboard");
  const tStates = await getTranslations("states");

  return (
    <PageStack>
      <ErrorState
        title={t("loadErrorTitle")}
        description={t("loadErrorDescription")}
        action={
          <Button asChild size="sm">
            <Link href={retryHref}>{tStates("retry")}</Link>
          </Button>
        }
      />
    </PageStack>
  );
}
