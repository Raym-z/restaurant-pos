import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          "flex h-10 w-full appearance-none rounded-lg border border-line-strong bg-surface px-3 pr-9 text-sm text-ink shadow-sm transition-colors",
          "hover:border-ink-subtle/60 focus:border-brand",
          "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-subtle",
          "aria-invalid:border-danger",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-subtle"
        aria-hidden="true"
      />
    </div>
  );
}
