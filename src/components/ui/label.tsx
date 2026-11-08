import { cn } from "@/lib/utils";

interface LabelProps extends React.ComponentProps<"label"> {
  required?: boolean;
}

export function Label({ className, children, required, ...props }: LabelProps) {
  return (
    <label
      data-slot="label"
      className={cn("text-sm leading-none font-medium text-ink", className)}
      {...props}
    >
      {children}
      {required ? (
        <span aria-hidden="true" className="ml-0.5 text-danger">
          *
        </span>
      ) : null}
    </label>
  );
}
