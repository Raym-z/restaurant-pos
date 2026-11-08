"use client";

import { ArrowLeft, Minus, Plus, Search, UtensilsCrossed } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrencyAmount } from "@/lib/currency";

import { formatCurrencyDelta } from "../format";
import { modifierDeltaMinor, selectedModifierLabels, validateModifierSelection } from "../menu";
import type { DraftOrderLine, PosMenu, PosMenuItem } from "../types";

interface MenuItemPickerProps {
  menu: PosMenu;
  submitLabel: string;
  onAdd: (line: DraftOrderLine) => void;
  isSubmitting?: boolean;
}

export function MenuItemPicker({
  menu,
  submitLabel,
  onAdd,
  isSubmitting = false,
}: MenuItemPickerProps) {
  const t = useTranslations("tables.order");
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const selectedItem = useMemo(
    () =>
      menu.categories
        .flatMap((category) => category.items)
        .find((item) => item.id === selectedItemId) ?? null,
    [menu.categories, selectedItemId],
  );

  const visibleCategories = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return menu.categories
      .filter((category) => categoryId === "all" || category.id === categoryId)
      .map((category) => ({
        ...category,
        items: category.items.filter(
          (item) =>
            !normalized ||
            item.name.toLowerCase().includes(normalized) ||
            (item.description ?? "").toLowerCase().includes(normalized),
        ),
      }))
      .filter((category) => category.items.length > 0);
  }, [categoryId, menu.categories, query]);

  function selectItem(item: PosMenuItem) {
    setSelectedItemId(item.id);
    setQuantity(1);
    setSelectedOptionIds([]);
    setNotes("");
    setSelectionError(null);
  }

  function toggleOption(groupId: string, optionId: string, maxSelections: number) {
    setSelectionError(null);
    setSelectedOptionIds((current) => {
      const group = selectedItem?.modifierGroups.find((entry) => entry.id === groupId);
      if (!group) {
        return current;
      }

      const groupOptionIds = new Set(group.options.map((option) => option.id));
      const currentGroupSelection = current.filter((id) => groupOptionIds.has(id));

      if (currentGroupSelection.includes(optionId)) {
        return current.filter((id) => id !== optionId);
      }

      if (maxSelections === 1) {
        return [...current.filter((id) => !groupOptionIds.has(id)), optionId];
      }

      if (currentGroupSelection.length >= maxSelections) {
        return current;
      }

      return [...current, optionId];
    });
  }

  function handleAdd() {
    if (!selectedItem) {
      return;
    }

    const issue = validateModifierSelection(selectedItem, selectedOptionIds);
    if (issue) {
      const group = selectedItem.modifierGroups.find((entry) => entry.id === issue.groupId);
      setSelectionError(
        issue.issue === "min"
          ? t("modifierRequired", {
              group: group?.name ?? "",
              count: issue.requiredMin,
            })
          : issue.issue === "max"
            ? t("modifierLimit", {
                group: group?.name ?? "",
                count: issue.allowedMax,
              })
            : t("modifierInvalid"),
      );
      return;
    }

    const delta = modifierDeltaMinor(selectedItem, selectedOptionIds);
    onAdd({
      key: globalThis.crypto?.randomUUID?.() ?? `${selectedItem.id}-${Date.now()}`,
      menuItemId: selectedItem.id,
      name: selectedItem.name,
      quantity,
      modifierOptionIds: [...selectedOptionIds],
      modifierLabels: selectedModifierLabels(selectedItem, selectedOptionIds),
      basePriceMinor: selectedItem.basePriceMinor,
      unitPriceMinor: selectedItem.basePriceMinor + delta,
      currency: selectedItem.currency,
      notes: notes.trim(),
    });

    setSelectedItemId(null);
    setSelectedOptionIds([]);
    setNotes("");
    setSelectionError(null);
  }

  if (selectedItem) {
    const delta = modifierDeltaMinor(selectedItem, selectedOptionIds);
    const unitPrice = selectedItem.basePriceMinor + delta;

    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSelectedItemId(null)}
            disabled={isSubmitting}
            aria-label={t("backToMenu")}
          >
            <ArrowLeft />
          </Button>
          <div className="min-w-0">
            <h3 className="text-base font-semibold tracking-tight text-ink">{selectedItem.name}</h3>
            {selectedItem.description ? (
              <p className="mt-0.5 text-sm text-ink-muted">{selectedItem.description}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-line bg-surface-subtle px-3 py-2">
          <span className="text-sm text-ink-muted">{t("unitPrice")}</span>
          <span className="font-medium text-ink">
            {formatCurrencyAmount(unitPrice, selectedItem.currency)}
          </span>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ink" htmlFor="order-item-quantity">
            {t("quantity")}
          </label>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              disabled={quantity <= 1 || isSubmitting}
              aria-label={t("decreaseQuantity")}
            >
              <Minus />
            </Button>
            <Input
              id="order-item-quantity"
              type="number"
              min={1}
              max={99}
              value={quantity}
              onChange={(event) => {
                const next = Number(event.target.value);
                setQuantity(Number.isFinite(next) ? Math.min(99, Math.max(1, next)) : 1);
              }}
              disabled={isSubmitting}
              className="w-20 text-center"
            />
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setQuantity((current) => Math.min(99, current + 1))}
              disabled={quantity >= 99 || isSubmitting}
              aria-label={t("increaseQuantity")}
            >
              <Plus />
            </Button>
          </div>
        </div>

        {selectedItem.modifierGroups.map((group) => {
          const groupOptionIds = new Set(group.options.map((option) => option.id));
          const groupSelection = selectedOptionIds.filter((id) => groupOptionIds.has(id));
          const atMax = groupSelection.length >= group.maxSelections;

          return (
            <fieldset key={group.id} className="space-y-2">
              <legend className="text-sm font-medium text-ink">
                {group.name}
                <span className="ml-1 text-xs font-normal text-ink-subtle">
                  {group.minSelections > 0
                    ? t("requiredGroup", { count: group.minSelections })
                    : t("optionalGroup")}
                </span>
              </legend>
              {group.options.length === 0 ? (
                <p className="rounded-lg border border-warning/20 bg-warning-soft/40 px-3 py-2 text-xs text-warning">
                  {t("noOptionsAvailable", { group: group.name })}
                </p>
              ) : null}
              <div className="grid gap-1.5">
                {group.options.map((option) => {
                  const checked = selectedOptionIds.includes(option.id);
                  const disabled = isSubmitting || (!checked && atMax && group.maxSelections > 1);

                  if (group.maxSelections === 1) {
                    return (
                      <label
                        key={option.id}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                          checked
                            ? "border-brand bg-brand-soft/40 text-ink"
                            : "border-line bg-surface text-ink-muted hover:border-line-strong"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`modifier-${group.id}`}
                            className="accent-brand"
                            checked={checked}
                            disabled={isSubmitting}
                            onChange={() => toggleOption(group.id, option.id, 1)}
                          />
                          {option.name}
                        </span>
                        <span className="text-xs text-ink-subtle">
                          {option.priceDeltaMinor === 0
                            ? t("included")
                            : formatCurrencyDelta(option.priceDeltaMinor, selectedItem.currency)}
                        </span>
                      </label>
                    );
                  }

                  return (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-muted"
                    >
                      <span className="flex items-center gap-2">
                        <Checkbox
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleOption(group.id, option.id, group.maxSelections)}
                        />
                        {option.name}
                      </span>
                      <span className="text-xs text-ink-subtle">
                        {option.priceDeltaMinor === 0
                          ? t("included")
                          : formatCurrencyDelta(option.priceDeltaMinor, selectedItem.currency)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}

        <div className="space-y-2">
          <label className="text-sm font-medium text-ink" htmlFor="order-item-notes">
            {t("itemNotes")}
          </label>
          <Textarea
            id="order-item-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={500}
            placeholder={t("itemNotesPlaceholder")}
            disabled={isSubmitting}
            rows={2}
          />
        </div>

        {selectionError ? (
          <p role="alert" className="text-sm text-danger">
            {selectionError}
          </p>
        ) : null}

        <Button className="w-full" onClick={handleAdd} disabled={isSubmitting}>
          <Plus />
          {submitLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <SearchInput
          label={t("searchMenu")}
          placeholder={t("searchMenuPlaceholder")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          wrapperClassName="w-full"
        />
        <label className="flex items-center gap-2">
          <span className="sr-only">{t("allCategories")}</span>
          <Select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="h-10 w-full sm:w-48"
          >
            <option value="all">{t("allCategories")}</option>
            {menu.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {visibleCategories.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface-subtle/60 px-4 py-8 text-center">
          <Search className="mx-auto size-5 text-ink-subtle" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium text-ink">{t("noMenuItemsTitle")}</p>
          <p className="mt-1 text-sm text-ink-muted">{t("noMenuItemsDescription")}</p>
        </div>
      ) : (
        <div className="max-h-[52vh] space-y-4 overflow-y-auto pr-1">
          {visibleCategories.map((category) => (
            <section key={category.id} className="space-y-2">
              <h4 className="text-[11px] font-semibold tracking-[0.14em] text-ink-subtle uppercase">
                {category.name}
              </h4>
              <div className="space-y-1.5">
                {category.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectItem(item)}
                    disabled={isSubmitting}
                    className="flex w-full items-start justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2.5 text-left transition-colors hover:border-brand/40 hover:bg-brand-soft/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-medium text-ink">{item.name}</span>
                        {item.modifierGroups.some((group) => group.minSelections > 0) ? (
                          <Badge variant="outline">{t("optionsRequired")}</Badge>
                        ) : null}
                      </span>
                      {item.description ? (
                        <span className="mt-0.5 line-clamp-2 block text-xs text-ink-subtle">
                          {item.description}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-sm font-medium text-ink">
                      {formatCurrencyAmount(item.basePriceMinor, item.currency)}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="flex items-center gap-1.5 text-xs text-ink-subtle">
        <UtensilsCrossed className="size-3.5" aria-hidden="true" />
        {t("menuSourceNote")}
      </p>
    </div>
  );
}
