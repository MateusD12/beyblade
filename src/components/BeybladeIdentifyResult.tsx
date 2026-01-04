import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TypeBadge } from '@/components/TypeBadge';
import { IdentifyResponse } from '@/types/beyblade';
import { Check, X, Target, Shield, Zap, Layers } from 'lucide-react';

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
        <div className="flex flex-wrap gap-2 text-sm">
          {result.series && (
            <span className="px-2 py-1 bg-muted rounded-md">{result.series}</span>
          )}
          {result.generation && (
            <span className="px-2 py-1 bg-muted rounded-md">{result.generation}</span>
          )}
          {result.confidence && (
            <span className={`px-2 py-1 rounded-md ${
              result.confidence === 'high' ? 'bg-green-100 text-green-700' :
              result.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              Confiança: {result.confidence}
            </span>
          )}
        </div>

        {result.components && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Componentes
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {result.components.layer && (
                <div className="p-2 bg-muted rounded-md">
                  <span className="text-muted-foreground">Layer:</span>{' '}
                  <span className="font-medium">{result.components.layer}</span>
                </div>
              )}
              {result.components.disk && (
                <div className="p-2 bg-muted rounded-md">
                  <span className="text-muted-foreground">Disk:</span>{' '}
                  <span className="font-medium">{result.components.disk}</span>
                </div>
              )}
              {result.components.driver && (
                <div className="p-2 bg-muted rounded-md">
                  <span className="text-muted-foreground">Driver:</span>{' '}
                  <span className="font-medium">{result.components.driver}</span>
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
