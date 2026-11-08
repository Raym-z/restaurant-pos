"use client";

import { Mail, Pencil, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMockData } from "@/features/shared/mock-data-provider";
import { useWorkspace } from "@/providers/workspace-provider";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useRoleLabel, useStatusLabel } from "@/i18n/use-labels";
import { primaryAssignment } from "../selectors";

export function StaffDetailScreen() {
  const params = useParams<{ id: string }>();
  const { staff, setStaffStatus } = useMockData();
  const { branches, organization } = useWorkspace();
  const t = useTranslations("staff.detail");
  const tCommon = useTranslations("common");
  const roleLabel = useRoleLabel();
  const statusLabel = useStatusLabel();
  const format = useLocalizedFormat();
  const [confirmingDeactivate, setConfirmingDeactivate] = useState(false);
  const member = staff.find((entry) => entry.id === params.id);
  const branchById = new Map(branches.map((branch) => [branch.id, branch]));

  if (!member) {
    return (
      <PageStack>
        <PageHeader title={t("notFoundTitle")} backLink={{ href: "/staff", label: t("back") }} />
        <EmptyState
          icon={UserRound}
          title={t("notFoundTitle")}
          description={t("notFoundDescription")}
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/staff">{t("backToStaff")}</Link>
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
        eyebrow={t("eyebrow")}
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
              {statusLabel(member.status)}
            </Badge>
          </span>
        }
        description={
          assignment
            ? `${roleLabel(assignment.role)} · ${
                assignment.scope === "organization"
                  ? tCommon("organizationWide")
                  : (branchById.get(assignment.branchId ?? "")?.name ?? t("unknownBranch"))
              }`
            : tCommon("unassigned")
        }
        backLink={{ href: "/staff", label: t("back") }}
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href={`/staff/${member.id}/edit`}>
                <Pencil />
                {t("edit")}
              </Link>
            </Button>
            {member.status === "inactive" ? (
              <Button onClick={() => setStaffStatus(member.id, "active")}>{t("reactivate")}</Button>
            ) : (
              <Button variant="secondary" onClick={() => setConfirmingDeactivate(true)}>
                {member.status === "invited" ? t("cancelInvite") : t("deactivate")}
              </Button>
            )}
          </>
        }
      />

      {confirmingDeactivate ? (
        <div
          role="alertdialog"
          aria-label={t("confirmTitle")}
          className="rounded-xl border border-warning/20 bg-warning-soft/50 p-4"
        >
          <p className="text-sm font-medium text-ink">{t("confirmTitle")}</p>
          <p className="mt-1 text-sm text-ink-muted">{t("confirmDescription")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => {
                setStaffStatus(member.id, "inactive");
                setConfirmingDeactivate(false);
              }}
            >
              {tCommon("confirm")}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setConfirmingDeactivate(false)}>
              {tCommon("cancel")}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{t("profile")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name={member.fullName} size="lg" />
              <div>
                <p className="text-base font-semibold text-ink">{member.fullName}</p>
                <p className="text-sm text-ink-muted">
                  {t("memberSince", {
                    date: format.dateOnly(member.joinedAt, organization.timezone),
                  })}
                </p>
              </div>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 size-4 text-ink-subtle" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    {t("email")}
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
                    {t("phone")}
                  </dt>
                  <dd className="mt-0.5 text-sm text-ink">{member.phone}</dd>
                </div>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                  {t("lastActive")}
                </dt>
                <dd className="mt-0.5 text-sm text-ink">
                  {member.lastActiveAt
                    ? format.dateTime(member.lastActiveAt, organization.timezone)
                    : t("hasNotSignedIn")}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                  {t("invitationSent")}
                </dt>
                <dd className="mt-0.5 text-sm text-ink">
                  {format.dateOnly(member.joinedAt, organization.timezone)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-ink-subtle" aria-hidden="true" />
              {t("access")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {member.assignments.map((assignmentEntry) => (
              <div key={`${assignmentEntry.role}-${assignmentEntry.branchId ?? "org"}`}>
                <p className="text-sm font-medium text-ink">{roleLabel(assignmentEntry.role)}</p>
                <p className="text-sm text-ink-muted">
                  {assignmentEntry.scope === "organization"
                    ? t("allBranches")
                    : (branchById.get(assignmentEntry.branchId ?? "")?.name ?? t("unknownBranch"))}
                </p>
              </div>
            ))}
            <div className="rounded-lg bg-surface-subtle p-3 text-[13px] leading-5 text-ink-muted">
              {t("accessNote")}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageStack>
  );
}
