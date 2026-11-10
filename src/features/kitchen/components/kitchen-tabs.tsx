"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function KitchenTabs({ canManageStations }: { canManageStations: boolean }) {
  const t = useTranslations("kitchen.tabs");
  const pathname = usePathname();
  const tabs = [
    { href: "/kitchen", label: t("board") },
    { href: "/kitchen/history", label: t("history") },
    ...(canManageStations ? [{ href: "/kitchen/stations", label: t("stations") }] : []),
  ];

  return (
    <nav
      aria-label={t("label")}
      className="flex flex-wrap items-center gap-1 rounded-xl border border-line bg-surface p-1 shadow-card"
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium transition-colors",
              active
                ? "bg-brand text-white shadow-sm"
                : "text-ink-muted hover:bg-surface-muted hover:text-ink",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
