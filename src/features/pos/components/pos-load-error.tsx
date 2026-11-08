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
}: {
  error: PosActionError;
  backHref: string;
  backLabel: string;
}) {
  const t = await getTranslations("pos");
  const tErrors = await getTranslations("pos.errors");
  const description = tErrors.has(error.code) ? tErrors(error.code) : error.message;

  return (
    <PageStack>
      <ErrorState
        title={t("loadErrorTitle")}
        description={description}
        action={
          <Button asChild variant="secondary" size="sm">
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        }
      />
    </PageStack>
  );
}
