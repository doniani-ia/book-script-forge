import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, BookOpen, LogOut, User, Loader2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { LLMSettings } from '@/components/settings/LLMSettings';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const Navbar = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    const confirmed = window.confirm('Tem certeza que deseja sair do sistema?');
    if (!confirmed) return;

    try {
      setIsSigningOut(true);
      await signOut();
      // AuthProvider will handle the redirect to home page
    } catch (error) {
      console.error('Error during sign out:', error);
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao fazer logout. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2">
              <FileText className="h-6 w-6" />
              <span className="font-bold text-lg">YT Script Generator</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              {profile?.role === 'admin' && (
                <Link to="/admin">
                  <Button 
                    variant={isActive('/admin') ? 'default' : 'ghost'} 
                    size="sm"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
              <Link to="/generator">
                <Button 
                  variant={isActive('/generator') ? 'default' : 'ghost'} 
                  size="sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Gerador
                </Button>
              </Link>
              <Link to="/scripts">
                <Button 
                  variant={isActive('/scripts') ? 'default' : 'ghost'} 
                  size="sm"
                >
                  Meus Roteiros
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ConnectionStatus />
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">{profile?.display_name}</span>
              <Badge variant={profile?.role === 'admin' ? 'default' : 'secondary'}>
                {profile?.role}
              </Badge>
            </div>
            <LLMSettings />
            <Button 
              onClick={handleSignOut} 
              variant="outline" 
              size="sm"
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              {isSigningOut ? 'Saindo...' : 'Sair'}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};