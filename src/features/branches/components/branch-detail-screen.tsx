"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Clock, Pencil, Store, UserRound } from "lucide-react";

import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDateOnly, formatDateTime, formatLocalTime } from "@/features/shared/format";
import { useMockData } from "@/features/shared/mock-data-provider";
import { STAFF_ROLE_LABELS, STAFF_STATUS_LABELS } from "@/features/staff/types";
import type { Weekday } from "../types";
import { BRANCH_STATUS_LABELS, WEEKDAYS } from "../types";

const DAY_LABELS: Record<Weekday, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const STATUS_BADGES = {
  active: "success",
  opening_soon: "warning",
  inactive: "neutral",
} as const;

export function BranchDetailScreen() {
  const params = useParams<{ id: string }>();
  const { branches, staff } = useMockData();
  const branch = branches.find((entry) => entry.id === params.id);
  const manager = staff.find((member) => member.id === branch?.managerId);

  if (!branch) {
    return (
      <PageStack>
        <PageHeader
          title="Branch not found"
          backLink={{ href: "/branches", label: "Back to branches" }}
        />
        <EmptyState
          icon={Store}
          title="This branch could not be found"
          description="It may have been removed, or the link is no longer valid."
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/branches">Back to branches</Link>
            </Button>
          }
        />
      </PageStack>
    );
  }

  const assignedStaff = staff.filter((member) =>
    member.assignments.some(
      (assignment) => assignment.scope === "branch" && assignment.branchId === branch.id,
    ),
  );

  return (
    <PageStack>
      <PageHeader
        eyebrow="Branch"
        title={
          <span className="flex flex-wrap items-center gap-3">
            {branch.name}
            <Badge variant={STATUS_BADGES[branch.status]}>
              {BRANCH_STATUS_LABELS[branch.status]}
            </Badge>
          </span>
        }
        description={`${branch.code} · ${branch.city}, ${branch.region}`}
        backLink={{ href: "/branches", label: "Back to branches" }}
        actions={
          <Button asChild variant="secondary">
            <Link href={`/branches/${branch.id}/edit`}>
              <Pencil />
              Edit branch
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Branch information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    Address
                  </dt>
                  <dd className="mt-1 text-sm text-ink">
                    {branch.addressLine1}
                    {branch.addressLine2 ? (
                      <>
                        <br />
                        {branch.addressLine2}
                      </>
                    ) : null}
                    <br />
                    {branch.city}, {branch.region} {branch.postalCode}
                    <br />
                    {branch.country}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    Contact
                  </dt>
                  <dd className="mt-1 text-sm text-ink">
                    {branch.phone}
                    <br />
                    <a
                      href={`mailto:${branch.email}`}
                      className="text-brand hover:text-brand-strong"
                    >
                      {branch.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    Timezone
                  </dt>
                  <dd className="mt-1 text-sm text-ink">{branch.timezone}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    Opening date
                  </dt>
                  <dd className="mt-1 text-sm text-ink">
                    {formatDateOnly(branch.openingDate, branch.timezone)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    Created
                  </dt>
                  <dd className="mt-1 text-sm text-ink">
                    {formatDateTime(branch.createdAt, branch.timezone)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-4 text-ink-subtle" aria-hidden="true" />
                Business hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-line">
                {WEEKDAYS.map((day) => {
                  const hours = branch.businessHours.find((entry) => entry.day === day);
                  return (
                    <div
                      key={day}
                      className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0"
                    >
                      <dt className="text-ink-muted">{DAY_LABELS[day]}</dt>
                      <dd className="font-medium text-ink">
                        {!hours || hours.isClosed
                          ? "Closed"
                          : `${formatLocalTime(hours.open ?? "")} – ${formatLocalTime(hours.close ?? "")}`}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Branch manager</CardTitle>
            </CardHeader>
            <CardContent>
              {manager ? (
                <div className="flex items-center gap-3">
                  <Avatar name={manager.fullName} size="lg" />
                  <div className="min-w-0">
                    <Link
                      href={`/staff/${manager.id}`}
                      className="font-medium text-ink hover:text-brand"
                    >
                      {manager.fullName}
                    </Link>
                    <p className="truncate text-sm text-ink-muted">{manager.email}</p>
                    <p className="text-xs text-ink-subtle">
                      {STAFF_ROLE_LABELS.manager} · {STAFF_STATUS_LABELS[manager.status]}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-lg bg-surface-subtle p-3 text-sm text-ink-muted">
                  <UserRound className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <p>No manager is assigned. Assign a branch manager from the branch edit form.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assigned staff</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {assignedStaff.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  No staff members are assigned to this branch yet.
                </p>
              ) : (
                assignedStaff.map((member, index) => (
                  <div key={member.id}>
                    {index > 0 ? <Separator className="mb-3" /> : null}
                    <div className="flex items-center gap-3">
                      <Avatar name={member.fullName} />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/staff/${member.id}`}
                          className="block truncate text-sm font-medium text-ink hover:text-brand"
                        >
                          {member.fullName}
                        </Link>
                        <p className="truncate text-xs text-ink-muted">
                          {member.assignments[0]
                            ? STAFF_ROLE_LABELS[member.assignments[0].role]
                            : "No role"}
                        </p>
                      </div>
                      <Badge
                        variant={
                          member.status === "active"
                            ? "success"
                            : member.status === "invited"
                              ? "info"
                              : "neutral"
                        }
                      >
                        {STAFF_STATUS_LABELS[member.status]}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageStack>
  );
}
