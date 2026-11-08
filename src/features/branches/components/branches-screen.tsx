"use client";

import { Plus, Store } from "lucide-react";
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
import { Select } from "@/components/ui/select";
import { useMockData } from "@/features/shared/mock-data-provider";
import { useStatusLabel } from "@/i18n/use-labels";
import type { Branch, BranchStatus } from "../types";
import { filterBranches } from "../selectors";

const STATUS_OPTIONS: Array<BranchStatus | "all"> = ["all", "active", "opening_soon", "inactive"];

const STATUS_BADGES: Record<BranchStatus, "success" | "warning" | "neutral"> = {
  active: "success",
  opening_soon: "warning",
  inactive: "neutral",
};

export function BranchesScreen() {
  const { branches, staff } = useMockData();
  const t = useTranslations("branches");
  const tCommon = useTranslations("common");
  const statusLabel = useStatusLabel();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<BranchStatus | "all">("all");

  const staffById = useMemo(() => new Map(staff.map((member) => [member.id, member])), [staff]);

  const visibleBranches = filterBranches(branches, { query, status });
  const hasFilters = query.trim().length > 0 || status !== "all";

  const columns: Array<DataTableColumn<Branch>> = [
    {
      id: "branch",
      header: t("table.branch"),
      cell: (branch) => (
        <div>
          <Link href={`/branches/${branch.id}`} className="font-medium text-ink hover:text-brand">
            {branch.name}
          </Link>
          <div className="text-xs text-ink-subtle">{branch.code}</div>
        </div>
      ),
    },
    {
      id: "location",
      header: t("table.location"),
      cell: (branch) => (
        <div>
          <div className="text-ink">{branch.city}</div>
          <div className="text-xs text-ink-subtle">
            {branch.region}, {branch.country}
          </div>
        </div>
      ),
    },
    {
      id: "manager",
      header: t("table.manager"),
      cell: (branch) => (
        <span className={branch.managerId ? "text-ink" : "text-ink-subtle"}>
          {branch.managerId
            ? (staffById.get(branch.managerId)?.fullName ?? tCommon("unknown"))
            : tCommon("unassigned")}
        </span>
      ),
    },
    {
      id: "contact",
      header: t("table.contact"),
      cell: (branch) => (
        <div>
          <div className="text-ink">{branch.phone}</div>
          <div className="text-xs text-ink-subtle">{branch.email}</div>
        </div>
      ),
    },
    {
      id: "status",
      header: t("table.status"),
      cell: (branch) => (
        <Badge variant={STATUS_BADGES[branch.status]}>{statusLabel(branch.status)}</Badge>
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
        description={t("description")}
        actions={
          <Button asChild>
            <Link href="/branches/new">
              <Plus />
              {t("new")}
            </Link>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <SearchInput
              label={t("search")}
              placeholder={t("searchPlaceholder")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              wrapperClassName="sm:max-w-sm"
            />
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <span className="whitespace-nowrap">{t("table.status")}</span>
              <Select
                value={status}
                onChange={(event) => setStatus(event.target.value as BranchStatus | "all")}
                className="h-10 w-40"
              >
                {STATUS_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value === "all" ? tCommon("allStatuses") : statusLabel(value)}
                  </option>
                ))}
              </Select>
            </label>
          </div>
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
            hasFilters ? (
              <EmptyState
                bordered={false}
                compact
                icon={Store}
                title={t("empty.filteredTitle")}
                description={t("empty.filteredDescription")}
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setQuery("");
                      setStatus("all");
                    }}
                  >
                    {tCommon("clearFilters")}
                  </Button>
                }
              />
            ) : (
              <EmptyState
                bordered={false}
                compact
                icon={Store}
                title={t("empty.title")}
                description={t("empty.description")}
                action={
                  <Button asChild size="sm">
                    <Link href="/branches/new">
                      <Plus />
                      {t("new")}
                    </Link>
                  </Button>
                }
              />
            )
          }
        />
      </Card>
    </PageStack>
  );
}
