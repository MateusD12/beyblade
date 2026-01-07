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
import { Search, Swords, Settings, Target, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CollectionItem, BeybladeComponents, ComponentDescriptions } from '@/types/beyblade';

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

interface CategoryData {
  label: string;
  icon: typeof Swords;
  colorClass: string;
  bgClass: string;
  components: Map<string, ComponentData>;
}

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
            components,
            component_descriptions
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data as unknown as CollectionItem[];
    },
    enabled: !!user?.id,
  });

  const categories = useMemo(() => {
    const blades = new Map<string, ComponentData>();
    const ratchets = new Map<string, ComponentData>();
    const bits = new Map<string, ComponentData>();

    collection?.forEach((item) => {
      if (!item.beyblade) return;
      
      const components = item.beyblade.components as BeybladeComponents | null;
      const descriptions = item.beyblade.component_descriptions as ComponentDescriptions | null;
      
      if (!components) return;

      // Process blade/layer
      const bladeName = components.blade || components.layer;
      if (bladeName) {
        if (!blades.has(bladeName)) {
          blades.set(bladeName, {
            name: bladeName,
            description: descriptions?.blade || descriptions?.layer || '',
            beyblades: [],
            count: 0,
          });
        }
        const bladeData = blades.get(bladeName)!;
        if (!bladeData.beyblades.find(b => b.id === item.beyblade!.id)) {
          bladeData.beyblades.push({
            id: item.beyblade.id,
            name: item.beyblade.name,
            imageUrl: item.beyblade.image_url || null,
          });
        }
        bladeData.count++;
      }

      // Process ratchet/disk
      const ratchetName = components.ratchet || components.disk;
      if (ratchetName) {
        if (!ratchets.has(ratchetName)) {
          ratchets.set(ratchetName, {
            name: ratchetName,
            description: descriptions?.ratchet || descriptions?.disk || '',
            beyblades: [],
            count: 0,
          });
        }
        const ratchetData = ratchets.get(ratchetName)!;
        if (!ratchetData.beyblades.find(b => b.id === item.beyblade!.id)) {
          ratchetData.beyblades.push({
            id: item.beyblade.id,
            name: item.beyblade.name,
            imageUrl: item.beyblade.image_url || null,
          });
        }
        ratchetData.count++;
      }

      // Process bit/driver
      const bitName = components.bit || components.driver;
      if (bitName) {
        if (!bits.has(bitName)) {
          bits.set(bitName, {
            name: bitName,
            description: descriptions?.bit || descriptions?.driver || '',
            beyblades: [],
            count: 0,
          });
        }
        const bitData = bits.get(bitName)!;
        if (!bitData.beyblades.find(b => b.id === item.beyblade!.id)) {
          bitData.beyblades.push({
            id: item.beyblade.id,
            name: item.beyblade.name,
            imageUrl: item.beyblade.image_url || null,
          });
        }
        bitData.count++;
      }
    });

    return [
      {
        label: 'Lâminas',
        icon: Swords,
        colorClass: 'text-blue-500',
        bgClass: 'from-blue-500/10 to-blue-500/5',
        components: blades,
      },
      {
        label: 'Catracas',
        icon: Settings,
        colorClass: 'text-orange-500',
        bgClass: 'from-orange-500/10 to-orange-500/5',
        components: ratchets,
      },
      {
        label: 'Ponteiras',
        icon: Target,
        colorClass: 'text-green-500',
        bgClass: 'from-green-500/10 to-green-500/5',
        components: bits,
      },
    ] as CategoryData[];
  }, [collection]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const query = searchQuery.toLowerCase();
    return categories.map((category) => ({
      ...category,
      components: new Map(
        Array.from(category.components.entries()).filter(([name]) =>
          name.toLowerCase().includes(query)
        )
      ),
    }));
  }, [categories, searchQuery]);

  const totalCounts = useMemo(() => ({
    blades: categories[0]?.components.size || 0,
    ratchets: categories[1]?.components.size || 0,
    bits: categories[2]?.components.size || 0,
  }), [categories]);

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
          <div className="flex flex-wrap gap-3 text-sm">
            <Badge variant="secondary" className="gap-1.5 py-1 px-3">
              <Swords className="w-3.5 h-3.5 text-blue-500" />
              {totalCounts.blades} Lâminas
            </Badge>
            <Badge variant="secondary" className="gap-1.5 py-1 px-3">
              <Settings className="w-3.5 h-3.5 text-orange-500" />
              {totalCounts.ratchets} Catracas
            </Badge>
            <Badge variant="secondary" className="gap-1.5 py-1 px-3">
              <Target className="w-3.5 h-3.5 text-green-500" />
              {totalCounts.bits} Ponteiras
            </Badge>
          </div>
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
        ) : (
          <Accordion type="multiple" defaultValue={['Lâminas', 'Catracas', 'Ponteiras']} className="space-y-4">
            {filteredCategories.map((category) => (
              <AccordionItem
                key={category.label}
                value={category.label}
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
                  {category.components.size === 0 ? (
                    <p className="text-muted-foreground text-sm py-4">
                      Nenhum componente encontrado nesta categoria.
                    </p>
                  ) : (
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
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </main>
    </div>
  );
}
