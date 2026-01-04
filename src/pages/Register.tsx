import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageCapture } from '@/components/ImageCapture';
import { BeybladeIdentifyResult } from '@/components/BeybladeIdentifyResult';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { IdentifyResponse } from '@/types/beyblade';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Register() {
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [identifyResult, setIdentifyResult] = useState<IdentifyResponse | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleImageCapture = async (imageBase64: string) => {
    setCapturedImage(imageBase64);
    setIsIdentifying(true);
    
    try {
      const response = await supabase.functions.invoke('identify-beyblade', {
        body: { imageBase64 },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setIdentifyResult(response.data);
    } catch (error) {
      console.error('Error identifying beyblade:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao identificar',
        description: 'Não foi possível identificar a Beyblade. Tente novamente.',
      });
      setIdentifyResult(null);
      setCapturedImage(null);
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleConfirm = async () => {
    if (!identifyResult?.identified || !user || !capturedImage) return;

    setIsSaving(true);

    try {
      // Upload image to storage
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const base64Data = capturedImage.split(',')[1];
      const binaryData = atob(base64Data);
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }
      
      const { error: uploadError } = await supabase.storage
        .from('beyblade-photos')
        .upload(fileName, bytes.buffer, {
          contentType: 'image/jpeg',
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('beyblade-photos')
        .getPublicUrl(fileName);

      // Check if beyblade exists in catalog
      const { data: existingBeyblade } = await supabase
        .from('beyblade_catalog')
        .select('id')
        .eq('name', identifyResult.name)
        .single();

      let beybladeId: string;

      if (existingBeyblade) {
        beybladeId = existingBeyblade.id;
      } else {
        // Add to catalog
        const { data: newBeyblade, error: catalogError } = await supabase
          .from('beyblade_catalog')
          .insert([{
            name: identifyResult.name!,
            name_hasbro: identifyResult.name_hasbro,
            series: identifyResult.series!,
            generation: identifyResult.generation!,
            type: identifyResult.type!,
            components: identifyResult.components ? JSON.parse(JSON.stringify(identifyResult.components)) : null,
            specs: identifyResult.specs ? JSON.parse(JSON.stringify(identifyResult.specs)) : null,
            description: identifyResult.description,
          }])
          .select('id')
          .single();

        if (catalogError) throw catalogError;
        beybladeId = newBeyblade.id;
      }

      // Add to user collection
      const { error: collectionError } = await supabase
        .from('user_collection')
        .insert({
          user_id: user.id,
          beyblade_id: beybladeId,
          photo_url: publicUrlData.publicUrl,
        });

      if (collectionError) throw collectionError;

      toast({
        title: 'Beyblade adicionada!',
        description: `${identifyResult.name} foi adicionada à sua coleção.`,
      });

      navigate('/collection');
    } catch (error) {
      console.error('Error saving beyblade:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a Beyblade. Tente novamente.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReject = () => {
    setIdentifyResult(null);
    setCapturedImage(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen pb-20 md:pt-20">
        <Navigation />
        <div className="max-w-lg mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2">Faça login para continuar</h2>
          <p className="text-muted-foreground text-center mb-4">
            Você precisa estar logado para registrar Beyblades na sua coleção.
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
      
      <div className="max-w-lg mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Registrar Beyblade</h1>
          <p className="text-muted-foreground">
            Tire uma foto para identificar automaticamente sua Beyblade
          </p>
        </div>

        {isIdentifying ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Identificando sua Beyblade...</p>
          </div>
        ) : identifyResult ? (
          <BeybladeIdentifyResult
            result={identifyResult}
            onConfirm={handleConfirm}
            onReject={handleReject}
            isLoading={isSaving}
          />
        ) : (
          <ImageCapture 
            onImageCapture={handleImageCapture}
            disabled={isIdentifying}
          />
        )}
      </div>
    </div>
  );
}
