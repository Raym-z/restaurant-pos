"use client";

import { MapPin, X } from "lucide-react";

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
  const { organization, user, activeBranch } = useWorkspace();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false} className="p-0">
        <SheetHeader className="flex-row items-start justify-between gap-2 px-5 py-4">
          <div className="min-w-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">
              Primary application navigation for {organization.name}.
            </SheetDescription>
            <Brand subtitle={organization.name} onNavigate={() => onOpenChange(false)} />
          </div>
          <SheetClose asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Close navigation">
              <X />
            </Button>
          </SheetClose>
        </SheetHeader>

        <SidebarNav role={user.role} onNavigate={() => onOpenChange(false)} />

        <div className="shrink-0 border-t border-line p-4">
          <div className="rounded-lg border border-line bg-surface-subtle p-3">
            <p className="text-[11px] font-medium tracking-wider text-ink-subtle uppercase">
              Active branch
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="size-1.5 shrink-0 rounded-full bg-success" aria-hidden="true" />
              <p className="truncate text-[13px] font-medium text-ink">{activeBranch.shortName}</p>
            </div>
            <div className="mt-1 flex items-start gap-1.5 text-[11px] leading-4 text-ink-subtle">
              <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{activeBranch.city}</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
