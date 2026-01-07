import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { BeybladeCard } from '@/components/BeybladeCard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CollectionItem, Beyblade, BeybladeComponents, BeybladeSpecs } from '@/types/beyblade';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, PlusCircle, Trash2, Target, Shield, Zap } from 'lucide-react';
import { getBeybladeImageUrl } from '@/lib/utils';
import { getSeriesOrder, getGenerationOrder } from '@/lib/beybladeOrder';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { TypeBadge } from '@/components/TypeBadge';
import { SpinDirectionSelector, SpinDirection } from '@/components/SpinDirectionSelector';
import { useToast } from '@/hooks/use-toast';

export default function Collection() {
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeries, setFilterSeries] = useState<string>('all');
  const [filterGeneration, setFilterGeneration] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<CollectionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchCollection();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Reset generation filter when series changes
  useEffect(() => {
    setFilterGeneration('all');
  }, [filterSeries]);

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
      
      const transformedData: CollectionItem[] = (data || []).map(item => ({
        ...item,
        spin_direction: item.spin_direction as 'L' | 'R' | 'R/L' | null,
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

  const handleDeleteFromCollection = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('user_collection')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;

      setCollection(prev => prev.filter(item => item.id !== itemToDelete.id));
      setSelectedItem(null);
      setItemToDelete(null);
      
      toast({
        title: "Removido da coleção",
        description: `${itemToDelete.beyblade?.name} foi removido da sua coleção.`,
      });
    } catch (error) {
      console.error('Error deleting from collection:', error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover da coleção. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const updateSpinDirection = async (collectionId: string, direction: SpinDirection) => {
    try {
      const { error } = await supabase
        .from('user_collection')
        .update({ spin_direction: direction })
        .eq('id', collectionId);

      if (error) throw error;

      setCollection(prev => prev.map(item => 
        item.id === collectionId 
          ? { ...item, spin_direction: direction } 
          : item
      ));
      
      if (selectedItem?.id === collectionId) {
        setSelectedItem(prev => prev ? { ...prev, spin_direction: direction } : null);
      }
      
      toast({
        title: "Direção atualizada",
        description: `Direção de rotação alterada para ${direction}`,
      });
    } catch (error) {
      console.error('Error updating spin direction:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a direção de rotação.",
        variant: "destructive",
      });
    }
  };

  // Extract unique series from user's collection
  const availableSeries = useMemo(() => {
    const series = new Set(
      collection
        .map(item => item.beyblade?.series)
        .filter((s): s is string => Boolean(s))
    );
    return Array.from(series).sort((a, b) => getSeriesOrder(a) - getSeriesOrder(b));
  }, [collection]);

  // Extract unique generations based on selected series
  const availableGenerations = useMemo(() => {
    const generations = new Set(
      collection
        .filter(item => filterSeries === 'all' || item.beyblade?.series === filterSeries)
        .map(item => item.beyblade?.generation)
        .filter((g): g is string => Boolean(g))
    );
    return Array.from(generations).sort((a, b) => getGenerationOrder(a) - getGenerationOrder(b));
  }, [collection, filterSeries]);

  // Group and sort collection hierarchically
  const groupedCollection = useMemo(() => {
    const filtered = collection.filter(item => {
      if (!item.beyblade) return false;
      if (filterSeries !== 'all' && item.beyblade.series !== filterSeries) return false;
      if (filterGeneration !== 'all' && item.beyblade.generation !== filterGeneration) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = item.beyblade.name.toLowerCase().includes(q);
        const customNameMatch = item.custom_name?.toLowerCase().includes(q);
        if (!nameMatch && !customNameMatch) return false;
      }
      return true;
    });

    // Group by series
    const bySeries = new Map<string, Map<string, CollectionItem[]>>();
    
    for (const item of filtered) {
      const series = item.beyblade!.series;
      const gen = item.beyblade!.generation;
      
      if (!bySeries.has(series)) bySeries.set(series, new Map());
      const byGen = bySeries.get(series)!;
      if (!byGen.has(gen)) byGen.set(gen, []);
      byGen.get(gen)!.push(item);
    }

    // Sort by series (newest first)
    const sortedSeries = Array.from(bySeries.entries())
      .sort((a, b) => getSeriesOrder(a[0]) - getSeriesOrder(b[0]));

    // Sort generations and beyblades within each series
    return sortedSeries.map(([series, genMap]) => ({
      series,
      generations: Array.from(genMap.entries())
        .sort((a, b) => getGenerationOrder(a[0]) - getGenerationOrder(b[0]))
        .map(([gen, items]) => ({
          generation: gen,
          items: items.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ),
        })),
    }));
  }, [collection, filterSeries, filterGeneration, searchQuery]);

  // Total filtered count
  const filteredCount = useMemo(() => {
    return groupedCollection.reduce(
      (acc, s) => acc + s.generations.reduce((gAcc, g) => gAcc + g.items.length, 0),
      0
    );
  }, [groupedCollection]);

  // Helper to get component names
  const getBladeComponent = (components: BeybladeComponents) => components.blade || components.layer;
  const getRatchetComponent = (components: BeybladeComponents) => components.ratchet || components.disk;
  const getBitComponent = (components: BeybladeComponents) => components.bit || components.driver;

  // Get the image to display
  const getDisplayImage = (item: CollectionItem) => {
    if (item.photo_url) return item.photo_url;
    if (item.beyblade?.image_url) {
      return getBeybladeImageUrl(item.beyblade.image_url, item.beyblade.wiki_url);
    }
    return null;
  };

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
              {filteredCount} {filteredCount === 1 ? 'Beyblade' : 'Beyblades'}
              {filteredCount !== collection.length && ` (de ${collection.length})`}
            </p>
          </div>
          
          <Link to="/register">
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={filterSeries} onValueChange={setFilterSeries}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Série" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Séries</SelectItem>
              {availableSeries.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterGeneration} onValueChange={setFilterGeneration}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Geração" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Gerações</SelectItem>
              {availableGenerations.map(g => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : groupedCollection.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌀</div>
            <h3 className="text-xl font-bold mb-2">
              {searchQuery || filterSeries !== 'all' || filterGeneration !== 'all' 
                ? 'Nenhuma Beyblade encontrada' 
                : 'Coleção vazia'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterSeries !== 'all' || filterGeneration !== 'all'
                ? 'Tente outros filtros de busca' 
                : 'Comece adicionando sua primeira Beyblade!'}
            </p>
            {!searchQuery && filterSeries === 'all' && filterGeneration === 'all' && (
              <Link to="/register">
                <Button>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Adicionar Beyblade
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <Accordion 
            type="multiple" 
            defaultValue={groupedCollection.map(s => s.series)}
            className="space-y-4"
          >
            {groupedCollection.map(({ series, generations }) => (
              <AccordionItem key={series} value={series} className="border rounded-lg px-4">
                <AccordionTrigger className="text-lg font-bold hover:no-underline">
                  <div className="flex items-center gap-2">
                    {series}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({generations.reduce((acc, g) => acc + g.items.length, 0)})
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Accordion 
                    type="multiple" 
                    defaultValue={generations.map(g => g.generation)}
                    className="space-y-2"
                  >
                    {generations.map(({ generation, items }) => (
                      <AccordionItem key={generation} value={generation} className="border rounded-md px-3">
                        <AccordionTrigger className="text-base font-semibold hover:no-underline py-3">
                          <div className="flex items-center gap-2">
                            {generation}
                            <span className="text-sm font-normal text-muted-foreground">
                              ({items.length})
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-2">
                            {items.map(item => (
                              item.beyblade && (
                                <BeybladeCard
                                  key={item.id}
                                  beyblade={item.beyblade}
                                  photoUrl={item.photo_url}
                                  spinDirection={item.spin_direction}
                                  onClick={() => setSelectedItem(item)}
                                />
                              )
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedItem?.beyblade && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedItem.beyblade.name}</DialogTitle>
              </DialogHeader>
              
              {/* Image */}
              {getDisplayImage(selectedItem) && (
                <div className="flex justify-center">
                  <img 
                    src={getDisplayImage(selectedItem)!} 
                    alt={selectedItem.beyblade.name}
                    className="w-full max-w-xs aspect-square object-contain rounded-lg bg-muted/50"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden w-full max-w-xs aspect-square flex-col items-center justify-center rounded-lg bg-muted/50 text-center p-4">
                    <span className="text-4xl mb-2">🖼️</span>
                    <span className="text-sm text-muted-foreground">Imagem indisponível</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {/* Type and Series */}
                <div className="flex flex-wrap items-center gap-2">
                  <TypeBadge type={selectedItem.beyblade.type} />
                  <span className="text-sm text-muted-foreground">
                    {selectedItem.beyblade.series} • {selectedItem.beyblade.generation}
                  </span>
                </div>
                
                {/* Description */}
                {selectedItem.beyblade.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedItem.beyblade.description}
                  </p>
                )}
                
                {/* Components */}
                {selectedItem.beyblade.components && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Componentes</h4>
                    <div className="space-y-2 text-sm">
                      {getBladeComponent(selectedItem.beyblade.components as BeybladeComponents) && (
                        <div className="p-3 bg-muted rounded-md">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-muted-foreground">🔷 Lâmina:</span>
                            <span className="font-medium">
                              {getBladeComponent(selectedItem.beyblade.components as BeybladeComponents)}
                            </span>
                          </div>
                          {(selectedItem.beyblade.components as any).descriptions?.blade && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {(selectedItem.beyblade.components as any).descriptions.blade}
                            </p>
                          )}
                        </div>
                      )}
                      {getRatchetComponent(selectedItem.beyblade.components as BeybladeComponents) && (
                        <div className="p-3 bg-muted rounded-md">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-muted-foreground">🔷 Catraca:</span>
                            <span className="font-medium">
                              {getRatchetComponent(selectedItem.beyblade.components as BeybladeComponents)}
                            </span>
                          </div>
                          {(selectedItem.beyblade.components as any).descriptions?.ratchet && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {(selectedItem.beyblade.components as any).descriptions.ratchet}
                            </p>
                          )}
                        </div>
                      )}
                      {getBitComponent(selectedItem.beyblade.components as BeybladeComponents) && (
                        <div className="p-3 bg-muted rounded-md">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-muted-foreground">🔷 Ponteira:</span>
                            <span className="font-medium">
                              {getBitComponent(selectedItem.beyblade.components as BeybladeComponents)}
                            </span>
                          </div>
                          {(selectedItem.beyblade.components as any).descriptions?.bit && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {(selectedItem.beyblade.components as any).descriptions.bit}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Specs */}
                {selectedItem.beyblade.specs && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Especificações</h4>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {(selectedItem.beyblade.specs as BeybladeSpecs).attack && (
                        <div className="flex items-center gap-1.5">
                          <Target className="w-4 h-4 text-red-500" />
                          <span>Ataque: {(selectedItem.beyblade.specs as BeybladeSpecs).attack}</span>
                        </div>
                      )}
                      {(selectedItem.beyblade.specs as BeybladeSpecs).defense && (
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-4 h-4 text-blue-500" />
                          <span>Defesa: {(selectedItem.beyblade.specs as BeybladeSpecs).defense}</span>
                        </div>
                      )}
                      {(selectedItem.beyblade.specs as BeybladeSpecs).stamina && (
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-green-500" />
                          <span>Resistência: {(selectedItem.beyblade.specs as BeybladeSpecs).stamina}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Spin Direction */}
                <SpinDirectionSelector
                  value={selectedItem.spin_direction}
                  onChange={(direction) => updateSpinDirection(selectedItem.id, direction)}
                />

                {/* Delete Button */}
                <div className="pt-4 border-t">
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => setItemToDelete(selectedItem)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir da Coleção
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir da coleção?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{itemToDelete?.beyblade?.name}</strong> da sua coleção? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteFromCollection}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
