import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TypeBadge } from '@/components/TypeBadge';
import { Beyblade } from '@/types/beyblade';
import { Target, Shield, Zap } from 'lucide-react';
import { getBeybladeImageUrl } from '@/lib/utils';

interface BeybladeCardProps {
  beyblade: Beyblade;
  photoUrl?: string | null;
  onClick?: () => void;
}

export function BeybladeCard({ beyblade, photoUrl, onClick }: BeybladeCardProps) {
  const specs = beyblade.specs as { attack?: string; defense?: string; stamina?: string } | null;
  
  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 hover:border-primary/50"
      onClick={onClick}
    >
      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-muted to-muted/50">
        {(photoUrl || beyblade.image_url) ? (
          <>
            <img 
              src={photoUrl || getBeybladeImageUrl(beyblade.image_url, beyblade.wiki_url) || ''} 
              alt={beyblade.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const fallback = target.nextElementSibling;
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
            <div className="hidden w-full h-full flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border-4 border-dashed border-muted-foreground/30 flex items-center justify-center">
                <span className="text-4xl">🌀</span>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border-4 border-dashed border-muted-foreground/30 flex items-center justify-center">
              <span className="text-4xl">🌀</span>
            </div>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <TypeBadge type={beyblade.type} />
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <h3 className="font-bold text-lg line-clamp-1">{beyblade.name}</h3>
        {beyblade.name_hasbro && beyblade.name_hasbro !== beyblade.name && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            Hasbro: {beyblade.name_hasbro}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-3">
          {beyblade.series} • {beyblade.generation}
        </p>
        
        {specs && (
          <div className="flex gap-4 text-xs">
            {specs.attack && (
              <div className="flex items-center gap-1 text-red-500">
                <Target className="w-3 h-3" />
                <span className="font-medium">{specs.attack}</span>
              </div>
            )}
            {specs.defense && (
              <div className="flex items-center gap-1 text-blue-500">
                <Shield className="w-3 h-3" />
                <span className="font-medium">{specs.defense}</span>
              </div>
            )}
            {specs.stamina && (
              <div className="flex items-center gap-1 text-green-500">
                <Zap className="w-3 h-3" />
                <span className="font-medium">{specs.stamina}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
