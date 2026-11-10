import { PageStack } from "@/components/layout/page";
import { Skeleton } from "@/components/ui/skeleton";

export default function PosLoading() {
  return (
    <PageStack>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-24 rounded-xl" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Skeleton className="h-[520px] rounded-xl" />
        <Skeleton className="h-[520px] rounded-xl" />
      </div>
    </PageStack>
  );
}
