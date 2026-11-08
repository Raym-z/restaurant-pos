"use client";

import { useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Sidebar } from "@/components/layout/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <TooltipProvider>
      <div className="min-h-svh bg-canvas">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
        />
        <MobileSidebar open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

        <div
          className={cn(
            "flex min-h-svh flex-col transition-[padding-left] duration-200",
            sidebarCollapsed ? "lg:pl-[84px]" : "lg:pl-[272px]",
          )}
        >
          <AppHeader onOpenMobileNav={() => setMobileNavOpen(true)} />
          <main id="main-content" className="flex-1">
            <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
