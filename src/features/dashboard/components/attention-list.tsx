"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { useMockData } from "@/features/shared/mock-data-provider";
import { useRoleLabel } from "@/i18n/use-labels";
import type { Branch } from "@/features/branches/types";
import type { AttentionItem } from "../types";
import { localizeMenuItem } from "@/features/menu/selectors";

export function AttentionList({ items, branches }: { items: AttentionItem[]; branches: Branch[] }) {
  const { staff, menuItems } = useMockData();
  const locale = useLocale();
  const t = useTranslations("dashboard.attention");
  const roleLabel = useRoleLabel();
  const branchById = new Map(branches.map((branch) => [branch.id, branch]));
  const staffById = new Map(staff.map((member) => [member.id, member]));

  function renderContent(item: AttentionItem) {
    const branch = item.branchId ? branchById.get(item.branchId) : undefined;
    const branchName = branch?.name ?? "—";

    if (item.kind === "menu-unavailable") {
      const menuItem = item.menuItemId
        ? menuItems.find((entry) => entry.id === item.menuItemId)
        : undefined;
      const itemName = menuItem
        ? localizeMenuItem(menuItem, locale).name
        : t("menuUnavailableTitle", { count: 1 });
      return {
        title: t("menuUnavailableTitle", { count: 1 }),
        description: t("menuUnavailableDescription", {
          item: itemName,
          branch: branchName,
        }),
      };
    }

    if (item.kind === "staff-invites") {
      const invited = (item.staffIds ?? [])
        .map((id) => staffById.get(id))
        .filter((member): member is NonNullable<typeof member> => Boolean(member));
      const [first, second] = invited;
      const firstAssignment = first?.assignments[0];
      const secondAssignment = second?.assignments[0];
      return {
        title: t("staffInvitesTitle", { count: invited.length }),
        description: t("staffInvitesDescription", {
          first: first?.fullName ?? "—",
          firstRole: firstAssignment ? roleLabel(firstAssignment.role) : "—",
          firstBranch: firstAssignment?.branchId
            ? (branchById.get(firstAssignment.branchId)?.name ?? "—")
            : "—",
          second: second?.fullName ?? "—",
          secondRole: secondAssignment ? roleLabel(secondAssignment.role) : "—",
          secondBranch: secondAssignment?.branchId
            ? (branchById.get(secondAssignment.branchId)?.name ?? "—")
            : "—",
        }),
      };
    }

    const manager = item.staffIds?.[0] ? staffById.get(item.staffIds[0]) : undefined;
    return {
      title: t("managerVacancyTitle", { branch: branchName }),
      description: t("managerVacancyDescription", {
        name: manager?.fullName ?? "—",
      }),
    };
  }

  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">{t("title")}</h2>
        <Link href="/staff" className="text-sm font-medium text-brand hover:text-brand-strong">
          {t("staff")}
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">{t("empty")}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => {
            const branch = item.branchId ? branchById.get(item.branchId) : undefined;
            const content = renderContent(item);
            return (
              <li key={item.id} className="rounded-lg border border-line bg-surface-subtle p-3">
                <div className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className={[
                      "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                      item.tone === "warning"
                        ? "bg-warning-soft text-warning"
                        : "bg-info-soft text-info",
                    ].join(" ")}
                  >
                    {item.tone === "warning" ? "!" : "i"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{content.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                      {content.description}
                    </p>
                    {branch ? (
                      <p className="mt-1 text-xs font-medium text-ink-subtle">
                        {branch.name} · {branch.code}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
