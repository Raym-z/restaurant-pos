"use client";

import { ChevronRight, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BranchSwitcher } from "@/components/layout/branch-switcher";
import { UserSummary } from "@/components/layout/user-summary";
import { Button } from "@/components/ui/button";
import { findActiveNavigation } from "@/config/navigation";

interface AppHeaderProps {
  onOpenMobileNav: () => void;
}

export function AppHeader({ onOpenMobileNav }: AppHeaderProps) {
  const pathname = usePathname();
  const active = findActiveNavigation(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b border-line bg-canvas/85 px-4 backdrop-blur-md sm:gap-4 sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
      >
        <Menu />
      </Button>

      <div className="min-w-0 flex-1">
        <nav aria-label="Breadcrumb" className="hidden sm:block">
          <ol className="flex items-center gap-1.5 text-[13px]">
            <li>
              <Link href="/dashboard" className="text-ink-subtle transition-colors hover:text-ink">
                Workspace
              </Link>
            </li>
            {active ? (
              <>
                <li aria-hidden="true">
                  <ChevronRight className="size-3.5 text-ink-subtle" />
                </li>
                <li className="text-ink-subtle">{active.section.label}</li>
                <li aria-hidden="true">
                  <ChevronRight className="size-3.5 text-ink-subtle" />
                </li>
                <li aria-current="page" className="truncate font-medium text-ink">
                  {active.item.title}
                </li>
              </>
            ) : null}
          </ol>
        </nav>
        <p className="truncate text-sm font-medium text-ink sm:hidden">
          {active?.item.title ?? "Restaurant POS"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <BranchSwitcher />
        <UserSummary />
      </div>
    </header>
  );
}
