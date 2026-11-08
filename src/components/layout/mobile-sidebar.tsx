"use client";

import { MapPin, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Brand } from "@/components/layout/brand";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useWorkspace } from "@/providers/workspace-provider";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const { organization, activeBranch } = useWorkspace();
  const t = useTranslations("shell");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false} className="p-0">
        <SheetHeader className="flex-row items-start justify-between gap-2 px-5 py-4">
          <div className="min-w-0">
            <SheetTitle className="sr-only">{t("navigation")}</SheetTitle>
            <SheetDescription className="sr-only">
              {t("navigationDescription", { organization: organization.name })}
            </SheetDescription>
            <Brand subtitle={organization.name} onNavigate={() => onOpenChange(false)} />
          </div>
          <SheetClose asChild>
            <Button variant="ghost" size="icon-sm" aria-label={t("closeNavigation")}>
              <X />
            </Button>
          </SheetClose>
        </SheetHeader>

        <SidebarNav onNavigate={() => onOpenChange(false)} />

        <div className="shrink-0 border-t border-line p-4">
          <div className="rounded-lg border border-line bg-surface-subtle p-3">
            <p className="text-[11px] font-medium tracking-wider text-ink-subtle uppercase">
              {t("activeBranch")}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="size-1.5 shrink-0 rounded-full bg-success" aria-hidden="true" />
              <p className="truncate text-[13px] font-medium text-ink">{activeBranch.name}</p>
            </div>
            <div className="mt-1 flex items-start gap-1.5 text-[11px] leading-4 text-ink-subtle">
              <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{activeBranch.timezone}</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
