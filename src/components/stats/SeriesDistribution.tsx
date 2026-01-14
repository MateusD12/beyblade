import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SeriesData {
  name: string;
  value: number;
}

interface SeriesDistributionProps {
  data: SeriesData[];
  total: number;
}

export function SeriesDistribution({ data, total }: SeriesDistributionProps) {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Por Série</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((series) => (
            <div key={series.name} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{series.name}</span>
                  <span className="text-sm font-bold">{series.value}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(series.value / total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
