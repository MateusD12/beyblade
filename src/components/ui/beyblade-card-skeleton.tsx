import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function BeybladeCardSkeleton() {
  return (
    <Card className="overflow-hidden border shadow-sm">
      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-muted/50 via-muted/30 to-transparent">
        <Skeleton className="w-full h-full" />
        <div className="absolute top-3 right-3">
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-1" />
      </CardHeader>
      
      <CardContent className="pt-0">
        <Skeleton className="h-4 w-2/3 mb-3" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}

export function BeybladeCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <BeybladeCardSkeleton key={i} />
      ))}
    </div>
  );
}
