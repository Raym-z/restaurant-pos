"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getNavigationForRole, isNavItemActive } from "@/config/navigation";
import { cn } from "@/lib/utils";
import type { StaffRole } from "@/types/workspace";

interface SidebarNavProps {
  role: StaffRole;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ role, collapsed = false, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const tShell = useTranslations("shell");
  const sections = getNavigationForRole(role);

  return (
    <nav
      aria-label={tShell("primaryNavigation")}
      className={cn(
        "flex-1 scrollbar-thin overflow-y-auto",
        collapsed ? "space-y-3 px-2 py-3" : "space-y-5 px-3 py-4",
      )}
    >
      {sections.map((section) => (
        <div key={section.id}>
          {collapsed ? (
            <div className="mx-2 mb-2 border-t border-line" aria-hidden="true" />
          ) : (
            <p className="px-2 pb-1.5 text-[11px] font-semibold tracking-[0.14em] text-ink-subtle uppercase">
              {t(section.labelKey)}
            </p>
          )}
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isNavItemActive(pathname, item.href);
              const Icon = item.icon;
              const title = t(item.titleKey);
              const link = (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex h-10 items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                    collapsed ? "justify-center px-0" : "px-3",
                    active
                      ? "bg-brand-soft text-brand-ink"
                      : "text-ink-muted hover:bg-surface-muted hover:text-ink",
                  )}
                >
                  {active && !collapsed ? (
                    <span
                      className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-brand"
                      aria-hidden="true"
                    />
                  ) : null}
                  <Icon
                    className={cn(
                      "size-[18px] shrink-0",
                      active ? "text-brand" : "text-ink-subtle group-hover:text-ink-muted",
                    )}
                    aria-hidden="true"
                  />
                  {collapsed ? null : <span className="truncate">{title}</span>}
                </Link>
              );

              return (
                <li key={item.href}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right">{title}</TooltipContent>
                    </Tooltip>
                  ) : (
                    link
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
