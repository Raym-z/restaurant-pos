import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

import { Input } from "./input";

interface SearchInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  label: string;
  wrapperClassName?: string;
}

export function SearchInput({ label, className, wrapperClassName, ...props }: SearchInputProps) {
  return (
    <label className={cn("relative block", wrapperClassName)}>
      <span className="sr-only">{label}</span>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-ink-subtle"
        aria-hidden="true"
      />
      <Input type="search" className={cn("pl-9", className)} {...props} />
    </label>
  );
}
