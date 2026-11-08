"use client";

import { Pencil, UtensilsCrossed } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";

import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMockData } from "@/features/shared/mock-data-provider";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useStatusLabel, useTagLabel, useMenuContentLabel } from "@/i18n/use-labels";
import type { MenuItemStatus } from "../types";
import { effectivePriceMinor, localizeMenuCategory, localizeMenuItem } from "../selectors";

const STATUS_BADGES: Record<MenuItemStatus, "success" | "warning" | "neutral"> = {
  available: "success",
  unavailable: "warning",
  archived: "neutral",
};

export function MenuItemDetailScreen() {
  const params = useParams<{ id: string }>();
  const locale = useLocale();
  const { menuItems, menuCategories, branches, organization } = useMockData();
  const t = useTranslations("menu.item");
  const tCommon = useTranslations("common");
  const statusLabel = useStatusLabel();
  const tagLabel = useTagLabel();
  const contentLabel = useMenuContentLabel();
  const format = useLocalizedFormat();
  const item = menuItems.find((entry) => entry.id === params.id);

  if (!item) {
    return (
      <PageStack>
        <PageHeader title={t("notFoundTitle")} backLink={{ href: "/menu", label: t("back") }} />
        <EmptyState
          icon={UtensilsCrossed}
          title={t("notFoundTitle")}
          description={t("notFoundDescription")}
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/menu">{t("backToMenu")}</Link>
            </Button>
          }
        />
      </PageStack>
    );
  }

  const content = localizeMenuItem(item, locale);
  const category = menuCategories.find((entry) => entry.id === item.categoryId);
  const categoryContent = category ? localizeMenuCategory(category, locale) : null;

  return (
    <PageStack>
      <PageHeader
        eyebrow={categoryContent?.name ?? t("eyebrow")}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {content.name}
            <Badge variant={STATUS_BADGES[item.status]}>{statusLabel(item.status)}</Badge>
          </span>
        }
        description={content.description}
        backLink={{ href: "/menu", label: t("back") }}
        actions={
          <Button asChild variant="secondary">
            <Link href={`/menu/items/${item.id}/edit`}>
              <Pencil />
              {t("edit")}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("pricing")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-end gap-6">
                <div>
                  <p className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    {t("basePrice")}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-ink">
                    {format.money(item.basePrice)}
                  </p>
                </div>
                {item.variants.length > 0 ? (
                  <p className="text-sm text-ink-muted">{t("variantPricing")}</p>
                ) : null}
              </div>
              <TableContainer>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.branch")}</TableHead>
                      <TableHead>{t("table.availability")}</TableHead>
                      <TableHead className="text-right">{t("table.effectivePrice")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branches.map((branch) => {
                      const entry = item.branchAvailability.find(
                        (candidate) => candidate.branchId === branch.id,
                      );
                      const available = entry?.isAvailable ?? false;
                      const hasOverride =
                        entry?.priceOverride !== null && entry?.priceOverride !== undefined;
                      return (
                        <TableRow key={branch.id}>
                          <TableCell>
                            <div className="font-medium text-ink">{branch.name}</div>
                            <div className="text-xs text-ink-subtle">{branch.code}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={available ? "success" : "neutral"}>
                              {statusLabel(available ? "available" : "unavailable")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-medium text-ink">
                              {format.currencyAmount(
                                effectivePriceMinor(item, branch.id),
                                item.basePrice.currency,
                              )}
                            </span>
                            {hasOverride ? (
                              <div className="text-xs text-accent">{t("branchOverride")}</div>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("variantsModifiers")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-ink">{t("variants")}</h3>
                {item.variants.length === 0 ? (
                  <p className="mt-1 text-sm text-ink-muted">{t("noVariants")}</p>
                ) : (
                  <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
                    {item.variants.map((variant) => (
                      <li
                        key={variant.id}
                        className="flex items-center justify-between px-3 py-2 text-sm"
                      >
                        <span className="text-ink">{contentLabel(variant.name)}</span>
                        <span className="font-medium text-ink">{format.money(variant.price)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-ink">{t("modifierGroups")}</h3>
                {item.modifierGroups.length === 0 ? (
                  <p className="mt-1 text-sm text-ink-muted">{t("noModifiers")}</p>
                ) : (
                  <div className="mt-2 space-y-3">
                    {item.modifierGroups.map((group) => (
                      <div key={group.id} className="rounded-lg border border-line">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-subtle px-3 py-2">
                          <span className="text-sm font-medium text-ink">
                            {contentLabel(group.name)}
                          </span>
                          <span className="text-xs text-ink-subtle">
                            {group.minSelections === 0
                              ? tCommon("optional")
                              : t("choose", { count: group.minSelections })}{" "}
                            · {t("upTo", { count: group.maxSelections })}
                          </span>
                        </div>
                        <ul className="divide-y divide-line">
                          {group.options.map((option) => (
                            <li
                              key={option.id}
                              className="flex items-center justify-between px-3 py-2 text-sm"
                            >
                              <span className="text-ink">{contentLabel(option.name)}</span>
                              <span className="text-ink-muted">
                                {option.priceDelta.amountMinor === 0
                                  ? tCommon("included")
                                  : `+${format.money(option.priceDelta)}`}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("metadata")}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    {t("category")}
                  </dt>
                  <dd className="mt-0.5 text-ink">{categoryContent?.name ?? t("uncategorized")}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    {t("tags")}
                  </dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {item.tags.length === 0 ? (
                      <span className="text-ink-muted">{t("noTags")}</span>
                    ) : (
                      item.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tagLabel(tag)}
                        </Badge>
                      ))
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    {t("created")}
                  </dt>
                  <dd className="mt-0.5 text-ink">
                    {format.dateOnly(item.createdAt, organization.timezone)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    {t("lastUpdated")}
                  </dt>
                  <dd className="mt-0.5 text-ink">
                    {format.dateOnly(item.updatedAt, organization.timezone)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("availabilityRules")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[13px] leading-5 text-ink-muted">{t("availabilityRulesText")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageStack>
  );
}
