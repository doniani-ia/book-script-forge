import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Calendar, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Script {
  id: string;
  title: string;
  theme: string;
  duration_minutes: number;
  language_style: string;
  environment: string;
  target_language: string;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchScripts();
    }
  }, [user]);

  const fetchScripts = async () => {
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScripts(data || []);
    } catch (error) {
      console.error('Error fetching scripts:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar roteiros',
        description: 'Não foi possível carregar seus roteiros.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'final':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Rascunho';
      case 'approved':
        return 'Aprovado';
      case 'final':
        return 'Final';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Carregando roteiros...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meus Roteiros</h1>
          <p className="text-muted-foreground">
            Gerencie seus roteiros para YouTube
          </p>
        </div>
        <Link to="/create-script">
          <Button className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Novo Roteiro</span>
          </Button>
        </Link>
      </div>

      {scripts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum roteiro ainda</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando seu primeiro roteiro para YouTube
            </p>
            <Link to="/create-script">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Roteiro
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scripts.map((script) => (
            <Card key={script.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant={getStatusColor(script.status)}>
                    {getStatusLabel(script.status)}
                  </Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-1" />
                    {script.duration_minutes}min
                  </div>
                </div>
                <CardTitle className="line-clamp-2">{script.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {script.theme}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>
                    <strong>Estilo:</strong> {script.language_style}
                  </div>
                  <div>
                    <strong>Ambiente:</strong> {script.environment}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {format(new Date(script.created_at), "d 'de' MMM, yyyy", { locale: ptBR })}
                  </div>
                </div>
                <div className="mt-4">
                  <Link to={`/script/${script.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Ver Detalhes
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}