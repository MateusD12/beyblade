import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PlusCircle, BookOpen, BarChart3, User, LogOut, Layers } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/', icon: BookOpen, label: 'Coleção' },
  { href: '/components', icon: Layers, label: 'Componentes' },
  { href: '/register', icon: PlusCircle, label: 'Registrar' },
  { href: '/stats', icon: BarChart3, label: 'Estatísticas' },
];

export function Navigation() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t z-50 md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Desktop only */}
          <Link to="/" className="hidden md:flex items-center gap-2">
            <span className="text-2xl">🌀</span>
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              BeyCollection
            </span>
          </Link>

          {/* Nav Items */}
          <div className="flex items-center justify-around w-full md:w-auto md:gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 rounded-lg transition-colors',
                    isActive 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs md:text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Actions - Desktop only */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {user.email}
                </span>
                <Button variant="ghost" size="icon" onClick={signOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
