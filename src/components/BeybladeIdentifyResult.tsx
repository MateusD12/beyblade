import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TypeBadge } from '@/components/TypeBadge';
import { IdentifyResponse } from '@/types/beyblade';
import { Check, X, Target, Shield, Zap, Layers, ExternalLink, Camera, Upload } from 'lucide-react';
import { getBeybladeImageUrl } from '@/lib/utils';

interface BeybladeIdentifyResultProps {
  result: IdentifyResponse;
  onConfirm: () => void;
  onReject: () => void;
  onCustomImage?: (imageBase64: string) => void;
  isLoading?: boolean;
}

// Mapeamento de chaves para labels em português
const COMPONENT_LABELS: Record<string, string> = {
  // Beyblade X
  blade: 'Lâmina',
  ratchet: 'Catraca',
  bit: 'Ponteira',
  // Burst clássico
  layer: 'Camada',
  disk: 'Disco',
  driver: 'Driver',
  // Burst QuadStrike
  energy_layer: 'Camada de Energia',
  strike_chip: 'Strike Chip',
  gravity_ring: 'Anel de Gravidade',
  forge_disc: 'Disco Forjado',
  performance_tip: 'Ponta de Desempenho',
  armor_tip: 'Ponta de Armadura',
  fusion_ring: 'Anel de Fusão',
  // Metal Fight
  face_bolt: 'Parafuso Facial',
  energy_ring: 'Anel de Energia',
  fusion_wheel: 'Roda de Fusão',
  spin_track: 'Trilho de Giro',
};

export function BeybladeIdentifyResult({ 
  result, 
  onConfirm, 
  onReject,
  onCustomImage,
  isLoading 
}: BeybladeIdentifyResultProps) {
  const [customImagePreview, setCustomImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setCustomImagePreview(base64);
      onCustomImage?.(base64);
    };
    reader.readAsDataURL(file);
  };

  if (!result.identified) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="font-bold text-lg mb-2">Não foi possível identificar</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {result.error_message || 'Tente tirar outra foto com melhor iluminação'}
            </p>
            <Button variant="outline" onClick={onReject}>
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderizar componentes dinamicamente
  const renderComponents = () => {
    if (!result.components) return null;
    
    // Descrições podem estar em components.descriptions ou component_descriptions
    const descriptions = (result.components as any)?.descriptions || 
                         result.component_descriptions || {};
    
    const componentEntries = Object.entries(result.components)
      .filter(([key, value]) => {
        if (key === 'descriptions') return false;
        if (!value || typeof value !== 'string') return false;
        const lowerValue = value.toLowerCase();
        if (lowerValue.includes('não aplicável') || lowerValue.includes('nao aplicavel')) return false;
        return true;
      });

    if (componentEntries.length === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="font-semibold flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Componentes
        </h4>
        <div className="space-y-2 text-sm">
          {componentEntries.map(([key, value]) => (
            <div key={key} className="p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-muted-foreground">
                  {COMPONENT_LABELS[key] || key}:
                </span>
                <span className="font-medium">{value as string}</span>
              </div>
              {descriptions[key] && (
                <p className="text-xs text-muted-foreground">{descriptions[key]}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{result.name}</CardTitle>
            {result.name_hasbro && result.name_hasbro !== result.name && (
              <p className="text-sm text-muted-foreground">
                Hasbro: {result.name_hasbro}
              </p>
            )}
          </div>
          {result.type && <TypeBadge type={result.type} />}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Image with custom upload option */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            {customImagePreview ? (
              <img 
                src={customImagePreview} 
                alt={result.name}
                className="w-48 h-48 object-contain rounded-lg bg-muted/50"
              />
            ) : result.image_url ? (
              <>
                <img 
                  src={getBeybladeImageUrl(result.image_url, result.wiki_url) || ''} 
                  alt={result.name}
                  className="w-48 h-48 object-contain rounded-lg bg-muted/50"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-48 h-48 flex-col items-center justify-center rounded-lg bg-muted/50 text-center p-4">
                  <span className="text-4xl mb-2">🖼️</span>
                  <span className="text-xs text-muted-foreground">Imagem indisponível</span>
                </div>
              </>
            ) : (
              <div className="w-48 h-48 flex flex-col items-center justify-center rounded-lg bg-muted/50 text-center p-4">
                <span className="text-4xl mb-2">🖼️</span>
                <span className="text-xs text-muted-foreground">Sem imagem</span>
              </div>
            )}
          </div>
          
          {/* Custom image upload button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            {customImagePreview ? 'Trocar Foto' : 'Adicionar Foto'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCustomImageUpload}
          />
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          {result.series && (
            <span className="px-2 py-1 bg-muted rounded-md">{result.series}</span>
          )}
          {result.generation && (
            <span className="px-2 py-1 bg-muted rounded-md">{result.generation}</span>
          )}
          {result.confidence && (
            <span className={`px-2 py-1 rounded-md ${
              result.confidence === 'high' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              result.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              Confiança: {result.confidence === 'high' ? 'Alta' : result.confidence === 'medium' ? 'Média' : 'Baixa'}
            </span>
          )}
        </div>

        {renderComponents()}

        {result.specs && (
          <div className="space-y-2">
            <h4 className="font-semibold">Especificações</h4>
            <div className="flex gap-4">
              {result.specs.attack && (
                <div className="flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-red-500" />
                  <span className="text-sm">ATK: {result.specs.attack}</span>
                </div>
              )}
              {result.specs.defense && (
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">DEF: {result.specs.defense}</span>
                </div>
              )}
              {result.specs.stamina && (
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-green-500" />
                  <span className="text-sm">STA: {result.specs.stamina}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {result.description && (
          <p className="text-sm text-muted-foreground">{result.description}</p>
        )}

        {result.wiki_url && (
          <a 
            href={result.wiki_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            Ver na Wiki
          </a>
        )}

        <div className="flex gap-3 pt-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={onReject}
            disabled={isLoading}
          >
            <X className="w-4 h-4 mr-2" />
            Incorreto
          </Button>
          <Button 
            className="flex-1"
            onClick={onConfirm}
            disabled={isLoading}
          >
            <Check className="w-4 h-4 mr-2" />
            Adicionar à Coleção
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
