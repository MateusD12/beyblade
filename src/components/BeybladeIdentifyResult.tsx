import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TypeBadge } from '@/components/TypeBadge';
import { IdentifyResponse } from '@/types/beyblade';
import { Check, X, Target, Shield, Zap, Layers, ExternalLink } from 'lucide-react';

interface BeybladeIdentifyResultProps {
  result: IdentifyResponse;
  onConfirm: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

export function BeybladeIdentifyResult({ 
  result, 
  onConfirm, 
  onReject,
  isLoading 
}: BeybladeIdentifyResultProps) {
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

  // Get component name (supports both Burst and X naming)
  const getBladeComponent = () => result.components?.blade || result.components?.layer;
  const getRatchetComponent = () => result.components?.ratchet || result.components?.disk;
  const getBitComponent = () => result.components?.bit || result.components?.driver;

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
        {/* Wiki Image */}
        {result.image_url && (
          <div className="flex justify-center">
            <img 
              src={result.image_url} 
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
              {result.wiki_url && (
                <a 
                  href={result.wiki_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline mt-1"
                >
                  Ver na Wiki
                </a>
              )}
            </div>
          </div>
        )}

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

        {result.components && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Componentes
            </h4>
            <div className="space-y-2 text-sm">
              {getBladeComponent() && (
                <div className="p-3 bg-muted rounded-md">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-muted-foreground">Lâmina:</span>
                    <span className="font-medium">{getBladeComponent()}</span>
                  </div>
                  {result.component_descriptions?.blade && (
                    <p className="text-xs text-muted-foreground">{result.component_descriptions.blade}</p>
                  )}
                </div>
              )}
              {getRatchetComponent() && (
                <div className="p-3 bg-muted rounded-md">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-muted-foreground">Catraca:</span>
                    <span className="font-medium">{getRatchetComponent()}</span>
                  </div>
                  {result.component_descriptions?.ratchet && (
                    <p className="text-xs text-muted-foreground">{result.component_descriptions.ratchet}</p>
                  )}
                </div>
              )}
              {getBitComponent() && (
                <div className="p-3 bg-muted rounded-md">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-muted-foreground">Ponteira:</span>
                    <span className="font-medium">{getBitComponent()}</span>
                  </div>
                  {result.component_descriptions?.bit && (
                    <p className="text-xs text-muted-foreground">{result.component_descriptions.bit}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

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
