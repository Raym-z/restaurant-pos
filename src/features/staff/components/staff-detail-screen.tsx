"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Mail, Pencil, Phone, ShieldCheck, UserRound } from "lucide-react";

import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateOnly, formatDateTime } from "@/features/shared/format";
import { useMockData } from "@/features/shared/mock-data-provider";
import { STAFF_ROLE_LABELS, STAFF_STATUS_LABELS } from "../types";
import { primaryAssignment } from "../selectors";

export function StaffDetailScreen() {
  const params = useParams<{ id: string }>();
  const { staff, branches, organization, setStaffStatus } = useMockData();
  const [confirmingDeactivate, setConfirmingDeactivate] = useState(false);
  const member = staff.find((entry) => entry.id === params.id);
  const branchById = new Map(branches.map((branch) => [branch.id, branch]));

  if (!member) {
    return (
      <PageStack>
        <PageHeader
          title="Staff member not found"
          backLink={{ href: "/staff", label: "Back to staff" }}
        />
        <EmptyState
          icon={UserRound}
          title="This staff member could not be found"
          description="They may have been removed, or the link is no longer valid."
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/staff">Back to staff</Link>
            </Button>
          }
        />
      </PageStack>
    );
  }

  const assignment = primaryAssignment(member);

  return (
    <PageStack>
      <PageHeader
        eyebrow="Staff"
        title={
          <span className="flex flex-wrap items-center gap-3">
            {member.fullName}
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
          </span>
        }
        description={
          assignment
            ? `${STAFF_ROLE_LABELS[assignment.role]} · ${
                assignment.scope === "organization"
                  ? "Organization-wide"
                  : (branchById.get(assignment.branchId ?? "")?.name ?? "Unassigned branch")
              }`
            : "No role assigned"
        }
        backLink={{ href: "/staff", label: "Back to staff" }}
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href={`/staff/${member.id}/edit`}>
                <Pencil />
                Edit staff
              </Link>
            </Button>
            {member.status === "inactive" ? (
              <Button onClick={() => setStaffStatus(member.id, "active")}>Reactivate</Button>
            ) : (
              <Button variant="secondary" onClick={() => setConfirmingDeactivate(true)}>
                {member.status === "invited" ? "Cancel invitation" : "Deactivate"}
              </Button>
            )}
          </>
        }
      />

      {confirmingDeactivate ? (
        <div
          role="alertdialog"
          aria-label="Confirm status change"
          className="rounded-xl border border-warning/20 bg-warning-soft/50 p-4"
        >
          <p className="text-sm font-medium text-ink">
            Change this staff member&apos;s status to inactive?
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            In this mock workflow, the profile remains in the directory but is marked inactive.
            Backend authorization will govern real access.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => {
                setStaffStatus(member.id, "inactive");
                setConfirmingDeactivate(false);
              }}
            >
              Confirm
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setConfirmingDeactivate(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name={member.fullName} size="lg" />
              <div>
                <p className="text-base font-semibold text-ink">{member.fullName}</p>
                <p className="text-sm text-ink-muted">
                  Member since {formatDateOnly(member.joinedAt, organization.timezone)}
                </p>
              </div>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 size-4 text-ink-subtle" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    Email
                  </dt>
                  <dd className="mt-0.5 text-sm text-ink">
                    <a href={`mailto:${member.email}`} className="hover:text-brand">
                      {member.email}
                    </a>
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 text-ink-subtle" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    Phone
                  </dt>
                  <dd className="mt-0.5 text-sm text-ink">{member.phone}</dd>
                </div>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                  Last active
                </dt>
                <dd className="mt-0.5 text-sm text-ink">
                  {member.lastActiveAt
                    ? formatDateTime(member.lastActiveAt, organization.timezone)
                    : "Has not signed in yet"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                  Invitation sent
                </dt>
                <dd className="mt-0.5 text-sm text-ink">
                  {formatDateOnly(member.joinedAt, organization.timezone)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-ink-subtle" aria-hidden="true" />
              Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {member.assignments.map((assignmentEntry) => (
              <div key={`${assignmentEntry.role}-${assignmentEntry.branchId ?? "org"}`}>
                <p className="text-sm font-medium text-ink">
                  {STAFF_ROLE_LABELS[assignmentEntry.role]}
                </p>
                <p className="text-sm text-ink-muted">
                  {assignmentEntry.scope === "organization"
                    ? "All branches in the organization"
                    : (branchById.get(assignmentEntry.branchId ?? "")?.name ?? "Unknown branch")}
                </p>
              </div>
            ))}
            <div className="rounded-lg bg-surface-subtle p-3 text-[13px] leading-5 text-ink-muted">
              Role changes take effect on the next authorized operation. The backend, not this
              screen, enforces access.
            </div>
          </CardContent>
        </Card>
      </div>
    </PageStack>
  );
}
