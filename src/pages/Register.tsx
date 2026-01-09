import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Search, Loader2 } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { ImageCapture } from "@/components/ImageCapture";
import { BeybladeIdentifyResult } from "@/components/BeybladeIdentifyResult";
import { BeybladeSearch } from "@/components/BeybladeSearch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { IdentifyResponse } from "@/types/beyblade";
import { Link } from "react-router-dom";

type Mode = "select" | "camera" | "search";

export default function Register() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("select");
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [identifyResult, setIdentifyResult] = useState<IdentifyResponse | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleImageCapture = async (imageBase64: string) => {
    setCapturedImage(imageBase64);
    setIsIdentifying(true);

    try {
      const response = await supabase.functions.invoke("identify-beyblade", {
        body: { imageBase64 },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setIdentifyResult(response.data);
    } catch (error) {
      console.error("Error identifying beyblade:", error);
      toast({
        variant: "destructive",
        title: "Erro ao identificar",
        description: "Não foi possível identificar a Beyblade. Tente novamente.",
      });
      setIdentifyResult(null);
      setCapturedImage(null);
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleSearchSelect = async (slug: string, name: string) => {
    console.log("handleSearchSelect called with:", { slug, name });
    setIsIdentifying(true);
    setRetryCount(0);

    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          setRetryCount(attempt);
          console.log(`Retry attempt ${attempt} for slug:`, slug);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log("Invoking fetch-beyblade-details with slug:", slug);
        const { data, error } = await supabase.functions.invoke("fetch-beyblade-details", {
          body: { slug },
        });

        console.log("fetch-beyblade-details response:", { data, error });

        if (error) throw error;

        if (data?.error) {
          throw new Error(data.error);
        }

        setIdentifyResult(data);
        setRetryCount(0);
        setIsIdentifying(false);
        return; // Success, exit
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        console.error(`Attempt ${attempt + 1} failed:`, error);
      }
    }

    // All retries failed
    console.error("All attempts failed:", lastError);
    toast({
      title: "Erro ao buscar detalhes",
      description: "Servidor lento. Tente novamente em alguns segundos.",
      variant: "destructive",
    });
    setRetryCount(0);
    setIsIdentifying(false);
  };

  const handleConfirm = async () => {
    if (!identifyResult?.identified || !user) return;

    setIsSaving(true);

    try {
      let photoUrl: string | null = null;

      // Upload photo if captured or custom image provided
      const imageToUpload = customImage || capturedImage;
      if (imageToUpload) {
        const fileName = `${user.id}/${Date.now()}.jpg`;
        const base64Data = imageToUpload.split(",")[1];
        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }

        const { error: uploadError } = await supabase.storage
          .from("beyblade-photos")
          .upload(fileName, bytes.buffer, {
            contentType: "image/jpeg",
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from("beyblade-photos")
            .getPublicUrl(fileName);
          photoUrl = publicUrlData.publicUrl;
        }
      }

      // Prepare catalog data
      const catalogImageUrl = photoUrl || identifyResult.image_url || null;
      
      // Build components with descriptions included
      // Priorizar descrições que já estão dentro de components
      const componentsData = identifyResult.components
        ? {
            ...identifyResult.components,
            descriptions: (identifyResult.components as any)?.descriptions || 
                          identifyResult.component_descriptions || 
                          null,
          }
        : null;

      // Check if beyblade exists in catalog
      const { data: existingBeyblade } = await supabase
        .from("beyblade_catalog")
        .select("id, image_url")
        .eq("name", identifyResult.name)
        .maybeSingle();

      let beybladeId: string;

      if (existingBeyblade) {
        beybladeId = existingBeyblade.id;
        
        // Only update image_url if we have a new one and the existing is null/empty
        const shouldUpdateImage = catalogImageUrl && !existingBeyblade.image_url;
        
        // Update existing record with new data
        const { error: updateError } = await supabase
          .from("beyblade_catalog")
          .update({
            image_url: shouldUpdateImage ? catalogImageUrl : existingBeyblade.image_url,
            description: identifyResult.description || undefined,
            specs: identifyResult.specs
              ? JSON.parse(JSON.stringify(identifyResult.specs))
              : undefined,
            components: componentsData
              ? JSON.parse(JSON.stringify(componentsData))
              : undefined,
            name_hasbro: identifyResult.name_hasbro || undefined,
          })
          .eq("id", beybladeId);
        
        if (updateError) {
          console.error("Error updating catalog:", updateError);
          toast({
            variant: "destructive",
            title: "Erro ao atualizar catálogo",
            description: "Não foi possível atualizar os dados da Beyblade no catálogo.",
          });
        }
      } else {
        // Add new beyblade to catalog
        const { data: newBeyblade, error: catalogError } = await supabase
          .from("beyblade_catalog")
          .insert([
            {
              name: identifyResult.name!,
              name_hasbro: identifyResult.name_hasbro,
              series: identifyResult.series!,
              generation: identifyResult.generation!,
              type: identifyResult.type!,
              components: componentsData
                ? JSON.parse(JSON.stringify(componentsData))
                : null,
              specs: identifyResult.specs
                ? JSON.parse(JSON.stringify(identifyResult.specs))
                : null,
              description: identifyResult.description,
              image_url: catalogImageUrl,
            },
          ])
          .select("id")
          .single();

        if (catalogError) throw catalogError;
        beybladeId = newBeyblade.id;
      }

      // Add to user collection
      const { error: collectionError } = await supabase
        .from("user_collection")
        .insert({
          user_id: user.id,
          beyblade_id: beybladeId,
          photo_url: photoUrl,
        });

      if (collectionError) throw collectionError;

      toast({
        title: "Beyblade adicionada!",
        description: `${identifyResult.name} foi adicionada à sua coleção.`,
      });

      navigate("/collection");
    } catch (error) {
      console.error("Error saving beyblade:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar a Beyblade. Tente novamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReject = () => {
    // If result came from camera, switch to search mode to correct
    if (capturedImage) {
      setIdentifyResult(null);
      setCustomImage(null);
      setMode("search");
    } else {
      // Reset everything
      setMode("select");
      setCapturedImage(null);
      setCustomImage(null);
      setIdentifyResult(null);
    }
  };

  const handleBack = () => {
    setMode("select");
    setCapturedImage(null);
    setCustomImage(null);
    setIdentifyResult(null);
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
            Tire uma foto ou busque pelo nome para adicionar à sua coleção
          </p>
        </div>

        {isIdentifying && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">
              {retryCount > 0
                ? `Tentando novamente (${retryCount})...`
                : mode === "search"
                  ? "Buscando informações na Beyblade Fandom Wiki..."
                  : "Identificando sua Beyblade..."}
            </p>
          </div>
        )}

        {identifyResult && !isIdentifying && (
          <div className="space-y-4">
            <BeybladeIdentifyResult
              result={identifyResult}
              onConfirm={handleConfirm}
              onReject={handleReject}
              onCustomImage={setCustomImage}
              isLoading={isSaving}
            />
            {capturedImage && (
              <p className="text-center text-sm text-muted-foreground">
                Nome incorreto?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIdentifyResult(null);
                    setMode("search");
                  }}
                  className="text-primary underline"
                >
                  Buscar por nome na Wiki
                </button>
              </p>
            )}
          </div>
        )}

        {!identifyResult && !isIdentifying && mode === "select" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setMode("camera")}
            >
              <CardHeader className="text-center pb-2">
                <Camera className="h-10 w-10 mx-auto text-primary mb-2" />
                <CardTitle className="text-lg">Tirar Foto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center">
                  Use a câmera para fotografar sua Beyblade
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setMode("search")}
            >
              <CardHeader className="text-center pb-2">
                <Search className="h-10 w-10 mx-auto text-primary mb-2" />
                <CardTitle className="text-lg">Buscar por Nome</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center">
                  Pesquise na Beyblade Fandom Wiki
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {!identifyResult && !isIdentifying && mode === "camera" && (
          <div className="space-y-4">
            <Button variant="outline" onClick={handleBack}>
              ← Voltar
            </Button>
            <ImageCapture onImageCapture={handleImageCapture} disabled={isIdentifying} />
          </div>
        )}

        {!identifyResult && !isIdentifying && mode === "search" && (
          <div className="space-y-4">
            <Button variant="outline" onClick={handleBack}>
              ← Voltar
            </Button>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Search className="h-5 w-5" />
                  Buscar na Wiki
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <BeybladeSearch
                  onSelect={handleSearchSelect}
                  placeholder="Ex: DranSword, Phoenix Wing, Dran Buster..."
                />
                <p className="text-xs text-muted-foreground">
                  Busca dados precisos da Beyblade Fandom Wiki
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
