import { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { BeybladeCard } from '@/components/BeybladeCard';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useCollection';
import { CollectionItem, BeybladeComponents, BeybladeSpecs } from '@/types/beyblade';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, Trash2, Target, Shield, Zap, Camera, Loader2 } from 'lucide-react';
import { getBeybladeImageUrl } from '@/lib/utils';
import { getSeriesOrder, getGenerationOrder } from '@/lib/beybladeOrder';
import { normalizeSeries, normalizeGeneration } from '@/lib/beybladeNormalization';
import { BeybladeCardSkeletonGrid } from '@/components/ui/beyblade-card-skeleton';
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

export default function Collection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeries, setFilterSeries] = useState<string>('all');
  const [filterGeneration, setFilterGeneration] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<CollectionItem | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  
  const {
    collection,
    isLoading,
    deleteItem,
    isDeleting,
    updateSpinDirection,
    updatePhoto,
    isUploadingPhoto,
  } = useCollection();

  // Reset generation filter when series changes
  const handleSeriesChange = (value: string) => {
    setFilterSeries(value);
    setFilterGeneration('all');
  };

  const handleDeleteFromCollection = async () => {
    if (!itemToDelete) return;
    
    deleteItem(itemToDelete.id, {
      onSuccess: () => {
        setSelectedItem(null);
        setItemToDelete(null);
      },
    });
  };

  const handleSpinDirectionChange = (direction: SpinDirection) => {
    if (!selectedItem) return;
    updateSpinDirection(
      { collectionId: selectedItem.id, direction },
      {
        onSuccess: () => {
          setSelectedItem(prev => prev ? { ...prev, spin_direction: direction } : null);
        },
      }
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedItem) return;
    
    updatePhoto(
      { collectionId: selectedItem.id, file },
      {
        onSuccess: ({ photoUrl }) => {
          setSelectedItem(prev => prev ? { ...prev, photo_url: photoUrl } : null);
        },
      }
    );
    
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  // Extract unique series from user's collection (normalized)
  const availableSeries = useMemo(() => {
    const series = new Set(
      collection
        .map(item => item.beyblade?.series ? normalizeSeries(item.beyblade.series) : null)
        .filter((s): s is string => Boolean(s))
    );
    return Array.from(series).sort((a, b) => getSeriesOrder(a) - getSeriesOrder(b));
  }, [collection]);

  // Extract unique generations based on selected series (normalized)
  const availableGenerations = useMemo(() => {
    const generations = new Set(
      collection
        .filter(item => {
          if (filterSeries === 'all') return true;
          const normalizedSeries = item.beyblade?.series ? normalizeSeries(item.beyblade.series) : null;
          return normalizedSeries === filterSeries;
        })
        .map(item => item.beyblade?.generation ? normalizeGeneration(item.beyblade.generation) : null)
        .filter((g): g is string => Boolean(g))
    );
    return Array.from(generations).sort((a, b) => getGenerationOrder(a) - getGenerationOrder(b));
  }, [collection, filterSeries]);

  // Group and sort collection hierarchically using normalized names
  const groupedCollection = useMemo(() => {
    const filtered = collection.filter(item => {
      if (!item.beyblade) return false;
      
      const normalizedSeries = normalizeSeries(item.beyblade.series);
      const normalizedGeneration = normalizeGeneration(item.beyblade.generation);
      
      if (filterSeries !== 'all' && normalizedSeries !== filterSeries) return false;
      if (filterGeneration !== 'all' && normalizedGeneration !== filterGeneration) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = item.beyblade.name.toLowerCase().includes(q);
        const customNameMatch = item.custom_name?.toLowerCase().includes(q);
        if (!nameMatch && !customNameMatch) return false;
      }
      return true;
    });

    const bySeries = new Map<string, Map<string, CollectionItem[]>>();
    
    for (const item of filtered) {
      const series = normalizeSeries(item.beyblade!.series);
      const gen = normalizeGeneration(item.beyblade!.generation);
      
      if (!bySeries.has(series)) bySeries.set(series, new Map());
      const byGen = bySeries.get(series)!;
      if (!byGen.has(gen)) byGen.set(gen, []);
      byGen.get(gen)!.push(item);
    }

    const sortedSeries = Array.from(bySeries.entries())
      .sort((a, b) => getSeriesOrder(a[0]) - getSeriesOrder(b[0]));

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

  const filteredCount = useMemo(() => {
    return groupedCollection.reduce(
      (acc, s) => acc + s.generations.reduce((gAcc, g) => gAcc + g.items.length, 0),
      0
    );
  }, [groupedCollection]);

  const COMPONENT_LABELS: Record<string, string> = {
    blade: 'Lâmina',
    ratchet: 'Catraca',
    bit: 'Ponteira',
    layer: 'Camada',
    disk: 'Disco',
    driver: 'Driver',
    energy_layer: 'Camada de Energia',
    strike_chip: 'Strike Chip',
    gravity_ring: 'Anel de Gravidade',
    forge_disc: 'Disco Forjado',
    performance_tip: 'Ponta de Desempenho',
    armor_tip: 'Ponta de Armadura',
    fusion_ring: 'Anel de Fusão',
    face_bolt: 'Parafuso Facial',
    energy_ring: 'Anel de Energia',
    fusion_wheel: 'Roda de Fusão',
    spin_track: 'Trilho de Giro',
  };

  const renderDynamicComponents = (components: BeybladeComponents) => {
    const descriptions = (components as any)?.descriptions || {};
    
    return Object.entries(components)
      .filter(([key, value]) => {
        if (key === 'descriptions') return false;
        if (!value || typeof value !== 'string') return false;
        const lowerValue = value.toLowerCase();
        if (lowerValue.includes('não aplicável') || lowerValue.includes('nao aplicavel')) return false;
        return true;
      })
      .map(([key, value]) => (
        <div key={key} className="p-3 bg-muted rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-muted-foreground">🔷 {COMPONENT_LABELS[key] || key}:</span>
            <span className="font-medium">{value as string}</span>
          </div>
          {descriptions[key] && (
            <p className="text-xs text-muted-foreground mt-1">{descriptions[key]}</p>
          )}
        </div>
      ));
  };

  const getDisplayImage = (item: CollectionItem) => {
    if (item.photo_url) return item.photo_url;
    if (item.beyblade?.image_url) {
      const wikiUrl = item.beyblade.wiki_url || 
        (item.beyblade.name ? `https://beyblade.fandom.com/wiki/${item.beyblade.name.replace(/\s+/g, "_")}` : null);
      return getBeybladeImageUrl(item.beyblade.image_url, wikiUrl);
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
          
          <Select value={filterSeries} onValueChange={handleSeriesChange}>
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
          <div className="space-y-6">
            <div className="rounded-xl overflow-hidden shadow-md bg-card p-5">
              <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
              <BeybladeCardSkeletonGrid count={4} />
            </div>
            <div className="rounded-xl overflow-hidden shadow-md bg-card p-5">
              <div className="h-8 w-36 bg-muted animate-pulse rounded mb-4" />
              <BeybladeCardSkeletonGrid count={3} />
            </div>
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
            className="space-y-6"
          >
            {groupedCollection.map(({ series, generations }) => {
              const totalInSeries = generations.reduce((acc, g) => acc + g.items.length, 0);
              return (
                <AccordionItem 
                  key={series} 
                  value={series} 
                  className="border-0 rounded-xl overflow-hidden shadow-md bg-card"
                >
                  <AccordionTrigger className="text-lg font-bold hover:no-underline px-5 py-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shadow-inner">
                        <span className="text-xl">🌀</span>
                      </div>
                      <div className="text-left">
                        <span className="block">{series}</span>
                        <span className="text-sm font-normal text-muted-foreground">
                          {totalInSeries} {totalInSeries === 1 ? 'Beyblade' : 'Beyblades'}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-4">
                    <Accordion 
                      type="multiple" 
                      defaultValue={generations.map(g => g.generation)}
                      className="space-y-3 mt-2"
                    >
                      {generations.map(({ generation, items }) => (
                        <AccordionItem 
                          key={generation} 
                          value={generation} 
                          className="border-0 border-l-4 border-l-primary/40 rounded-lg bg-muted/40 ml-2 overflow-hidden"
                        >
                          <AccordionTrigger className="py-3 px-4 text-base font-semibold hover:no-underline hover:bg-muted/60 transition-colors">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              <span>{generation}</span>
                              <span className="text-xs font-normal text-muted-foreground bg-background/80 px-2 py-0.5 rounded-full shadow-sm">
                                {items.length}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 py-3">
                              {items.map((item, index) => (
                                item.beyblade && (
                                  <div 
                                    key={item.id}
                                    className="animate-fade-in"
                                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                                  >
                                    <BeybladeCard
                                      beyblade={item.beyblade}
                                      photoUrl={item.photo_url}
                                      spinDirection={item.spin_direction}
                                      onClick={() => setSelectedItem(item)}
                                    />
                                  </div>
                                )
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
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
              <div className="relative flex justify-center">
                {getDisplayImage(selectedItem) ? (
                  <>
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
                  </>
                ) : (
                  <div className="w-full max-w-xs aspect-square flex flex-col items-center justify-center rounded-lg bg-muted/50 text-center p-4">
                    <span className="text-4xl mb-2">🖼️</span>
                    <span className="text-sm text-muted-foreground">Sem foto</span>
                  </div>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                >
                  {isUploadingPhoto ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-1" />
                      Alterar Foto
                    </>
                  )}
                </Button>
                
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>
              
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
                      {renderDynamicComponents(selectedItem.beyblade.components as BeybladeComponents)}
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
                          <span>Stamina: {(selectedItem.beyblade.specs as BeybladeSpecs).stamina}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Spin Direction */}
                <SpinDirectionSelector
                  value={selectedItem.spin_direction}
                  onChange={handleSpinDirectionChange}
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
