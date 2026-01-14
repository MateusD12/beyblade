import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Award } from 'lucide-react';

interface UserComparisonProps {
  userCount: number;
  averageCount: number;
  percentile: number;
}

export function UserComparison({ userCount, averageCount, percentile }: UserComparisonProps) {
  const difference = userCount - averageCount;
  const isAboveAverage = difference > 0;
  
  const getPercentileMessage = () => {
    if (percentile >= 90) return { icon: '🏆', text: 'Top 10%!' };
    if (percentile >= 75) return { icon: '🥈', text: 'Top 25%!' };
    if (percentile >= 50) return { icon: '📊', text: 'Acima da média!' };
    return { icon: '📈', text: 'Continue crescendo!' };
  };

  const message = getPercentileMessage();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Comparação com Outros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{userCount}</div>
            <div className="text-xs text-muted-foreground">Sua coleção</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{averageCount}</div>
            <div className="text-xs text-muted-foreground">Média geral</div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/10">
          <span className="text-xl">{message.icon}</span>
          <div className="text-center">
            <div className="text-sm font-medium">{message.text}</div>
            {isAboveAverage ? (
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-green-500">+{difference}</span> acima da média
              </div>
            ) : difference < 0 ? (
              <div className="text-xs text-muted-foreground">
                {Math.abs(difference)} abaixo da média
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Na média!
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
