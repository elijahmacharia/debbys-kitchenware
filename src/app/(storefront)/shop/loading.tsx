import { ProductGridSkeleton, Skeleton } from '@/components/ui/Skeleton';

export default function ShopLoading() {
  return (
    <div className="container-site py-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-8 w-52" />
      <Skeleton className="mt-2 h-4 w-28" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_1fr]">
        <div className="hidden space-y-3 lg:block">
          {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}
