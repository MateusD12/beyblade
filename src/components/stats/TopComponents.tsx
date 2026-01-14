import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Disc, CircleDot, Hexagon } from 'lucide-react';

interface ComponentData {
  name: string;
  count: number;
  type: 'blade' | 'ratchet' | 'bit';
}

interface TopComponentsProps {
  data: ComponentData[];
}

const TYPE_CONFIG = {
  blade: { label: 'Blade', icon: Disc, color: 'bg-orange-500/10 text-orange-500' },
  ratchet: { label: 'Ratchet', icon: Hexagon, color: 'bg-blue-500/10 text-blue-500' },
  bit: { label: 'Bit', icon: CircleDot, color: 'bg-green-500/10 text-green-500' },
};

export function TopComponents({ data }: TopComponentsProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Componentes Mais Usados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            <p>Nenhum componente registrado ainda</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Componentes Mais Usados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {data.map((component, index) => {
            const config = TYPE_CONFIG[component.type];
            const Icon = config.icon;
            
            return (
              <div 
                key={component.name} 
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
              >
                <span className="text-lg font-bold text-muted-foreground w-6">
                  #{index + 1}
                </span>
                <Icon className="w-5 h-5 text-muted-foreground" />
                <span className="flex-1 font-medium">{component.name}</span>
                <Badge variant="secondary" className={config.color}>
                  {config.label}
                </Badge>
                <span className="font-bold">{component.count}x</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
