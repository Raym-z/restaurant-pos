"use client";

import { Plus, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";

import { DataTable, type DataTableColumn } from "@/components/data-table/data-table";
import { TablePagination } from "@/components/data-table/table-pagination";
import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { useMockData } from "@/features/shared/mock-data-provider";
import { useWorkspace } from "@/providers/workspace-provider";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useRoleLabel, useStatusLabel } from "@/i18n/use-labels";
import type { StaffInvitation } from "../invitation-contracts";
import type { StaffInvitationActionError } from "../invitation-errors";
import { InvitationsPanel } from "./invitations-panel";
import type { StaffMember, StaffRole, StaffStatus } from "../types";
import { STAFF_ROLES } from "../types";
import { filterStaff, primaryAssignment } from "../selectors";

const PAGE_SIZE = 8;

const STATUS_BADGES: Record<StaffStatus, "success" | "info" | "neutral"> = {
  active: "success",
  invited: "info",
  inactive: "neutral",
};

interface StaffScreenProps {
  invitations: StaffInvitation[];
  invitationsError: StaffInvitationActionError | null;
  showInvitations: boolean;
}

export function StaffScreen({
  invitations,
  invitationsError,
  showInvitations,
}: StaffScreenProps) {
  const { staff } = useMockData();
  const { branches, organization } = useWorkspace();
  const t = useTranslations("staff");
  const tCommon = useTranslations("common");
  const roleLabel = useRoleLabel();
  const statusLabel = useStatusLabel();
  const format = useLocalizedFormat();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<StaffRole | "all">("all");
  const [branchId, setBranchId] = useState<string>("all");
  const [status, setStatus] = useState<StaffStatus | "all">("all");
  const [page, setPage] = useState(1);

  const branchById = useMemo(
    () => new Map(branches.map((branch) => [branch.id, branch])),
    [branches],
  );

  const visibleStaff = filterStaff(staff, { query, role, branchId, status });
  const totalPages = Math.max(1, Math.ceil(visibleStaff.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = visibleStaff.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hasFilters =
    query.trim().length > 0 || role !== "all" || branchId !== "all" || status !== "all";

  function resetPage() {
    setPage(1);
  }

  const columns: Array<DataTableColumn<StaffMember>> = [
    {
      id: "staff",
      header: t("table.member"),
      className: "min-w-[220px]",
      cell: (member) => (
        <div className="flex items-center gap-3">
          <Avatar name={member.fullName} />
          <div className="min-w-0">
            <Link href={`/staff/${member.id}`} className="font-medium text-ink hover:text-brand">
              {member.fullName}
            </Link>
            <p className="truncate text-xs text-ink-subtle">{member.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: "role",
      header: t("table.role"),
      className: "whitespace-nowrap",
      cell: (member) => {
        const assignment = primaryAssignment(member);
        return assignment ? (
          <span className="text-ink">{roleLabel(assignment.role)}</span>
        ) : (
          <span className="text-ink-subtle">{tCommon("unassigned")}</span>
        );
      },
    },
    {
      id: "access",
      header: t("table.access"),
      className: "whitespace-nowrap",
      cell: (member) => {
        const assignment = primaryAssignment(member);
        if (!assignment) {
          return <span className="text-ink-subtle">—</span>;
        }
        return (
          <span className="text-ink-muted">
            {assignment.scope === "organization"
              ? tCommon("organizationWide")
              : (branchById.get(assignment.branchId ?? "")?.name ?? tCommon("unknown"))}
          </span>
        );
      },
    },
    {
      id: "status",
      header: t("table.status"),
      cell: (member) => (
        <Badge variant={STATUS_BADGES[member.status]}>{statusLabel(member.status)}</Badge>
      ),
    },
    {
      id: "last-active",
      header: t("table.lastActive"),
      className: "whitespace-nowrap",
      cell: (member) =>
        member.lastActiveAt ? (
          <span className="text-ink-muted">
            {format.dateTime(member.lastActiveAt, organization.timezone)}
          </span>
        ) : (
          <span className="text-ink-subtle">{tCommon("never")}</span>
        ),
    },
    {
      id: "actions",
      header: <span className="sr-only">{t("table.actions")}</span>,
      align: "right",
      cell: (member) => (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/staff/${member.id}`}>{tCommon("view")}</Link>
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
            <Link href="/staff/new">
              <Plus />
              {t("invite")}
            </Link>
          </Button>
        }
      />

      {showInvitations ? (
        <InvitationsPanel
          invitations={invitations}
          loadError={invitationsError}
        />
      ) : null}

      <Card className="overflow-hidden">
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-center">
          <SearchInput
            label={t("search")}
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              resetPage();
            }}
            wrapperClassName="sm:col-span-2 lg:col-span-1"
          />
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="sr-only">{t("allRoles")}</span>
            <Select
              value={role}
              onChange={(event) => {
                setRole(event.target.value as StaffRole | "all");
                resetPage();
              }}
              className="h-10 w-44"
            >
              <option value="all">{t("allRoles")}</option>
              {STAFF_ROLES.map((value) => (
                <option key={value} value={value}>
                  {roleLabel(value)}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="sr-only">{t("allBranches")}</span>
            <Select
              value={branchId}
              onChange={(event) => {
                setBranchId(event.target.value);
                resetPage();
              }}
              className="h-10 w-40"
            >
              <option value="all">{t("allBranches")}</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="sr-only">{t("allStatuses")}</span>
            <Select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StaffStatus | "all");
                resetPage();
              }}
              className="h-10 w-36"
            >
              <option value="all">{t("allStatuses")}</option>
              <option value="active">{statusLabel("active")}</option>
              <option value="invited">{statusLabel("invited")}</option>
              <option value="inactive">{statusLabel("inactive")}</option>
            </Select>
          </label>
        </div>

        <DataTable
          data={pageRows}
          columns={columns}
          getRowKey={(member) => member.id}
          ariaLabel={t("title")}
          caption={t("title")}
          emptyState={
            hasFilters ? (
              <EmptyState
                bordered={false}
                compact
                icon={Users}
                title={t("empty.filteredTitle")}
                description={t("empty.filteredDescription")}
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setQuery("");
                      setRole("all");
                      setBranchId("all");
                      setStatus("all");
                      resetPage();
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
                icon={Users}
                title={t("empty.title")}
                description={t("empty.description")}
                action={
                  <Button asChild size="sm">
                    <Link href="/staff/new">
                      <Plus />
                      {t("invite")}
                    </Link>
                  </Button>
                }
              />
            )
          }
        />

        {visibleStaff.length > 0 ? (
          <TablePagination
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={visibleStaff.length}
            onPageChange={setPage}
            itemLabel={tCommon("staffMembers")}
          />
        ) : null}
      </Card>
    </PageStack>
  );
}
