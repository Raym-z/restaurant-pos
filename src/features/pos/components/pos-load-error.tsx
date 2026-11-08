import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { PageStack } from "@/components/layout/page";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";

import type { PosActionError } from "../types";

export async function PosLoadError({
  error,
  backHref,
  backLabel,
  retryHref,
}: {
  error: PosActionError;
  backHref: string;
  backLabel: string;
  retryHref?: string;
}) {
  const t = await getTranslations("pos");
  const tErrors = await getTranslations("pos.errors");
  const tStates = await getTranslations("states");
  const description = tErrors.has(error.code) ? tErrors(error.code) : error.message;

  return (
    <PageStack>
      <ErrorState
        title={t("loadErrorTitle")}
        description={description}
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            {retryHref ? (
              <Button asChild size="sm">
                <Link href={retryHref}>{tStates("retry")}</Link>
              </Button>
            ) : null}
            <Button asChild variant="secondary" size="sm">
              <Link href={backHref}>{backLabel}</Link>
            </Button>
          </div>
        }
      />
    </PageStack>
  );
}
