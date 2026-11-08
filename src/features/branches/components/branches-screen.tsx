"use client";

import { Store } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";

import { DataTable, type DataTableColumn } from "@/components/data-table/data-table";
import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import type { WorkspaceBranch } from "@/features/workspace/types";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useStatusLabel } from "@/i18n/use-labels";
import { useWorkspace } from "@/providers/workspace-provider";

const STATUS_BADGES: Record<WorkspaceBranch["status"], "success" | "neutral"> = {
  active: "success",
  inactive: "neutral",
};

export function BranchesScreen() {
  const { branches } = useWorkspace();
  const t = useTranslations("branches");
  const tCommon = useTranslations("common");
  const statusLabel = useStatusLabel();
  const format = useLocalizedFormat();
  const [query, setQuery] = useState("");

  const visibleBranches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return branches;
    }

    return branches.filter((branch) =>
      [branch.name, branch.timezone, branch.address ?? "", branch.phone ?? ""].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [branches, query]);

  const columns: Array<DataTableColumn<WorkspaceBranch>> = [
    {
      id: "branch",
      header: t("table.branch"),
      className: "min-w-[220px]",
      cell: (branch) => (
        <div>
          <Link href={`/branches/${branch.id}`} className="font-medium text-ink hover:text-brand">
            {branch.name}
          </Link>
          <div className="text-xs text-ink-subtle">{branch.timezone}</div>
        </div>
      ),
    },
    {
      id: "address",
      header: t("table.address"),
      className: "min-w-[200px]",
      cell: (branch) => (
        <span className="text-ink-muted">{branch.address ?? tCommon("unassigned")}</span>
      ),
    },
    {
      id: "phone",
      header: t("table.phone"),
      className: "whitespace-nowrap",
      cell: (branch) => <span className="text-ink-muted">{branch.phone ?? "—"}</span>,
    },
    {
      id: "status",
      header: t("table.status"),
      cell: (branch) => (
        <Badge variant={STATUS_BADGES[branch.status]}>{statusLabel(branch.status)}</Badge>
      ),
    },
    {
      id: "created",
      header: t("table.created"),
      className: "whitespace-nowrap",
      cell: (branch) => (
        <span className="text-ink-muted">{format.dateOnly(branch.createdAt, branch.timezone)}</span>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">{t("table.actions")}</span>,
      align: "right",
      cell: (branch) => (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/branches/${branch.id}`}>{tCommon("view")}</Link>
        </Button>
      ),
    },
  ];

  return (
    <PageStack>
      <PageHeader
        title={t("title")}
        description={t("readOnlyDescription")}
        actions={<Badge variant="outline">{t("readOnly")}</Badge>}
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            label={t("search")}
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            wrapperClassName="sm:max-w-sm"
          />
          <p className="text-sm text-ink-muted">
            {t("count", { visible: visibleBranches.length, total: branches.length })}
          </p>
        </div>

        <DataTable
          data={visibleBranches}
          columns={columns}
          getRowKey={(branch) => branch.id}
          ariaLabel={t("title")}
          caption={t("title")}
          emptyState={
            <EmptyState
              bordered={false}
              compact
              icon={Store}
              title={query ? t("empty.filteredTitle") : t("empty.title")}
              description={query ? t("empty.filteredDescription") : t("empty.readOnlyDescription")}
            />
          }
        />
      </Card>
    </PageStack>
  );
}
