import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Search, Swords, Settings, Target, Loader2, Layers, Circle, Disc, Zap, Shield, Cog, CircleDot, ArrowUpDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CollectionItem, BeybladeComponents } from '@/types/beyblade';

interface ComponentData {
  name: string;
  description: string;
  beyblades: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
  }>;
  count: number;
}

interface CategoryConfig {
  label: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
}

// Mapeamento de chaves de componentes para labels em português
const COMPONENT_CONFIG: Record<string, CategoryConfig> = {
  // Beyblade X
  blade: { label: 'Lâminas', icon: Swords, colorClass: 'text-blue-500', bgClass: 'from-blue-500/10 to-blue-500/5' },
  ratchet: { label: 'Catracas', icon: Settings, colorClass: 'text-orange-500', bgClass: 'from-orange-500/10 to-orange-500/5' },
  bit: { label: 'Ponteiras', icon: Target, colorClass: 'text-green-500', bgClass: 'from-green-500/10 to-green-500/5' },
  
  // Burst clássico
  layer: { label: 'Camadas', icon: Layers, colorClass: 'text-purple-500', bgClass: 'from-purple-500/10 to-purple-500/5' },
  disk: { label: 'Discos', icon: Circle, colorClass: 'text-yellow-500', bgClass: 'from-yellow-500/10 to-yellow-500/5' },
  driver: { label: 'Drivers', icon: Disc, colorClass: 'text-cyan-500', bgClass: 'from-cyan-500/10 to-cyan-500/5' },
  
  // Burst QuadStrike
  energy_layer: { label: 'Camadas de Energia', icon: Zap, colorClass: 'text-red-500', bgClass: 'from-red-500/10 to-red-500/5' },
  strike_chip: { label: 'Strike Chips', icon: CircleDot, colorClass: 'text-pink-500', bgClass: 'from-pink-500/10 to-pink-500/5' },
  forge_disc: { label: 'Discos Forjados', icon: Shield, colorClass: 'text-amber-500', bgClass: 'from-amber-500/10 to-amber-500/5' },
  gravity_ring: { label: 'Anéis de Gravidade', icon: Circle, colorClass: 'text-slate-500', bgClass: 'from-slate-500/10 to-slate-500/5' },
  performance_tip: { label: 'Pontas de Desempenho', icon: Target, colorClass: 'text-lime-500', bgClass: 'from-lime-500/10 to-lime-500/5' },
  armor_tip: { label: 'Pontas de Armadura', icon: Shield, colorClass: 'text-slate-500', bgClass: 'from-slate-500/10 to-slate-500/5' },
  fusion_ring: { label: 'Anéis de Fusão', icon: Circle, colorClass: 'text-violet-500', bgClass: 'from-violet-500/10 to-violet-500/5' },
  
  // Metal Fight
  face_bolt: { label: 'Parafusos Faciais', icon: CircleDot, colorClass: 'text-gray-500', bgClass: 'from-gray-500/10 to-gray-500/5' },
  energy_ring: { label: 'Anéis de Energia', icon: Circle, colorClass: 'text-emerald-500', bgClass: 'from-emerald-500/10 to-emerald-500/5' },
  fusion_wheel: { label: 'Rodas de Fusão', icon: Cog, colorClass: 'text-zinc-500', bgClass: 'from-zinc-500/10 to-zinc-500/5' },
  spin_track: { label: 'Trilhos de Giro', icon: ArrowUpDown, colorClass: 'text-indigo-500', bgClass: 'from-indigo-500/10 to-indigo-500/5' },
};

// Chaves que devem ser ignoradas ao processar componentes
const IGNORED_KEYS = ['descriptions', 'extra'];

