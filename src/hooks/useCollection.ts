import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CollectionItem, BeybladeComponents, BeybladeSpecs } from '@/types/beyblade';
import { useAuth } from '@/hooks/useAuth';
import { SpinDirection } from '@/components/SpinDirectionSelector';
import { useToast } from '@/hooks/use-toast';

const COLLECTION_QUERY_KEY = 'collection';
const STALE_TIME = 5 * 60 * 1000; // 5 minutes

async function fetchCollection(userId: string): Promise<CollectionItem[]> {
  const { data, error } = await supabase
    .from('user_collection')
    .select(`
      *,
      beyblade:beyblade_catalog(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(item => ({
    ...item,
    spin_direction: item.spin_direction as 'L' | 'R' | 'R/L' | null,
    beyblade: item.beyblade ? {
      ...item.beyblade,
      components: item.beyblade.components as BeybladeComponents | null,
      specs: item.beyblade.specs as BeybladeSpecs | null,
    } : undefined,
  }));
}

export function useCollection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: [COLLECTION_QUERY_KEY, user?.id],
    queryFn: () => fetchCollection(user!.id),
    enabled: !!user,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: true,
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('user_collection')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
      return itemId;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<CollectionItem[]>(
        [COLLECTION_QUERY_KEY, user?.id],
        (old) => old?.filter(item => item.id !== deletedId) || []
      );
      toast({
        title: "Removido da coleção",
        description: "Item removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover da coleção. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateSpinDirectionMutation = useMutation({
    mutationFn: async ({ collectionId, direction }: { collectionId: string; direction: SpinDirection }) => {
      const { error } = await supabase
        .from('user_collection')
        .update({ spin_direction: direction })
        .eq('id', collectionId);
      if (error) throw error;
      return { collectionId, direction };
    },
    onSuccess: ({ collectionId, direction }) => {
      queryClient.setQueryData<CollectionItem[]>(
        [COLLECTION_QUERY_KEY, user?.id],
        (old) => old?.map(item => 
          item.id === collectionId 
            ? { ...item, spin_direction: direction } 
            : item
        ) || []
      );
      toast({
        title: "Direção atualizada",
        description: `Direção de rotação alterada para ${direction}`,
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a direção de rotação.",
        variant: "destructive",
      });
    },
  });

  const updatePhotoMutation = useMutation({
    mutationFn: async ({ collectionId, file }: { collectionId: string; file: File }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${collectionId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('beyblade-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('beyblade-photos')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('user_collection')
        .update({ photo_url: urlData.publicUrl })
        .eq('id', collectionId);

      if (updateError) throw updateError;

      return { collectionId, photoUrl: urlData.publicUrl };
    },
    onSuccess: ({ collectionId, photoUrl }) => {
      queryClient.setQueryData<CollectionItem[]>(
        [COLLECTION_QUERY_KEY, user?.id],
        (old) => old?.map(item => 
          item.id === collectionId 
            ? { ...item, photo_url: photoUrl } 
            : item
        ) || []
      );
      toast({
        title: "Foto atualizada",
        description: "A foto foi alterada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar foto",
        description: "Não foi possível fazer o upload da foto.",
        variant: "destructive",
      });
    },
  });

  const addToCollectionMutation = useMutation({
    mutationFn: async ({ beybladeId, spinDirection }: { beybladeId: string; spinDirection?: SpinDirection }) => {
      const { data, error } = await supabase
        .from('user_collection')
        .insert({
          user_id: user!.id,
          beyblade_id: beybladeId,
          spin_direction: spinDirection,
        })
        .select(`
          *,
          beyblade:beyblade_catalog(*)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COLLECTION_QUERY_KEY, user?.id] });
      toast({
        title: "Adicionado à coleção",
        description: "Beyblade adicionada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar",
        description: error.message || "Não foi possível adicionar à coleção.",
        variant: "destructive",
      });
    },
  });

  return {
    collection: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    deleteItem: deleteItemMutation.mutate,
    isDeleting: deleteItemMutation.isPending,
    updateSpinDirection: updateSpinDirectionMutation.mutate,
    isUpdatingSpinDirection: updateSpinDirectionMutation.isPending,
    updatePhoto: updatePhotoMutation.mutate,
    isUploadingPhoto: updatePhotoMutation.isPending,
    addToCollection: addToCollectionMutation.mutate,
    isAddingToCollection: addToCollectionMutation.isPending,
  };
}
