import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Beyblade, BeybladeComponents, BeybladeSpecs } from '@/types/beyblade';

const CATALOG_QUERY_KEY = 'catalog';
const STALE_TIME = 10 * 60 * 1000; // 10 minutes - catalog changes less frequently

async function fetchCatalog(): Promise<Beyblade[]> {
  const { data, error } = await supabase
    .from('beyblade_catalog')
    .select('*')
    .order('series', { ascending: true })
    .order('generation', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;

  return (data || []).map(item => ({
    ...item,
    components: item.components as BeybladeComponents | null,
    specs: item.specs as BeybladeSpecs | null,
  }));
}

export function useCatalog() {
  const query = useQuery({
    queryKey: [CATALOG_QUERY_KEY],
    queryFn: fetchCatalog,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false, // Catalog doesn't change often
  });

  return {
    catalog: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

// Hook to get unique values for filters
export function useCatalogFilters() {
  const { catalog, isLoading } = useCatalog();

  const series = [...new Set(catalog.map(b => b.series))].sort();
  const generations = [...new Set(catalog.map(b => b.generation))].sort();
  const types = [...new Set(catalog.map(b => b.type))].sort();

  return {
    series,
    generations,
    types,
    isLoading,
  };
}
