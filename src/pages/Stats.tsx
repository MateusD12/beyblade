import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Target, Shield, Zap, Scale } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Stats {
  total: number;
  byType: { name: string; value: number; color: string }[];
  bySeries: { name: string; value: number }[];
}

const TYPE_CHART_COLORS: Record<string, string> = {
  Ataque: '#ef4444',
  Defesa: '#3b82f6',
  Stamina: '#22c55e',
  Equilíbrio: '#a855f7',
};

export default function Stats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStats();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('user_collection')
        .select(`
          *,
          beyblade:beyblade_catalog(type, series)
        `)
        .eq('user_id', user!.id);

      if (error) throw error;

      const total = data?.length || 0;
      
      // Count by type
      const typeCounts: Record<string, number> = {};
      const seriesCounts: Record<string, number> = {};
      
      data?.forEach(item => {
        if (item.beyblade) {
          const type = (item.beyblade as { type: string; series: string }).type;
          const series = (item.beyblade as { type: string; series: string }).series;
          
          typeCounts[type] = (typeCounts[type] || 0) + 1;
          seriesCounts[series] = (seriesCounts[series] || 0) + 1;
        }
      });

      const byType = Object.entries(typeCounts).map(([name, value]) => ({
        name,
        value,
        color: TYPE_CHART_COLORS[name] || '#888',
      }));

      const bySeries = Object.entries(seriesCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      setStats({ total, byType, bySeries });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen pb-20 md:pt-20">
        <Navigation />
        <div className="max-w-6xl mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-bold mb-2">Faça login para ver estatísticas</h2>
          <p className="text-muted-foreground text-center mb-4">
            Veja estatísticas detalhadas da sua coleção.
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
      
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Estatísticas</h1>
          <p className="text-muted-foreground">
            Visão geral da sua coleção
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !stats || stats.total === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Sem dados ainda</h3>
            <p className="text-muted-foreground mb-4">
              Adicione Beyblades à sua coleção para ver estatísticas.
            </p>
            <Link to="/register">
              <Button>Adicionar Beyblade</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Total Card */}
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary mb-2">
                    {stats.total}
                  </div>
                  <p className="text-muted-foreground">
                    {stats.total === 1 ? 'Beyblade na coleção' : 'Beyblades na coleção'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.byType}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {stats.byType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex flex-col justify-center gap-3">
                    {stats.byType.map((type) => (
                      <div key={type.name} className="flex items-center gap-3">
                        {type.name === 'Ataque' && <Target className="w-5 h-5 text-red-500" />}
                        {type.name === 'Defesa' && <Shield className="w-5 h-5 text-blue-500" />}
                        {type.name === 'Stamina' && <Zap className="w-5 h-5 text-green-500" />}
                        {type.name === 'Equilíbrio' && <Scale className="w-5 h-5 text-purple-500" />}
                        <span className="flex-1">{type.name}</span>
                        <span className="font-bold">{type.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Series Distribution */}
            {stats.bySeries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Por Série</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.bySeries.map((series) => (
                      <div key={series.name} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">{series.name}</span>
                            <span className="text-sm font-bold">{series.value}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${(series.value / stats.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
