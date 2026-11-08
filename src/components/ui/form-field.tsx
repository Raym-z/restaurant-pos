import { cn } from "@/lib/utils";

import { Label } from "./label";

interface FormFieldProps {
  label: React.ReactNode;
  htmlFor?: string;
  description?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Standard label + control + hint/error composition.
 *
 * Wire the control to the hint/error for assistive technology:
 * `aria-describedby={`${id}-description`}` / `aria-invalid={Boolean(error)}`,
 * or use aria-describedby with a single shared id.
 */
export function FormField({
  label,
  htmlFor,
  description,
  error,
  required,
  className,
  children,
}: FormFieldProps) {
  const descriptionId = htmlFor ? `${htmlFor}-description` : undefined;
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;

  return (
    <div data-slot="form-field" className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {error ? (
        <p id={errorId} role="alert" className="text-[13px] leading-5 text-danger">
          {error}
        </p>
      ) : description ? (
        <p id={descriptionId} className="text-[13px] leading-5 text-ink-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}

interface FormGridProps {
  className?: string;
  children: React.ReactNode;
}

export function FormGrid({ className, children }: FormGridProps) {
  return <div className={cn("grid gap-4 sm:grid-cols-2", className)}>{children}</div>;
}

interface FormSectionProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function FormSection({ title, description, className, children }: FormSectionProps) {
  return (
    <section
      className={cn("grid gap-4 border-b border-line pb-6 sm:grid-cols-[220px_1fr]", className)}
    >
      <div>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {description ? (
          <p className="mt-1 text-[13px] leading-5 text-ink-muted">{description}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

interface FormActionsProps {
  className?: string;
  children: React.ReactNode;
}

export function FormActions({ className, children }: FormActionsProps) {
  return (
    <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}>
      {children}
    </div>
  );
}
