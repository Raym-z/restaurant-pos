import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  backLink?: { href: string; label: string };
  className?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  backLink,
  className,
}: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}
    >
      <div className="min-w-0">
        {backLink ? (
          <Link
            href={backLink.href}
            className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {backLink.label}
          </Link>
        ) : null}
        {eyebrow ? (
          <p className="mb-1.5 text-xs font-semibold tracking-[0.14em] text-brand uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px] sm:leading-9">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-ink-muted">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div>
      ) : null}
    </header>
  );
}

interface PageSectionProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function PageSection({
  title,
  description,
  actions,
  className,
  children,
}: PageSectionProps) {
  return (
    <section data-slot="page-section" className={cn("space-y-4", className)}>
      {title || description || actions ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {title ? (
              <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
            ) : null}
            {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function PageStack({ className, children }: React.ComponentProps<"div">) {
  return (
    <div data-slot="page-stack" className={cn("space-y-6", className)}>
      {children}
    </div>
  );
}
