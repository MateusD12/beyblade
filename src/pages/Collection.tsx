import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { BeybladeCard } from '@/components/BeybladeCard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CollectionItem, Beyblade, BeybladeComponents, BeybladeSpecs, ComponentDescriptions } from '@/types/beyblade';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, PlusCircle, Trash2, Target, Shield, Zap, ExternalLink } from 'lucide-react';
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
import { TypeBadge } from '@/components/TypeBadge';
import { useToast } from '@/hooks/use-toast';

// Translations
const TYPE_TRANSLATIONS: Record<string, string> = {
  'Attack': 'Ataque',
  'Defense': 'Defesa',
  'Stamina': 'Resistência',
  'Balance': 'Equilíbrio',
};

export default function Collection() {
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredCollection = collection.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.beyblade?.name.toLowerCase().includes(query) ||
      item.beyblade?.series.toLowerCase().includes(query) ||
      item.custom_name?.toLowerCase().includes(query)
    );
  });

  // Helper to get component names (supports both Burst and X naming)
  const getBladeComponent = (components: BeybladeComponents) => components.blade || components.layer;
  const getRatchetComponent = (components: BeybladeComponents) => components.ratchet || components.disk;
  const getBitComponent = (components: BeybladeComponents) => components.bit || components.driver;

  // Get the image to display (user photo > wiki image > placeholder)
  const getDisplayImage = (item: CollectionItem) => {
    if (item.photo_url) return item.photo_url;
    if (item.beyblade?.image_url) return item.beyblade.image_url;
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
