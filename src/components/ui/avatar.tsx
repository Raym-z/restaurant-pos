import { cva, type VariantProps } from "class-variance-authority";

import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-full bg-brand-soft font-semibold text-brand-ink ring-1 ring-brand/10 ring-inset",
  {
    variants: {
      size: {
        sm: "size-8 text-xs",
        md: "size-9 text-sm",
        lg: "size-11 text-base",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

interface AvatarProps extends React.ComponentProps<"span">, VariantProps<typeof avatarVariants> {
  name: string;
}

export function Avatar({ name, size, className, ...props }: AvatarProps) {
  return (
    <span
      data-slot="avatar"
      aria-hidden="true"
      className={cn(avatarVariants({ size }), className)}
      {...props}
    >
      {getInitials(name)}
    </span>
  );
}

export { avatarVariants };
