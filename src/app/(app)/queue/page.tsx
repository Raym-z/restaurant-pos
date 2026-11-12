import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader, PageStack } from "@/components/layout/page";
import { UnauthorizedState } from "@/components/states/unauthorized-state";
import { Button } from "@/components/ui/button";

import { canViewQueue } from "@/features/queue/access";
import { QueueLoadError } from "@/features/queue/components/queue-load-error";
import { QueueScreen } from "@/features/queue/components/queue-screen";
import { QUEUE_PAGE_SIZE } from "@/features/queue/contracts";
import { getQueueViewer, loadQueue } from "@/features/queue/services";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("queue") };
}

export default async function QueuePage() {
  const viewerResult = await getQueueViewer();
  if (viewerResult.status === "unauthenticated") {
    redirect("/login");
  }

  const t = await getTranslations("queue");

  if (viewerResult.status === "unavailable") {
    return <QueueLoadError error={viewerResult.error} retryHref="/queue" />;
  }

  const { viewer } = viewerResult;
  if (!canViewQueue(viewer.roles)) {
    return (
      <PageStack>
        <PageHeader title={t("title")} description={t("unauthorizedDescription")} />
        <UnauthorizedState
          title={t("unauthorizedTitle")}
          description={t("unauthorizedDescription")}
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard">{t("backToDashboard")}</Link>
            </Button>
          }
        />
      </PageStack>
    );
  }

  const result = await loadQueue({
    branchId: viewer.branchId,
    page: 1,
    limit: QUEUE_PAGE_SIZE,
  });

  if (!result.ok) {
    return <QueueLoadError error={result.error} retryHref="/queue" />;
  }

  return <QueueScreen key={viewer.branchId} initialData={result.data} viewer={viewer} />;
}
