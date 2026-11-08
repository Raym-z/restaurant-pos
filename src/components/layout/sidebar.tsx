"use client";

import { MapPin, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useTranslations } from "next-intl";

import { Brand } from "@/components/layout/brand";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useWorkspace } from "@/providers/workspace-provider";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { organization, user, activeBranch } = useWorkspace();
  const t = useTranslations("shell");
  const planKey = organization.planLabel.replace(/\s*plan$/i, "").toLowerCase();
  const planLabel = t.has(`plans.${planKey}`) ? t(`plans.${planKey}`) : organization.planLabel;

  return (
    <aside
      data-slot="sidebar"
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-surface-subtle transition-[width] duration-200 lg:flex",
        collapsed ? "w-[84px]" : "w-[272px]",
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-line",
          collapsed ? "justify-center px-3" : "justify-between gap-2 px-4",
        )}
      >
        <Brand subtitle={organization.name} compact={collapsed} />
        {collapsed ? null : (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggle}
            aria-label={t("collapseSidebar")}
            className="shrink-0 text-ink-subtle"
          >
            <PanelLeftClose />
          </Button>
        )}
      </div>

      {collapsed ? (
        <div className="flex justify-center border-b border-line py-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onToggle}
                aria-label={t("expandSidebar")}
              >
                <PanelLeftOpen />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{t("expandSidebar")}</TooltipContent>
          </Tooltip>
        </div>
      ) : null}

      <SidebarNav role={user.role} collapsed={collapsed} />

      <div className={cn("shrink-0 border-t border-line", collapsed ? "p-2" : "p-3")}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-10 items-center justify-center rounded-lg">
                <MapPin className="size-[18px] text-brand" aria-hidden="true" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              {activeBranch.name}
              <span className="block font-normal text-white/70">{activeBranch.city}</span>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="rounded-lg border border-line bg-surface p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium tracking-wider text-ink-subtle uppercase">
                {t("activeBranch")}
              </p>
              <Badge variant="brand" className="text-[10px]">
                {planLabel}
              </Badge>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="size-1.5 shrink-0 rounded-full bg-success" aria-hidden="true" />
              <p className="truncate text-[13px] font-medium text-ink">{activeBranch.shortName}</p>
            </div>
            <div className="mt-1 flex items-start gap-1.5 text-[11px] leading-4 text-ink-subtle">
              <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{activeBranch.city}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
