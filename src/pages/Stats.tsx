import { Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';
import { useStats } from '@/hooks/useStats';
import { Button } from '@/components/ui/button';
import { StatsPageSkeleton } from '@/components/ui/stats-skeleton';
import { TotalCard } from '@/components/stats/TotalCard';
import { TypeDistributionChart } from '@/components/stats/TypeDistributionChart';
import { GenerationChart } from '@/components/stats/GenerationChart';
import { AcquisitionTimeline } from '@/components/stats/AcquisitionTimeline';
import { TopComponents } from '@/components/stats/TopComponents';
import { CollectionGoal } from '@/components/stats/CollectionGoal';
import { UserComparison } from '@/components/stats/UserComparison';
import { SeriesDistribution } from '@/components/stats/SeriesDistribution';

export default function Stats() {
  const { user } = useAuth();
  const { stats, isLoading } = useStats();

  if (!user) {
    return (
      <div className="min-h-screen pb-20 md:pt-20">
        <Navigation />
        <div className="max-w-6xl mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-bold mb-2">Faça login para ver estatísticas</h2>
          <p className="text-muted-foreground text-center mb-4">
            Veja estatísticas detalhadas da sua coleção.
          </p>
          <Link to="/auth">
            <Button>Fazer Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pt-20">
      <Navigation />
      
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Estatísticas</h1>
          <p className="text-muted-foreground">
            Visão geral da sua coleção
          </p>
        </div>

        {isLoading ? (
          <StatsPageSkeleton />
        ) : !stats || stats.total === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Sem dados ainda</h3>
            <p className="text-muted-foreground mb-4">
              Adicione Beyblades à sua coleção para ver estatísticas.
            </p>
            <Link to="/register">
              <Button>Adicionar Beyblade</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top row: Total + Collection Goal + User Comparison */}
            <div className="grid md:grid-cols-3 gap-4">
              <TotalCard total={stats.total} />
              <CollectionGoal 
                userCount={stats.collectionGoal.userCount}
                totalCatalog={stats.collectionGoal.totalCatalog}
                percentage={stats.collectionGoal.percentage}
              />
              <UserComparison 
                userCount={stats.userComparison.userCount}
                averageCount={stats.userComparison.averageCount}
                percentile={stats.userComparison.percentile}
              />
            </div>

            {/* Type Distribution */}
            {stats.byType.length > 0 && (
              <TypeDistributionChart data={stats.byType} />
            )}

            {/* Generation + Timeline */}
            <div className="grid md:grid-cols-2 gap-4">
              {stats.byGeneration.length > 0 && (
                <GenerationChart data={stats.byGeneration} />
              )}
              <AcquisitionTimeline data={stats.timeline} />
            </div>

            {/* Components + Series */}
            <div className="grid md:grid-cols-2 gap-4">
              <TopComponents data={stats.topComponents} />
              <SeriesDistribution data={stats.bySeries} total={stats.total} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
