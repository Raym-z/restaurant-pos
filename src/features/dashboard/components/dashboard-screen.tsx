"use client";

import { BarChart3, Building2, MapPin, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useRoleLabel } from "@/i18n/use-labels";
import { useWorkspace } from "@/providers/workspace-provider";

export function DashboardScreen() {
  const { organization, user, branches, activeBranch } = useWorkspace();
  const t = useTranslations("dashboard");
  const tReadOnly = useTranslations("dashboard.unavailable");
  const roleLabel = useRoleLabel();
  const format = useLocalizedFormat();

  const summary = [
    {
      id: "organization",
      label: tReadOnly("organization"),
      value: organization.name,
      icon: Building2,
    },
    {
      id: "branches",
      label: tReadOnly("accessibleBranches"),
      value: format.number(branches.length),
      icon: MapPin,
    },
    {
      id: "branch",
      label: tReadOnly("activeBranch"),
      value: activeBranch.name,
      icon: MapPin,
    },
    {
      id: "role",
      label: tReadOnly("primaryRole"),
      value: roleLabel(user.primaryRole),
      icon: ShieldCheck,
    },
  ];

  return (
    <PageStack>
      <PageHeader
        title={t("title")}
        description={`${organization.name} · ${t("openBranches", {
          count: branches.filter((branch) => branch.status === "active").length,
        })}`}
        actions={<Badge variant="outline">{tReadOnly("badge")}</Badge>}
      />

      <section aria-label={tReadOnly("summaryLabel")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.id} className="p-5">
                <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-ink-subtle uppercase">
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </div>
                <p className="mt-2 truncate text-lg font-semibold text-ink">{item.value}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-4 text-ink-subtle" aria-hidden="true" />
            {tReadOnly("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            bordered={false}
            icon={BarChart3}
            title={tReadOnly("emptyTitle")}
            description={tReadOnly("emptyDescription")}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {(tReadOnly.raw("planned") as string[]).map((capability) => (
              <Badge key={capability} variant="neutral">
                {capability}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageStack>
  );
}
