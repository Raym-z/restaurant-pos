import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { PageStack } from "@/components/layout/page";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";

import type { QueueActionError } from "../types";

export async function QueueLoadError({
  error,
  retryHref,
  backHref = "/dashboard",
}: {
  error: QueueActionError;
  retryHref: string;
  backHref?: string;
}) {
  const t = await getTranslations("queue");
  const tErrors = await getTranslations("queue.errors");
  const tStates = await getTranslations("states");
  const description = tErrors.has(error.code) ? tErrors(error.code) : error.message;

  return (
    <PageStack>
      <ErrorState
        title={t("loadErrorTitle")}
        description={description}
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button asChild size="sm">
              <Link href={retryHref}>{tStates("retry")}</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href={backHref}>{t("backToDashboard")}</Link>
            </Button>
          </div>
        }
      />
    </PageStack>
  );
}
