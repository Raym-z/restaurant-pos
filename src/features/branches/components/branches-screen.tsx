"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Store } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/data-table/data-table";
import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { useMockData } from "@/features/shared/mock-data-provider";
import type { Branch, BranchStatus } from "../types";
import { BRANCH_STATUS_LABELS } from "../types";
import { filterBranches } from "../selectors";

const STATUS_OPTIONS: Array<BranchStatus | "all"> = ["all", "active", "opening_soon", "inactive"];

const STATUS_BADGES: Record<BranchStatus, "success" | "warning" | "neutral"> = {
  active: "success",
  opening_soon: "warning",
  inactive: "neutral",
};

export function BranchesScreen() {
  const { branches, staff } = useMockData();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<BranchStatus | "all">("all");

  const staffById = useMemo(() => new Map(staff.map((member) => [member.id, member])), [staff]);

  const visibleBranches = filterBranches(branches, { query, status });
  const hasFilters = query.trim().length > 0 || status !== "all";

  const columns: Array<DataTableColumn<Branch>> = [
    {
      id: "branch",
      header: "Branch",
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
      header: "Location",
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
      header: "Manager",
      cell: (branch) => (
        <span className={branch.managerId ? "text-ink" : "text-ink-subtle"}>
          {branch.managerId
            ? (staffById.get(branch.managerId)?.fullName ?? "Unknown")
            : "Unassigned"}
        </span>
      ),
    },
    {
      id: "contact",
      header: "Contact",
      cell: (branch) => (
        <div>
          <div className="text-ink">{branch.phone}</div>
          <div className="text-xs text-ink-subtle">{branch.email}</div>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (branch) => (
        <Badge variant={STATUS_BADGES[branch.status]}>{BRANCH_STATUS_LABELS[branch.status]}</Badge>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (branch) => (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/branches/${branch.id}`}>View</Link>
        </Button>
      ),
    },
  ];

  return (
    <PageStack>
      <PageHeader
        title="Branches"
        description="Manage restaurant locations, operating hours, and branch managers."
        actions={
          <Button asChild>
            <Link href="/branches/new">
              <Plus />
              New branch
            </Link>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <SearchInput
              label="Search branches"
              placeholder="Search by name, code, or city"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              wrapperClassName="sm:max-w-sm"
            />
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <span className="whitespace-nowrap">Status</span>
              <Select
                value={status}
                onChange={(event) => setStatus(event.target.value as BranchStatus | "all")}
                className="h-10 w-40"
              >
                {STATUS_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value === "all" ? "All statuses" : BRANCH_STATUS_LABELS[value]}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <p className="text-sm text-ink-muted">
            {visibleBranches.length} of {branches.length}{" "}
            {branches.length === 1 ? "branch" : "branches"}
          </p>
        </div>

        <DataTable
          data={visibleBranches}
          columns={columns}
          getRowKey={(branch) => branch.id}
          ariaLabel="Branches"
          caption="Restaurant branches"
          emptyState={
            hasFilters ? (
              <EmptyState
                bordered={false}
                compact
                icon={Store}
                title="No branches match these filters"
                description="Try a different search term or clear the status filter."
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setQuery("");
                      setStatus("all");
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                bordered={false}
                compact
                icon={Store}
                title="No branches yet"
                description="Create the first branch to start configuring operations."
                action={
                  <Button asChild size="sm">
                    <Link href="/branches/new">
                      <Plus />
                      New branch
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
