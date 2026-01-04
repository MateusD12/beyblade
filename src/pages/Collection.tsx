import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { BeybladeCard } from '@/components/BeybladeCard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CollectionItem, Beyblade, BeybladeComponents, BeybladeSpecs } from '@/types/beyblade';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TypeBadge } from '@/components/TypeBadge';

export default function Collection() {
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCollection();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchCollection = async () => {
    try {
      const { data, error } = await supabase
        .from('user_collection')
        .select(`
          *,
          beyblade:beyblade_catalog(*)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our types
      const transformedData: CollectionItem[] = (data || []).map(item => ({
        ...item,
        beyblade: item.beyblade ? {
          ...item.beyblade,
          components: item.beyblade.components as BeybladeComponents | null,
          specs: item.beyblade.specs as BeybladeSpecs | null,
        } : undefined,
      }));
      
      setCollection(transformedData);
    } catch (error) {
      console.error('Error fetching collection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCollection = collection.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.beyblade?.name.toLowerCase().includes(query) ||
      item.beyblade?.series.toLowerCase().includes(query) ||
      item.custom_name?.toLowerCase().includes(query)
    );
  });

  if (!user) {
    return (
      <div className="min-h-screen pb-20 md:pt-20">
        <Navigation />
        <div className="max-w-6xl mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2">Faça login para ver sua coleção</h2>
          <p className="text-muted-foreground text-center mb-4">
            Crie uma conta para começar a colecionar Beyblades.
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Minha Coleção</h1>
            <p className="text-muted-foreground">
              {collection.length} {collection.length === 1 ? 'Beyblade' : 'Beyblades'}
            </p>
          </div>
          
          <div className="flex gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Link to="/register">
              <Button>
                <PlusCircle className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredCollection.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌀</div>
            <h3 className="text-xl font-bold mb-2">
              {searchQuery ? 'Nenhuma Beyblade encontrada' : 'Coleção vazia'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? 'Tente outro termo de busca' 
                : 'Comece adicionando sua primeira Beyblade!'}
            </p>
            {!searchQuery && (
              <Link to="/register">
                <Button>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Adicionar Beyblade
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCollection.map((item) => (
              item.beyblade && (
                <BeybladeCard
                  key={item.id}
                  beyblade={item.beyblade}
                  photoUrl={item.photo_url}
                  onClick={() => setSelectedItem(item)}
                />
              )
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-lg">
          {selectedItem?.beyblade && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedItem.beyblade.name}</DialogTitle>
              </DialogHeader>
              
              {selectedItem.photo_url && (
                <img 
                  src={selectedItem.photo_url} 
                  alt={selectedItem.beyblade.name}
                  className="w-full aspect-square object-cover rounded-lg"
                />
              )}
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TypeBadge type={selectedItem.beyblade.type} />
                  <span className="text-sm text-muted-foreground">
                    {selectedItem.beyblade.series} • {selectedItem.beyblade.generation}
                  </span>
                </div>
                
                {selectedItem.beyblade.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedItem.beyblade.description}
                  </p>
                )}
                
                {selectedItem.beyblade.components && (
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {(selectedItem.beyblade.components as BeybladeComponents).layer && (
                      <div className="p-2 bg-muted rounded-md text-center">
                        <div className="text-muted-foreground text-xs">Layer</div>
                        <div className="font-medium">{(selectedItem.beyblade.components as BeybladeComponents).layer}</div>
                      </div>
                    )}
                    {(selectedItem.beyblade.components as BeybladeComponents).disk && (
                      <div className="p-2 bg-muted rounded-md text-center">
                        <div className="text-muted-foreground text-xs">Disk</div>
                        <div className="font-medium">{(selectedItem.beyblade.components as BeybladeComponents).disk}</div>
                      </div>
                    )}
                    {(selectedItem.beyblade.components as BeybladeComponents).driver && (
                      <div className="p-2 bg-muted rounded-md text-center">
                        <div className="text-muted-foreground text-xs">Driver</div>
                        <div className="font-medium">{(selectedItem.beyblade.components as BeybladeComponents).driver}</div>
                      </div>
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