export default function Components() {
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: collection, isLoading } = useQuery({
    queryKey: ['user-collection-components', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_collection')
        .select(`
          id,
          beyblade_id,
          beyblade:beyblade_catalog(
            id,
            name,
            image_url,
            series,
            components
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data as unknown as CollectionItem[];
    },
    enabled: !!user?.id,
  });

  // Processar componentes dinamicamente
  const categories = useMemo(() => {
    const categoriesMap = new Map<string, Map<string, ComponentData>>();

    collection?.forEach((item) => {
      if (!item.beyblade) return;
      
      const components = item.beyblade.components as BeybladeComponents | null;
      if (!components) return;

      // Pegar descrições de dentro do objeto components
      const descriptions = (components.descriptions || {}) as Record<string, string>;

      // Iterar sobre todas as chaves do componente
      Object.entries(components).forEach(([key, value]) => {
        // Ignorar chaves especiais e valores inválidos
        if (IGNORED_KEYS.includes(key)) return;
        if (!value || typeof value !== 'string') return;
        
        // Ignorar valores "Não aplicável" ou similares
        const lowerValue = value.toLowerCase();
        if (lowerValue.includes('não aplicável') || lowerValue.includes('not applicable') || lowerValue === 'n/a') return;

        // Inicializar categoria se não existir
        if (!categoriesMap.has(key)) {
          categoriesMap.set(key, new Map<string, ComponentData>());
        }

        const categoryComponents = categoriesMap.get(key)!;

        // Adicionar ou atualizar componente
        if (!categoryComponents.has(value)) {
          categoryComponents.set(value, {
            name: value,
            description: descriptions[key] || '',
            beyblades: [],
            count: 0,
          });
        }

        const componentData = categoryComponents.get(value)!;
        
        // Adicionar beyblade se ainda não estiver na lista
        if (!componentData.beyblades.find(b => b.id === item.beyblade!.id)) {
          componentData.beyblades.push({
            id: item.beyblade.id,
            name: item.beyblade.name,
            imageUrl: item.beyblade.image_url || null,
          });
        }
        componentData.count++;
      });
    });

    // Converter para array ordenado por prioridade
    const priorityOrder = ['blade', 'ratchet', 'bit', 'layer', 'disk', 'driver', 'energy_layer', 'strike_chip', 'forge_disc', 'gravity_ring', 'performance_tip', 'armor_tip'];
    
    return Array.from(categoriesMap.entries())
      .sort((a, b) => {
        const aIndex = priorityOrder.indexOf(a[0]);
        const bIndex = priorityOrder.indexOf(b[0]);
        if (aIndex === -1 && bIndex === -1) return a[0].localeCompare(b[0]);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      })
      .map(([key, components]) => {
        const config = COMPONENT_CONFIG[key] || {
          label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
          icon: Circle,
          colorClass: 'text-muted-foreground',
          bgClass: 'from-muted/10 to-muted/5',
        };
        
        return {
          key,
          ...config,
          components,
        };
      });
  }, [collection]);

  // Filtrar por busca
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const query = searchQuery.toLowerCase();
    return categories
      .map((category) => ({
        ...category,
        components: new Map(
          Array.from(category.components.entries()).filter(([name]) =>
            name.toLowerCase().includes(query)
          )
        ),
      }))
      .filter(category => category.components.size > 0);
  }, [categories, searchQuery]);

  // Calcular totais
  const totalComponents = useMemo(() => {
    return categories.reduce((sum, cat) => sum + cat.components.size, 0);
  }, [categories]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8 md:pt-20">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Meus Componentes</h1>
          <div className="flex flex-wrap gap-2 text-sm">
            {categories.map((category) => (
              <Badge key={category.key} variant="secondary" className="gap-1.5 py-1 px-3">
                <category.icon className={cn("w-3.5 h-3.5", category.colorClass)} />
                {category.components.size} {category.label}
              </Badge>
            ))}
            {categories.length === 0 && (
              <span className="text-muted-foreground">Nenhum componente na coleção</span>
            )}
          </div>
          {totalComponents > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Total: {totalComponents} componentes únicos
            </p>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar componente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? 'Nenhum componente encontrado para esta busca.' : 'Nenhum componente na sua coleção ainda.'}
            </p>
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={filteredCategories.map(c => c.key)} className="space-y-4">
            {filteredCategories.map((category) => (
              <AccordionItem
                key={category.key}
                value={category.key}
                className="border-0 rounded-xl overflow-hidden shadow-md bg-card"
              >
                <AccordionTrigger className="text-lg font-bold hover:no-underline px-5 py-4 bg-gradient-to-r from-muted/50 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      `bg-gradient-to-br ${category.bgClass}`
                    )}>
                      <category.icon className={cn("w-5 h-5", category.colorClass)} />
                    </div>
                    <div className="text-left">
                      <span className="block">{category.label}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {category.components.size} componentes únicos
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    {Array.from(category.components.values())
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((component, index) => (
                        <Card 
                          key={component.name}
                          className={cn(
                            "overflow-hidden transition-all duration-300",
                            "border shadow-sm hover:shadow-lg hover:-translate-y-1",
                            "animate-fade-in"
                          )}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <CardHeader className={cn(
                            "pb-2 bg-gradient-to-r",
                            category.bgClass
                          )}>
                            <CardTitle className="text-base flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                <category.icon className={cn("w-4 h-4", category.colorClass)} />
                                {component.name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                ×{component.count}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-3 space-y-3">
                            {component.description && (
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {component.description}
                              </p>
                            )}
                            
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                Encontrado em:
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {component.beyblades.map((bey) => (
                                  <div
                                    key={bey.id}
                                    className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2 py-1 text-xs"
                                  >
                                    {bey.imageUrl && (
                                      <img
                                        src={bey.imageUrl}
                                        alt={bey.name}
                                        className="w-4 h-4 rounded-full object-cover"
                                      />
                                    )}
                                    <span className="truncate max-w-[100px]">{bey.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </main>
    </div>
  );
}
