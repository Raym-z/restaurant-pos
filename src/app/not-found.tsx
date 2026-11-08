import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-canvas px-6 py-16">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center">
          <Brand subtitle="Staff workspace" />
        </div>
        <p className="mt-12 text-xs font-semibold tracking-[0.18em] text-brand uppercase">
          Error 404
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">
          The page you requested doesn&apos;t exist, or it may have moved to a different part of the
          workspace.
        </p>
        <div className="mt-7 flex justify-center">
          <Button asChild>
            <Link href="/dashboard">
              <ArrowLeft />
              Back to dashboard
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
