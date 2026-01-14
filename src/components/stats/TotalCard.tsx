import { Card, CardContent } from '@/components/ui/card';

interface TotalCardProps {
  total: number;
}

export function TotalCard({ total }: TotalCardProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
      <CardContent className="pt-6">
        <div className="text-center">
          <div className="text-5xl font-bold text-primary mb-2">
            {total}
          </div>
          <p className="text-muted-foreground">
            {total === 1 ? 'Beyblade na coleção' : 'Beyblades na coleção'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
