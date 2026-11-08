import { cn } from "@/lib/utils";

export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink shadow-sm transition-colors",
        "placeholder:text-ink-subtle hover:border-ink-subtle/60",
        "focus:border-brand",
        "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-subtle",
        "read-only:bg-surface-subtle aria-invalid:border-danger",
        className,
      )}
      {...props}
    />
  );
}
