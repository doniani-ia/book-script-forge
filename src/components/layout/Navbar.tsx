import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, BookOpen, LogOut, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { LLMSettings } from '@/components/settings/LLMSettings';

export const Navbar = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

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
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">{profile?.display_name}</span>
              <Badge variant={profile?.role === 'admin' ? 'default' : 'secondary'}>
                {profile?.role}
              </Badge>
            </div>
            <LLMSettings />
            <Button onClick={signOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};