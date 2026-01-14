import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Shield, Zap, Scale } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface TypeData {
  name: string;
  value: number;
  color: string;
}

interface TypeDistributionChartProps {
  data: TypeData[];
}

export function TypeDistributionChart({ data }: TypeDistributionChartProps) {
  const getIcon = (typeName: string) => {
    switch (typeName) {
      case 'Ataque':
        return <Target className="w-5 h-5 text-red-500" />;
      case 'Defesa':
        return <Shield className="w-5 h-5 text-blue-500" />;
      case 'Stamina':
        return <Zap className="w-5 h-5 text-green-500" />;
      case 'Equilíbrio':
        return <Scale className="w-5 h-5 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
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
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex flex-col justify-center gap-3">
            {data.map((type) => (
              <div key={type.name} className="flex items-center gap-3">
                {getIcon(type.name)}
                <span className="flex-1">{type.name}</span>
                <span className="font-bold">{type.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
