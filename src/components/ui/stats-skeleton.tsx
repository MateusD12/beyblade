import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function StatsTotalSkeleton() {
  return (
    <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
      <CardContent className="pt-6">
        <div className="text-center">
          <Skeleton className="h-12 w-16 mx-auto mb-2" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64 flex items-center justify-center">
            <Skeleton className="w-40 h-40 rounded-full" />
          </div>
          <div className="flex flex-col justify-center gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="flex-1 h-4" />
                <Skeleton className="w-8 h-4" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsSeriesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-24" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsPageSkeleton() {
  return (
    <div className="space-y-6">
      <StatsTotalSkeleton />
      <StatsChartSkeleton />
      <StatsSeriesSkeleton />
    </div>
  );
}
