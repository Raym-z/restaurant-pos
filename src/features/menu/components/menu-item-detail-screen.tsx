"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Pencil, UtensilsCrossed } from "lucide-react";

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
import { formatDateOnly, formatMinorUnits, formatMoney } from "@/features/shared/format";
import { useMockData } from "@/features/shared/mock-data-provider";
import type { MenuItemStatus } from "../types";
import { MENU_ITEM_STATUS_LABELS } from "../types";
import { effectivePriceMinor } from "../selectors";

const STATUS_BADGES: Record<MenuItemStatus, "success" | "warning" | "neutral"> = {
  available: "success",
  unavailable: "warning",
  archived: "neutral",
};

export function MenuItemDetailScreen() {
  const params = useParams<{ id: string }>();
  const { menuItems, menuCategories, branches, organization } = useMockData();
  const item = menuItems.find((entry) => entry.id === params.id);

  if (!item) {
    return (
      <PageStack>
        <PageHeader
          title="Menu item not found"
          backLink={{ href: "/menu", label: "Back to menu" }}
        />
        <EmptyState
          icon={UtensilsCrossed}
          title="This menu item could not be found"
          description="It may have been removed, or the link is no longer valid."
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/menu">Back to menu</Link>
            </Button>
          }
        />
      </PageStack>
    );
  }

  const category = menuCategories.find((entry) => entry.id === item.categoryId);
  const branchById = new Map(branches.map((branch) => [branch.id, branch]));

  return (
    <PageStack>
      <PageHeader
        eyebrow={category?.name ?? "Menu item"}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {item.name}
            <Badge variant={STATUS_BADGES[item.status]}>
              {MENU_ITEM_STATUS_LABELS[item.status]}
            </Badge>
          </span>
        }
        description={item.description}
        backLink={{ href: "/menu", label: "Back to menu" }}
        actions={
          <Button asChild variant="secondary">
            <Link href={`/menu/items/${item.id}/edit`}>
              <Pencil />
              Edit item
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Pricing and availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-end gap-6">
                <div>
                  <p className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    Base price
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-ink">
                    {formatMoney(item.basePrice)}
                  </p>
                </div>
                {item.variants.length > 0 ? (
                  <p className="text-sm text-ink-muted">
                    Variant pricing overrides the base price.
                  </p>
                ) : null}
              </div>
              <TableContainer>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Branch</TableHead>
                      <TableHead>Availability</TableHead>
                      <TableHead className="text-right">Effective price</TableHead>
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
                            <div className="text-xs text-ink-subtle">
                              {branchById.get(branch.id)?.code}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={available ? "success" : "neutral"}>
                              {available ? "Available" : "Not available"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-medium text-ink">
                              {formatMinorUnits(
                                effectivePriceMinor(item, branch.id),
                                item.basePrice.currency,
                              )}
                            </span>
                            {hasOverride ? (
                              <div className="text-xs text-accent">Branch override</div>
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
              <CardTitle>Variants and modifiers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-ink">Variants</h3>
                {item.variants.length === 0 ? (
                  <p className="mt-1 text-sm text-ink-muted">
                    No variants. The base price applies to every order.
                  </p>
                ) : (
                  <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
                    {item.variants.map((variant) => (
                      <li
                        key={variant.id}
                        className="flex items-center justify-between px-3 py-2 text-sm"
                      >
                        <span className="text-ink">{variant.name}</span>
                        <span className="font-medium text-ink">{formatMoney(variant.price)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-ink">Modifier groups</h3>
                {item.modifierGroups.length === 0 ? (
                  <p className="mt-1 text-sm text-ink-muted">
                    No modifier groups are configured for this item.
                  </p>
                ) : (
                  <div className="mt-2 space-y-3">
                    {item.modifierGroups.map((group) => (
                      <div key={group.id} className="rounded-lg border border-line">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-subtle px-3 py-2">
                          <span className="text-sm font-medium text-ink">{group.name}</span>
                          <span className="text-xs text-ink-subtle">
                            {group.minSelections === 0
                              ? "Optional"
                              : `Choose ${group.minSelections}`}{" "}
                            · up to {group.maxSelections}
                          </span>
                        </div>
                        <ul className="divide-y divide-line">
                          {group.options.map((option) => (
                            <li
                              key={option.id}
                              className="flex items-center justify-between px-3 py-2 text-sm"
                            >
                              <span className="text-ink">{option.name}</span>
                              <span className="text-ink-muted">
                                {option.priceDelta.amountMinor === 0
                                  ? "Included"
                                  : `+${formatMoney(option.priceDelta)}`}
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
              <CardTitle>Item metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    Category
                  </dt>
                  <dd className="mt-0.5 text-ink">{category?.name ?? "Uncategorized"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    Tags
                  </dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {item.tags.length === 0 ? (
                      <span className="text-ink-muted">No tags</span>
                    ) : (
                      item.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    Created
                  </dt>
                  <dd className="mt-0.5 text-ink">
                    {formatDateOnly(item.createdAt, organization.timezone)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                    Last updated
                  </dt>
                  <dd className="mt-0.5 text-ink">
                    {formatDateOnly(item.updatedAt, organization.timezone)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Availability rules</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[13px] leading-5 text-ink-muted">
                An item is orderable at a branch only when both the organization-level status and
                the branch availability allow it. Final menu validation and pricing remain backend
                responsibilities.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageStack>
  );
}
