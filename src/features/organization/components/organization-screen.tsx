"use client";

import { Building2, Info } from "lucide-react";
import { useTranslations } from "next-intl";

import { PageHeader, PageStack } from "@/components/layout/page";
import { UnauthorizedState } from "@/components/states/unauthorized-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useStatusLabel } from "@/i18n/use-labels";
import { useWorkspace } from "@/providers/workspace-provider";

export function OrganizationScreen() {
  const { organization, isOrgAdmin } = useWorkspace();
  const t = useTranslations("organization.readOnly");
  const tStates = useTranslations("states");
  const statusLabel = useStatusLabel();
  const format = useLocalizedFormat();

  if (!isOrgAdmin) {
    return (
      <PageStack>
        <PageHeader
          title={tStates("accessRestricted")}
          description={tStates("accessRestrictedDescription")}
        />
        <UnauthorizedState description={tStates("unauthorizedDescription")} />
      </PageStack>
    );
  }

  const statusVariant =
    organization.status === "active"
      ? "success"
      : organization.status === "suspended"
        ? "warning"
        : "neutral";

  return (
    <PageStack>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={organization.name}
        description={t("description")}
        actions={<Badge variant={statusVariant}>{statusLabel(organization.status)}</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4 text-ink-subtle" aria-hidden="true" />
              {t("title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                  {t("fields.name")}
                </dt>
                <dd className="mt-1 text-sm text-ink">{organization.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                  {t("fields.currency")}
                </dt>
                <dd className="mt-1 text-sm text-ink">{organization.defaultCurrencyCode}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                  {t("fields.status")}
                </dt>
                <dd className="mt-1 text-sm text-ink">{statusLabel(organization.status)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                  {t("fields.createdAt")}
                </dt>
                <dd className="mt-1 text-sm text-ink">
                  {format.dateOnly(organization.createdAt, organization.timezone)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                  {t("fields.updatedAt")}
                </dt>
                <dd className="mt-1 text-sm text-ink">
                  {format.dateTime(organization.updatedAt, organization.timezone)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("identifiers")}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl>
                <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                  {t("fields.organizationId")}
                </dt>
                <dd className="mt-1 font-mono text-xs break-all text-ink-muted">
                  {organization.id}
                </dd>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-3 pt-6">
              <Info className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-ink">{t("noticeTitle")}</p>
                <p className="mt-1 text-[13px] leading-5 text-ink-muted">{t("notice")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageStack>
  );
}
