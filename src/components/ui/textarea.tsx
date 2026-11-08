import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink shadow-sm transition-colors",
        "placeholder:text-ink-subtle hover:border-ink-subtle/60",
        "focus:border-brand",
        "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-subtle",
        "aria-invalid:border-danger",
        className,
      )}
      {...props}
    />
  );
}
