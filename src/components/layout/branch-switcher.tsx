"use client";

import { ChevronsUpDown, MapPin, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
  const router = useRouter();
  const t = useTranslations("shell");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleBranchChange(branchId: string) {
    setError(null);
    startTransition(async () => {
      const result = await setActiveBranch(branchId);
      if (!result.ok) {
        setError(t("branchSwitchFailed"));
        return;
      }
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" className="h-9 max-w-[240px] gap-2 px-2.5">
          <MapPin className="text-brand" aria-hidden="true" />
          <span className="sr-only">{t("switchBranch")}: </span>
          <span className="sr-only sm:hidden">
            {activeBranch.name}, {activeBranch.timezone}
          </span>
          <span className="hidden min-w-0 flex-col items-start leading-tight sm:flex">
            <span className="max-w-[150px] truncate text-[13px] font-medium">
              {activeBranch.name}
            </span>
            <span className="max-w-[150px] truncate text-[10px] font-normal text-ink-subtle">
              {activeBranch.timezone}
            </span>
          </span>
          <ChevronsUpDown className="text-ink-subtle" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>{t("switchBranch")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={activeBranch.id}
          onValueChange={handleBranchChange}
          aria-busy={pending}
        >
          {branches.map((branch) => (
            <DropdownMenuRadioItem
              key={branch.id}
              value={branch.id}
              disabled={pending}
              className="items-start py-2.5"
            >
              <span className="flex flex-col">
                <span className="text-sm font-medium text-ink">{branch.name}</span>
                <span className="text-xs text-ink-subtle">{branch.timezone}</span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {error ? (
          <p role="alert" className="px-2 py-1.5 text-xs text-danger">
            {error}
          </p>
        ) : null}
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
