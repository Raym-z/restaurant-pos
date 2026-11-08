"use client";

import { ChevronsUpDown, MapPin, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/providers/workspace-provider";

export function BranchSwitcher() {
  const { branches, activeBranch, setActiveBranch } = useWorkspace();
  const t = useTranslations("shell");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="h-9 max-w-[240px] gap-2 px-2.5"
          aria-label={t("currentBranch", { branch: activeBranch.name })}
        >
          <MapPin className="text-brand" aria-hidden="true" />
          <span className="hidden min-w-0 flex-col items-start leading-tight sm:flex">
            <span className="max-w-[150px] truncate text-[13px] font-medium">
              {activeBranch.shortName}
            </span>
            <span className="max-w-[150px] truncate text-[10px] font-normal text-ink-subtle">
              {activeBranch.city}
            </span>
          </span>
          <ChevronsUpDown className="text-ink-subtle" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>{t("switchBranch")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={activeBranch.id} onValueChange={setActiveBranch}>
          {branches.map((branch) => (
            <DropdownMenuRadioItem key={branch.id} value={branch.id} className="items-start py-2.5">
              <span className="flex flex-col">
                <span className="text-sm font-medium text-ink">{branch.shortName}</span>
                <span className="text-xs text-ink-subtle">{branch.city}</span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/branches">
            <Store />
            {t("manageBranches")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
