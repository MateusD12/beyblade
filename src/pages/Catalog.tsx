import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { BeybladeCard } from '@/components/BeybladeCard';
import { supabase } from '@/integrations/supabase/client';
import { Beyblade, BeybladeComponents, BeybladeSpecs, BEYBLADE_TYPES } from '@/types/beyblade';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Filter } from 'lucide-react';
import { getBeybladeImageUrl } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TypeBadge } from '@/components/TypeBadge';

export default function Catalog() {
  const [catalog, setCatalog] = useState<Beyblade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedBeyblade, setSelectedBeyblade] = useState<Beyblade | null>(null);

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      const { data, error } = await supabase
        .from('beyblade_catalog')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      
      // Transform the data to match our types
      const transformedData: Beyblade[] = (data || []).map(item => ({
        ...item,
        components: item.components as BeybladeComponents | null,
        specs: item.specs as BeybladeSpecs | null,
      }));
      
      setCatalog(transformedData);
    } catch (error) {
      console.error('Error fetching catalog:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCatalog = catalog.filter(beyblade => {
    const matchesSearch = !searchQuery || 
      beyblade.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      beyblade.series.toLowerCase().includes(searchQuery.toLowerCase()) ||
      beyblade.generation.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || beyblade.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen pb-20 md:pt-20">
      <Navigation />
      
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Catálogo de Beyblades</h1>
          <p className="text-muted-foreground">
            {catalog.length} Beyblades registradas no sistema
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, série..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {BEYBLADE_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredCatalog.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-bold mb-2">
              {catalog.length === 0 ? 'Catálogo vazio' : 'Nenhuma Beyblade encontrada'}
            </h3>
            <p className="text-muted-foreground">
              {catalog.length === 0 
                ? 'O catálogo será preenchido conforme as Beyblades forem registradas'
                : 'Tente outros filtros ou termo de busca'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCatalog.map((beyblade) => (
              <BeybladeCard
                key={beyblade.id}
                beyblade={beyblade}
                onClick={() => setSelectedBeyblade(beyblade)}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedBeyblade} onOpenChange={() => setSelectedBeyblade(null)}>
        <DialogContent className="max-w-lg">
          {selectedBeyblade && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedBeyblade.name}</DialogTitle>
              </DialogHeader>
              
              {selectedBeyblade.image_url && (
                <div className="relative">
                  <img 
                    src={getBeybladeImageUrl(selectedBeyblade.image_url, selectedBeyblade.wiki_url) || ''} 
                    alt={selectedBeyblade.name}
                    className="w-full aspect-square object-cover rounded-lg"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden w-full aspect-square flex-col items-center justify-center rounded-lg bg-muted/50 text-center p-4">
                    <span className="text-4xl mb-2">🖼️</span>
                    <span className="text-sm text-muted-foreground">Imagem indisponível</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TypeBadge type={selectedBeyblade.type} />
                  <span className="text-sm text-muted-foreground">
                    {selectedBeyblade.series} • {selectedBeyblade.generation}
                  </span>
                </div>
                
                {selectedBeyblade.name_hasbro && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Nome Hasbro:</span>{' '}
                    {selectedBeyblade.name_hasbro}
                  </p>
                )}
                
                {selectedBeyblade.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedBeyblade.description}
                  </p>
                )}
                
                {selectedBeyblade.components && (
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {(selectedBeyblade.components as BeybladeComponents).layer && (
                      <div className="p-2 bg-muted rounded-md text-center">
                        <div className="text-muted-foreground text-xs">Layer</div>
                        <div className="font-medium">{(selectedBeyblade.components as BeybladeComponents).layer}</div>
                      </div>
                    )}
                    {(selectedBeyblade.components as BeybladeComponents).disk && (
                      <div className="p-2 bg-muted rounded-md text-center">
                        <div className="text-muted-foreground text-xs">Disk</div>
                        <div className="font-medium">{(selectedBeyblade.components as BeybladeComponents).disk}</div>
                      </div>
                    )}
                    {(selectedBeyblade.components as BeybladeComponents).driver && (
                      <div className="p-2 bg-muted rounded-md text-center">
                        <div className="text-muted-foreground text-xs">Driver</div>
                        <div className="font-medium">{(selectedBeyblade.components as BeybladeComponents).driver}</div>
                      </div>
                    )}
                  </div>
                )}

                {selectedBeyblade.specs && (
                  <div className="flex gap-4 text-sm">
                    {(selectedBeyblade.specs as BeybladeSpecs).attack && (
                      <div>ATK: {(selectedBeyblade.specs as BeybladeSpecs).attack}</div>
                    )}
                    {(selectedBeyblade.specs as BeybladeSpecs).defense && (
                      <div>DEF: {(selectedBeyblade.specs as BeybladeSpecs).defense}</div>
                    )}
                    {(selectedBeyblade.specs as BeybladeSpecs).stamina && (
                      <div>STA: {(selectedBeyblade.specs as BeybladeSpecs).stamina}</div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
