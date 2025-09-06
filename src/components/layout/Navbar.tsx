import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, BookOpen, LogOut, User, Loader2, Settings, ChevronDown } from 'lucide-react';
import { ScriptForgeIcon } from '@/components/ui/ScriptForgeIcon';
import { Link, useLocation } from 'react-router-dom';
import { LLMSettings } from '@/components/settings/LLMSettings';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export const Navbar = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showLLMSettings, setShowLLMSettings] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    if (isSigningOut) return;

    try {
      setIsSigningOut(true);
      
      // Professional logout procedure
      await signOut();
      
      // AuthProvider will handle the redirect to home page
      // and cleanup of all user data, cache, etc.
      
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
              <ScriptForgeIcon size={24} />
              <span className="font-bold text-lg">Script Forge</span>
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
            
            {/* User Menu Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 h-auto p-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">{profile?.display_name}</span>
                    <Badge variant={profile?.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                      {profile?.role}
                    </Badge>
                    <ChevronDown className="h-3 w-3" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs leading-none text-muted-foreground">
                      {profile?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowLLMSettings(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações da IA</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="text-red-600 focus:text-red-600"
                >
                  {isSigningOut ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  <span>{isSigningOut ? 'Saindo...' : 'Sair'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* LLM Settings Modal */}
      {showLLMSettings && (
        <LLMSettings onClose={() => setShowLLMSettings(false)} />
      )}
    </nav>
  );
};