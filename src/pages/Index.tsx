import { Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Camera, BookOpen, BarChart3, Sparkles } from 'lucide-react';

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen pb-20 md:pt-20">
      <Navigation />
      
      <div className="max-w-4xl mx-auto p-4">
        {/* Hero Section */}
        <div className="text-center py-12">
          <div className="relative inline-block mb-6">
            <div className="text-8xl animate-spin-beyblade">🌀</div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full animate-pulse-glow" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            BeyCollection
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
            Gerencie sua coleção de Beyblades com identificação automática por IA
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={user ? '/register' : '/auth'}>
              <Button size="lg" className="w-full sm:w-auto">
                <Camera className="w-5 h-5 mr-2" />
                {user ? 'Registrar Beyblade' : 'Começar Agora'}
              </Button>
            </Link>
            <Link to="/catalog">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <BookOpen className="w-5 h-5 mr-2" />
                Ver Catálogo
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6 text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Identificação por IA</h3>
              <p className="text-sm text-muted-foreground">
                Tire uma foto e a IA identifica automaticamente sua Beyblade com todas as informações
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6 text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Catálogo Inteligente</h3>
              <p className="text-sm text-muted-foreground">
                Catálogo que cresce automaticamente com cada Beyblade registrada
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6 text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-bold text-lg mb-2">Estatísticas</h3>
              <p className="text-sm text-muted-foreground">
                Visualize sua coleção com gráficos por tipo, série e muito mais
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Como Funciona</h2>
          
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: 1, title: 'Tire uma foto', description: 'Use a câmera ou faça upload' },
              { step: 2, title: 'IA identifica', description: 'Google Gemini analisa a imagem' },
              { step: 3, title: 'Confirme os dados', description: 'Verifique se está correto' },
              { step: 4, title: 'Salve na coleção', description: 'Pronto! Beyblade registrada' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mx-auto mb-3">
                  {item.step}
                </div>
                <h4 className="font-semibold mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
