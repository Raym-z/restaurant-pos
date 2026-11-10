"use client";

import { Pencil, TriangleAlert, UtensilsCrossed } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useStatusLabel } from "@/i18n/use-labels";

import { setMenuItemBranchAvailabilityAction } from "../actions";
import type { MenuItemView, MenuStatus } from "../models";
import { useMenuErrorMessage } from "../use-menu-error-message";
import { ArchiveMenuDialog } from "./archive-menu-dialog";
import { MenuReadOnlyNotice } from "./menu-read-only-notice";

const STATUS_BADGES: Record<MenuStatus, "success" | "neutral"> = {
  active: "success",
  archived: "neutral",
};

export function MenuItemDetailScreen({
  item,
  timezone,
  canManage,
}: {
  item: MenuItemView;
  timezone: string;
  canManage: boolean;
}) {
  const t = useTranslations("menuAdmin");
  const statusLabel = useStatusLabel();
  const format = useLocalizedFormat();
  const router = useRouter();
  const errorMessage = useMenuErrorMessage();
  const [pendingBranchId, setPendingBranchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canToggle = item.status === "active" && !item.categoryArchived && !isPending;

  function toggleAvailability(branchId: string, nextAvailable: boolean) {
    setPendingBranchId(branchId);
    setError(null);
    startTransition(async () => {
      const result = await setMenuItemBranchAvailabilityAction(item.id, branchId, nextAvailable);
      setPendingBranchId(null);

      if (!result.ok) {
        setError(errorMessage(result.error));
        if (result.committed) {
          router.refresh();
        }
        return;
      }

      router.refresh();
    });
  }

  return (
    <PageStack>
      <PageHeader
        eyebrow={item.categoryName ?? t("uncategorized")}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {item.name}
            <Badge variant={STATUS_BADGES[item.status]}>{statusLabel(item.status)}</Badge>
          </span>
        }
        description={item.description || t("item.noDescription")}
        backLink={{ href: "/menu", label: t("item.back") }}
        actions={
          canManage && item.status === "active" ? (
            <>
              <Button asChild variant="secondary">
                <Link href={`/menu/items/${item.id}/edit`}>
                  <Pencil />
                  {t("item.edit")}
                </Link>
              </Button>
              <ArchiveMenuDialog kind="item" id={item.id} name={item.name} redirectTo="/menu" />
            </>
          ) : undefined
        }
      />

      {!canManage ? <MenuReadOnlyNotice /> : null}

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft/50 px-4 py-3 text-sm text-danger"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      ) : null}

      {item.status === "archived" ? (
        <div className="rounded-lg border border-line bg-surface-subtle px-4 py-3 text-sm">
          <p className="font-medium text-ink">{t("item.archivedTitle")}</p>
          <p className="mt-0.5 text-ink-muted">{t("item.archivedDescription")}</p>
        </div>
      ) : null}

      {item.status === "active" && item.categoryArchived ? (
        <div className="rounded-lg border border-warning/25 bg-warning-soft/50 px-4 py-3 text-sm">
          <p className="font-medium text-ink">{t("item.categoryArchivedTitle")}</p>
          <p className="mt-0.5 text-ink-muted">{t("item.categoryArchivedDescription")}</p>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("item.pricing")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                  {t("item.basePrice")}
                </p>
                <p className="mt-1 text-2xl font-semibold text-ink">
                  {format.currencyAmount(item.basePriceMinor, item.currency)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("item.branchAvailability")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[13px] leading-5 text-ink-muted">
                {t("item.branchAvailabilityDescription")}
              </p>
              {item.availability.length === 0 ? (
                <EmptyState
                  bordered={false}
                  compact
                  icon={UtensilsCrossed}
                  title={t("item.noBranches")}
                  description={t("item.noBranchesDescription")}
                />
              ) : (
                <TableContainer>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("table.branch")}</TableHead>
                        <TableHead>{t("table.availability")}</TableHead>
                        <TableHead className="text-right">{t("item.effectivePrice")}</TableHead>
                        <TableHead className="text-right">
                          <span className="sr-only">{t("item.edit")}</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {item.availability.map((entry) => (
                        <TableRow key={entry.branchId}>
                          <TableCell>
                            <div className="font-medium text-ink">{entry.branchName}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={entry.isAvailable ? "success" : "neutral"}>
                              {entry.isAvailable
                                ? statusLabel("available")
                                : statusLabel("unavailable")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-medium text-ink">
                              {format.currencyAmount(entry.effectivePriceMinor, item.currency)}
                            </span>
                            {entry.priceOverrideMinor !== null ? (
                              <div className="text-xs text-accent">{t("item.branchOverride")}</div>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right">
                            {entry.canManageAvailability ? (
                              <label className="inline-flex items-center gap-2 text-xs text-ink-muted">
                                <span>
                                  {entry.isAvailable
                                    ? t("item.toggleUnavailable")
                                    : t("item.toggleAvailable")}
                                </span>
                                <Checkbox
                                  checked={entry.isAvailable}
                                  disabled={!canToggle || pendingBranchId === entry.branchId}
                                  onChange={(event) =>
                                    toggleAvailability(entry.branchId, event.target.checked)
                                  }
                                  aria-label={
                                    entry.isAvailable
                                      ? t("item.toggleUnavailable")
                                      : t("item.toggleAvailable")
                                  }
                                />
                              </label>
                            ) : (
                              <span className="text-xs text-ink-subtle">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("item.details")}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    {t("item.category")}
                  </dt>
                  <dd className="mt-0.5 text-ink">{item.categoryName ?? t("uncategorized")}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    {t("item.sortOrder")}
                  </dt>
                  <dd className="mt-0.5 text-ink">{format.number(item.sortOrder)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    {t("item.created")}
                  </dt>
                  <dd className="mt-0.5 text-ink">{format.dateOnly(item.createdAt, timezone)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    {t("item.lastUpdated")}
                  </dt>
                  <dd className="mt-0.5 text-ink">{format.dateOnly(item.updatedAt, timezone)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageStack>
  );
}
