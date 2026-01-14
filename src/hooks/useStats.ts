import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BeybladeComponents } from '@/types/beyblade';

const STATS_QUERY_KEY = 'stats';
const STALE_TIME = 5 * 60 * 1000;

interface TypeData {
  name: string;
  value: number;
  color: string;
}

interface SeriesData {
  name: string;
  value: number;
}

interface GenerationData {
  name: string;
  value: number;
}

interface TimelineData {
  date: string;
  count: number;
  cumulative: number;
}

interface ComponentData {
  name: string;
  count: number;
  type: 'blade' | 'ratchet' | 'bit';
}

interface CollectionGoal {
  userCount: number;
  totalCatalog: number;
  percentage: number;
}

interface UserComparison {
  userCount: number;
  averageCount: number;
  percentile: number;
}

export interface StatsData {
  total: number;
  byType: TypeData[];
  bySeries: SeriesData[];
  byGeneration: GenerationData[];
  timeline: TimelineData[];
  topComponents: ComponentData[];
  collectionGoal: CollectionGoal;
  userComparison: UserComparison;
}

const TYPE_CHART_COLORS: Record<string, string> = {
  Ataque: '#ef4444',
  Defesa: '#3b82f6',
  Stamina: '#22c55e',
  Equilíbrio: '#a855f7',
};

async function fetchStats(userId: string): Promise<StatsData> {
  // Fetch user collection with beyblade details
  const { data: collection, error: collectionError } = await supabase
    .from('user_collection')
    .select(`
      *,
      beyblade:beyblade_catalog(type, series, generation, components)
    `)
    .eq('user_id', userId);

  if (collectionError) throw collectionError;

  // Fetch total catalog count
  const { count: catalogCount } = await supabase
    .from('beyblade_catalog')
    .select('*', { count: 'exact', head: true });

  // Fetch all users' collection counts for comparison
  const { data: allUsers } = await supabase
    .from('user_collection')
    .select('user_id');

  const total = collection?.length || 0;
  
  // Count by type
  const typeCounts: Record<string, number> = {};
  const seriesCounts: Record<string, number> = {};
  const generationCounts: Record<string, number> = {};
  const componentCounts: Record<string, { count: number; type: 'blade' | 'ratchet' | 'bit' }> = {};
  const dateAcquisitions: Record<string, number> = {};

  collection?.forEach(item => {
    if (item.beyblade) {
      const beyblade = item.beyblade as { 
        type: string; 
        series: string; 
        generation: string;
        components: BeybladeComponents | null;
      };
      
      typeCounts[beyblade.type] = (typeCounts[beyblade.type] || 0) + 1;
      seriesCounts[beyblade.series] = (seriesCounts[beyblade.series] || 0) + 1;
      generationCounts[beyblade.generation] = (generationCounts[beyblade.generation] || 0) + 1;
      
      // Count components
      if (beyblade.components) {
        if (beyblade.components.blade) {
          const blade = beyblade.components.blade;
          componentCounts[blade] = componentCounts[blade] || { count: 0, type: 'blade' };
          componentCounts[blade].count++;
        }
        if (beyblade.components.ratchet) {
          const ratchet = beyblade.components.ratchet;
          componentCounts[ratchet] = componentCounts[ratchet] || { count: 0, type: 'ratchet' };
          componentCounts[ratchet].count++;
        }
        if (beyblade.components.bit) {
          const bit = beyblade.components.bit;
          componentCounts[bit] = componentCounts[bit] || { count: 0, type: 'bit' };
          componentCounts[bit].count++;
        }
      }
    }
    
    // Track acquisitions by date
    const acquiredDate = item.acquired_at || item.created_at?.split('T')[0];
    if (acquiredDate) {
      const dateKey = acquiredDate.split('T')[0];
      dateAcquisitions[dateKey] = (dateAcquisitions[dateKey] || 0) + 1;
    }
  });

  // Build type data
  const byType = Object.entries(typeCounts).map(([name, value]) => ({
    name,
    value,
    color: TYPE_CHART_COLORS[name] || '#888',
  }));

  // Build series data
  const bySeries = Object.entries(seriesCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Build generation data
  const byGeneration = Object.entries(generationCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Build timeline data
  const sortedDates = Object.keys(dateAcquisitions).sort();
  let cumulative = 0;
  const timeline = sortedDates.map(date => {
    cumulative += dateAcquisitions[date];
    return {
      date,
      count: dateAcquisitions[date],
      cumulative,
    };
  });

  // Build top components
  const topComponents = Object.entries(componentCounts)
    .map(([name, data]) => ({ name, count: data.count, type: data.type }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Calculate collection goal
  const totalCatalog = catalogCount || 0;
  const collectionGoal: CollectionGoal = {
    userCount: total,
    totalCatalog,
    percentage: totalCatalog > 0 ? Math.round((total / totalCatalog) * 100) : 0,
  };

  // Calculate user comparison
  const userCollectionCounts: Record<string, number> = {};
  allUsers?.forEach(u => {
    userCollectionCounts[u.user_id] = (userCollectionCounts[u.user_id] || 0) + 1;
  });
  
  const allCounts = Object.values(userCollectionCounts);
  const totalUsers = allCounts.length;
  const averageCount = totalUsers > 0 
    ? Math.round(allCounts.reduce((a, b) => a + b, 0) / totalUsers) 
    : 0;
  
  const usersWithLess = allCounts.filter(c => c < total).length;
  const percentile = totalUsers > 1 
    ? Math.round((usersWithLess / (totalUsers - 1)) * 100) 
    : 100;

  const userComparison: UserComparison = {
    userCount: total,
    averageCount,
    percentile,
  };

  return {
    total,
    byType,
    bySeries,
    byGeneration,
    timeline,
    topComponents,
    collectionGoal,
    userComparison,
  };
}

export function useStats() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: [STATS_QUERY_KEY, user?.id],
    queryFn: () => fetchStats(user!.id),
    enabled: !!user,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: true,
  });

  return {
    stats: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
