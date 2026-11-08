"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";

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
import { formatDateTime } from "@/features/shared/format";
import { useMockData } from "@/features/shared/mock-data-provider";
import type { StaffMember, StaffRole, StaffStatus } from "../types";
import { STAFF_ROLE_LABELS, STAFF_ROLES, STAFF_STATUS_LABELS } from "../types";
import { filterStaff, primaryAssignment } from "../selectors";

const PAGE_SIZE = 8;

const STATUS_BADGES: Record<StaffStatus, "success" | "info" | "neutral"> = {
  active: "success",
  invited: "info",
  inactive: "neutral",
};

export function StaffScreen() {
  const { staff, branches, organization } = useMockData();
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
      header: "Staff member",
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
      header: "Role",
      className: "whitespace-nowrap",
      cell: (member) => {
        const assignment = primaryAssignment(member);
        return assignment ? (
          <span className="text-ink">{STAFF_ROLE_LABELS[assignment.role]}</span>
        ) : (
          <span className="text-ink-subtle">No role</span>
        );
      },
    },
    {
      id: "access",
      header: "Access",
      className: "whitespace-nowrap",
      cell: (member) => {
        const assignment = primaryAssignment(member);
        if (!assignment) {
          return <span className="text-ink-subtle">—</span>;
        }
        return (
          <span className="text-ink-muted">
            {assignment.scope === "organization"
              ? "Organization-wide"
              : (branchById.get(assignment.branchId ?? "")?.name ?? "Unknown branch")}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: (member) => (
        <Badge variant={STATUS_BADGES[member.status]}>{STAFF_STATUS_LABELS[member.status]}</Badge>
      ),
    },
    {
      id: "last-active",
      header: "Last active",
      className: "whitespace-nowrap",
      cell: (member) =>
        member.lastActiveAt ? (
          <span className="text-ink-muted">
            {formatDateTime(member.lastActiveAt, organization.timezone)}
          </span>
        ) : (
          <span className="text-ink-subtle">Never</span>
        ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (member) => (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/staff/${member.id}`}>View</Link>
        </Button>
      ),
    },
  ];

  return (
    <PageStack>
      <PageHeader
        title="Staff"
        description="Manage staff profiles, roles, and branch assignments."
        actions={
          <Button asChild>
            <Link href="/staff/new">
              <Plus />
              Invite staff
            </Link>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-center">
          <SearchInput
            label="Search staff"
            placeholder="Search by name, email, or phone"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              resetPage();
            }}
            wrapperClassName="sm:col-span-2 lg:col-span-1"
          />
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="sr-only">Role filter</span>
            <Select
              value={role}
              onChange={(event) => {
                setRole(event.target.value as StaffRole | "all");
                resetPage();
              }}
              className="h-10 w-44"
            >
              <option value="all">All roles</option>
              {STAFF_ROLES.map((value) => (
                <option key={value} value={value}>
                  {STAFF_ROLE_LABELS[value]}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="sr-only">Branch filter</span>
            <Select
              value={branchId}
              onChange={(event) => {
                setBranchId(event.target.value);
                resetPage();
              }}
              className="h-10 w-40"
            >
              <option value="all">All branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="sr-only">Status filter</span>
            <Select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StaffStatus | "all");
                resetPage();
              }}
              className="h-10 w-36"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="inactive">Inactive</option>
            </Select>
          </label>
        </div>

        <DataTable
          data={pageRows}
          columns={columns}
          getRowKey={(member) => member.id}
          ariaLabel="Staff directory"
          caption="Staff directory"
          emptyState={
            hasFilters ? (
              <EmptyState
                bordered={false}
                compact
                icon={Users}
                title="No staff match these filters"
                description="Try a different search term or reset the role, branch, and status filters."
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
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                bordered={false}
                compact
                icon={Users}
                title="No staff yet"
                description="Invite the first staff member to assign a role and branch access."
                action={
                  <Button asChild size="sm">
                    <Link href="/staff/new">
                      <Plus />
                      Invite staff
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
            itemLabel="staff members"
          />
        ) : null}
      </Card>
    </PageStack>
  );
}
