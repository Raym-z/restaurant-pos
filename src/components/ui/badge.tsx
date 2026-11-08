import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset [&_svg]:size-3",
  {
    variants: {
      variant: {
        neutral: "bg-surface-muted text-ink-muted ring-line-strong/60",
        brand: "bg-brand-soft text-brand-ink ring-brand/15",
        accent: "bg-accent-soft text-accent ring-accent/15",
        success: "bg-success-soft text-success ring-success/15",
        warning: "bg-warning-soft text-warning ring-warning/15",
        danger: "bg-danger-soft text-danger ring-danger/15",
        info: "bg-info-soft text-info ring-info/15",
        outline: "bg-transparent text-ink-muted ring-line-strong",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

interface BadgeProps extends React.ComponentProps<"span">, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
