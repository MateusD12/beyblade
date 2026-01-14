import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target } from 'lucide-react';

interface CollectionGoalProps {
  userCount: number;
  totalCatalog: number;
  percentage: number;
}

export function CollectionGoal({ userCount, totalCatalog, percentage }: CollectionGoalProps) {
  const getMessage = () => {
    if (percentage === 100) return '🎉 Coleção completa!';
    if (percentage >= 75) return '🔥 Quase lá!';
    if (percentage >= 50) return '💪 Mais da metade!';
    if (percentage >= 25) return '📈 Bom progresso!';
    return '🚀 Comece sua jornada!';
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Meta de Coleção
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Progresso</span>
            </div>
            <span className="text-2xl font-bold text-primary">{percentage}%</span>
          </div>
          
          <Progress value={percentage} className="h-3" />
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Você tem <span className="font-bold text-foreground">{userCount}</span> de{' '}
              <span className="font-bold text-foreground">{totalCatalog}</span> Beyblades
            </span>
          </div>
          
          <div className="text-center pt-2 text-sm font-medium">
            {getMessage()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
