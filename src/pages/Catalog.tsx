import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Beyblade } from '@/types/beyblade';
import { BeybladeCard } from '@/components/BeybladeCard';
import { BeybladeCardSkeletonGrid } from '@/components/ui/beyblade-card-skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Filter, Plus, ExternalLink, X } from 'lucide-react';
import { toast } from 'sonner';
import { TypeBadge } from '@/components/TypeBadge';
import { getBeybladeImageUrl } from '@/lib/utils';

export default function Catalog() {
  const [beyblades, setBeyblades] = useState<Beyblade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeries, setSelectedSeries] = useState<string>('all');
  const [selectedGeneration, setSelectedGeneration] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedBeyblade, setSelectedBeyblade] = useState<Beyblade | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      const { data, error } = await supabase
        .from('beyblade_catalog')
        .select('*')
        .order('series', { ascending: true })
        .order('generation', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setBeyblades(data as Beyblade[] || []);
    } catch (error) {
      console.error('Error fetching catalog:', error);
      toast.error('Erro ao carregar catálogo');
    } finally {
      setIsLoading(false);
    }
  };

  const { availableSeries, availableGenerations, availableTypes } = useMemo(() => {
    const series = [...new Set(beyblades.map(b => b.series))].sort();
    const generations = [...new Set(beyblades.map(b => b.generation))].sort();
    const types = [...new Set(beyblades.map(b => b.type))].sort();
    return { availableSeries: series, availableGenerations: generations, availableTypes: types };
  }, [beyblades]);

  const filteredBeyblades = useMemo(() => {
    return beyblades.filter(b => {
      const matchesSearch = searchQuery === '' || 
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.name_hasbro?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeries = selectedSeries === 'all' || b.series === selectedSeries;
      const matchesGeneration = selectedGeneration === 'all' || b.generation === selectedGeneration;
      const matchesType = selectedType === 'all' || b.type === selectedType;
      return matchesSearch && matchesSeries && matchesGeneration && matchesType;
    });
  }, [beyblades, searchQuery, selectedSeries, selectedGeneration, selectedType]);

  const handleAddToCollection = async (beyblade: Beyblade) => {
    if (!user) {
      toast.error('Faça login para adicionar à coleção');
      navigate('/auth');
      return;
    }

    setIsAdding(true);
    try {
      // Check if already in collection
      const { data: existing } = await supabase
        .from('user_collection')
        .select('id')
        .eq('user_id', user.id)
        .eq('beyblade_id', beyblade.id)
        .maybeSingle();

      if (existing) {
        toast.info('Esta Beyblade já está na sua coleção');
        return;
      }

      const { error } = await supabase
        .from('user_collection')
        .insert({
          user_id: user.id,
          beyblade_id: beyblade.id,
        });

      if (error) throw error;
      toast.success(`${beyblade.name} adicionada à coleção!`);
      setSelectedBeyblade(null);
    } catch (error) {
      console.error('Error adding to collection:', error);
      toast.error('Erro ao adicionar à coleção');
    } finally {
      setIsAdding(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSeries('all');
    setSelectedGeneration('all');
    setSelectedType('all');
  };

  const hasActiveFilters = searchQuery || selectedSeries !== 'all' || selectedGeneration !== 'all' || selectedType !== 'all';

  return (
    <div className="min-h-screen pb-20 md:pt-20">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Catálogo de Beyblades</h1>
          <p className="text-muted-foreground">
            {beyblades.length} Beyblades cadastradas
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={selectedSeries} onValueChange={setSelectedSeries}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Série" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as séries</SelectItem>
                {availableSeries.map(series => (
                  <SelectItem key={series} value={series}>{series}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedGeneration} onValueChange={setSelectedGeneration}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Geração" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as gerações</SelectItem>
                {availableGenerations.map(gen => (
                  <SelectItem key={gen} value={gen}>{gen}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {availableTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Limpar filtros
              </Button>
            )}
          </div>

          {hasActiveFilters && (
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredBeyblades.length} de {beyblades.length} Beyblades
            </p>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <BeybladeCardSkeletonGrid count={12} />
        ) : filteredBeyblades.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma Beyblade encontrada</h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros de busca
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredBeyblades.map(beyblade => (
              <BeybladeCard
                key={beyblade.id}
                beyblade={beyblade}
                onClick={() => setSelectedBeyblade(beyblade)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedBeyblade} onOpenChange={() => setSelectedBeyblade(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedBeyblade && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  {selectedBeyblade.name}
                  <TypeBadge type={selectedBeyblade.type} />
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {selectedBeyblade.image_url && (
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={getBeybladeImageUrl(selectedBeyblade.image_url, selectedBeyblade.wiki_url)}
                      alt={selectedBeyblade.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Série:</span>
                    <p className="font-medium">{selectedBeyblade.series}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Geração:</span>
                    <p className="font-medium">{selectedBeyblade.generation}</p>
                  </div>
                </div>

                {selectedBeyblade.name_hasbro && selectedBeyblade.name_hasbro !== selectedBeyblade.name && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Nome Hasbro:</span>
                    <p className="font-medium">{selectedBeyblade.name_hasbro}</p>
                  </div>
                )}

                {selectedBeyblade.description && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Descrição:</span>
                    <p className="mt-1">{selectedBeyblade.description}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button 
                    className="flex-1"
                    onClick={() => handleAddToCollection(selectedBeyblade)}
                    disabled={isAdding}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {isAdding ? 'Adicionando...' : 'Adicionar à Coleção'}
                  </Button>
                  
                  {selectedBeyblade.wiki_url && (
                    <Button variant="outline" size="icon" asChild>
                      <a href={selectedBeyblade.wiki_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
