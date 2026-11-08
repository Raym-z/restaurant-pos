"use client";

import { MapPin, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";

import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkspaceBranch } from "@/features/workspace/types";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useStatusLabel } from "@/i18n/use-labels";
import { useWorkspace } from "@/providers/workspace-provider";

const STATUS_BADGES: Record<WorkspaceBranch["status"], "success" | "neutral"> = {
  active: "success",
  inactive: "neutral",
};

export function BranchDetailScreen() {
  const params = useParams<{ id: string }>();
  const { branches } = useWorkspace();
  const t = useTranslations("branches.detail");
  const tReadOnly = useTranslations("branches.readOnlyNotice");
  const statusLabel = useStatusLabel();
  const format = useLocalizedFormat();
  const branch = branches.find((entry) => entry.id === params.id);

  if (!branch) {
    return (
      <PageStack>
        <PageHeader title={t("notFoundTitle")} backLink={{ href: "/branches", label: t("back") }} />
        <EmptyState
          icon={Store}
          title={t("notFoundTitle")}
          description={t("notFoundDescription")}
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/branches">{t("backToBranches")}</Link>
            </Button>
          }
        />
      </PageStack>
    );
  }

  return (
    <PageStack>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {branch.name}
            <Badge variant={STATUS_BADGES[branch.status]}>{statusLabel(branch.status)}</Badge>
          </span>
        }
        description={branch.timezone}
        backLink={{ href: "/branches", label: t("back") }}
        actions={<Badge variant="outline">{tReadOnly("label")}</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("information")}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    {t("address")}
                  </dt>
                  <dd className="mt-1 text-sm text-ink">{branch.address ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    {t("contact")}
                  </dt>
                  <dd className="mt-1 text-sm text-ink">{branch.phone ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    {t("timezone")}
                  </dt>
                  <dd className="mt-1 text-sm text-ink">{branch.timezone}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    {t("created")}
                  </dt>
                  <dd className="mt-1 text-sm text-ink">
                    {format.dateTime(branch.createdAt, branch.timezone)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="size-4 text-ink-subtle" aria-hidden="true" />
                {t("location")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    {t("coordinates")}
                  </dt>
                  <dd className="mt-1 text-sm text-ink">
                    {branch.latitude !== null && branch.longitude !== null
                      ? `${branch.latitude}, ${branch.longitude}`
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    {t("waitlistGeolocation")}
                  </dt>
                  <dd className="mt-1 text-sm text-ink">
                    {branch.waitlistGeolocationEnabled ? t("enabled") : t("disabled")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    {t("waitlistRadius")}
                  </dt>
                  <dd className="mt-1 text-sm text-ink">
                    {branch.waitlistRadiusMeters !== null
                      ? t("radiusMeters", { count: branch.waitlistRadiusMeters })
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    {t("updated")}
                  </dt>
                  <dd className="mt-1 text-sm text-ink">
                    {format.dateTime(branch.updatedAt, branch.timezone)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("readOnlyTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[13px] leading-5 text-ink-muted">{t("readOnlyDescription")}</p>
          </CardContent>
        </Card>
      </div>
    </PageStack>
  );
}
