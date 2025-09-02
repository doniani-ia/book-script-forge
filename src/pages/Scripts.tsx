import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Calendar,
  Clock,
  Globe,
  Mic,
  Volume2,
  Loader2,
  Languages
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { TranslationDialog } from '@/components/translation/TranslationDialog';
import { useNavigate } from 'react-router-dom';

interface Script {
  id: string;
  title: string;
  theme: string;
  duration_minutes: number;
  language_style: string;
  environment: string;
  target_language: string;
  content_portuguese: string | null;
  content_final: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_tags: string[] | null;
  thumbnail_prompt: string | null;
  status: 'draft' | 'approved' | 'final';
  created_at: string;
  updated_at: string;
}

export default function Scripts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scriptToDelete, setScriptToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScripts(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar roteiros",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredScripts = scripts.filter(script => {
    const matchesSearch = script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.theme.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || script.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEditScript = (script: Script) => {
    setSelectedScript(script);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedScript) return;

    try {
      const { error } = await supabase
        .from('scripts')
        .update({
          title: selectedScript.title,
          theme: selectedScript.theme,
          duration_minutes: selectedScript.duration_minutes,
          language_style: selectedScript.language_style,
          environment: selectedScript.environment,
          target_language: selectedScript.target_language,
          seo_title: selectedScript.seo_title,
          seo_description: selectedScript.seo_description,
          seo_tags: selectedScript.seo_tags,
          thumbnail_prompt: selectedScript.thumbnail_prompt,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedScript.id);

      if (error) throw error;

      toast({
        title: "Roteiro atualizado",
        description: "As alterações foram salvas com sucesso.",
      });

      setEditDialogOpen(false);
      setSelectedScript(null);
      fetchScripts();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteScript = async () => {
    if (!scriptToDelete) return;

    try {
      const { error } = await supabase
        .from('scripts')
        .delete()
        .eq('id', scriptToDelete);

      if (error) throw error;

      toast({
        title: "Roteiro excluído",
        description: "O roteiro foi removido com sucesso.",
      });

      setDeleteDialogOpen(false);
      setScriptToDelete(null);
      fetchScripts();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Rascunho</Badge>;
      case 'approved':
        return <Badge variant="default">Aprovado</Badge>;
      case 'final':
        return <Badge variant="outline">Final</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportScript = (script: Script) => {
    const content = script.content_final || script.content_portuguese || '';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${script.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Meus Roteiros</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie todos os seus roteiros de vídeo
          </p>
        </div>
        <Button onClick={() => navigate('/generator')}>
          <FileText className="mr-2 h-4 w-4" />
          Novo Roteiro
        </Button>
      </div>

      {/* Filtros e Busca */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por título ou tema..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="final">Final</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Roteiros */}
      {filteredScripts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum roteiro encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece criando seu primeiro roteiro de vídeo.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => navigate('/generator')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Criar Primeiro Roteiro
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredScripts.map((script) => (
            <Card key={script.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{script.title}</CardTitle>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {getStatusBadge(script.status)}
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {script.duration_minutes} min
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {script.target_language}
                      </Badge>
                    </div>
                    <CardDescription>
                      <strong>Tema:</strong> {script.theme} • 
                      <strong> Estilo:</strong> {script.language_style} • 
                      <strong> Ambiente:</strong> {script.environment}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <TranslationDialog
                      scriptId={script.id}
                      currentLanguage={script.target_language}
                      scriptTitle={script.title}
                      onTranslationComplete={fetchScripts}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        title="Traduzir roteiro"
                      >
                        <Languages className="h-4 w-4" />
                      </Button>
                    </TranslationDialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditScript(script)}
                      title="Editar roteiro"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportScript(script)}
                      title="Exportar roteiro"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setScriptToDelete(script.id);
                        setDeleteDialogOpen(true);
                      }}
                      title="Excluir roteiro"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Criado em {formatDate(script.created_at)}
                    </span>
                    {script.updated_at !== script.created_at && (
                      <span className="flex items-center gap-1">
                        <Edit className="h-4 w-4" />
                        Atualizado em {formatDate(script.updated_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {script.content_portuguese && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Mic className="h-3 w-3" />
                        Português
                      </Badge>
                    )}
                    {script.content_final && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Volume2 className="h-3 w-3" />
                        Final
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Roteiro</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias no seu roteiro.
            </DialogDescription>
          </DialogHeader>
          {selectedScript && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={selectedScript.title}
                  onChange={(e) => setSelectedScript({...selectedScript, title: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="theme">Tema</Label>
                <Input
                  id="theme"
                  value={selectedScript.theme}
                  onChange={(e) => setSelectedScript({...selectedScript, theme: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duração (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={selectedScript.duration_minutes}
                    onChange={(e) => setSelectedScript({...selectedScript, duration_minutes: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="language">Idioma</Label>
                  <Input
                    id="language"
                    value={selectedScript.target_language}
                    onChange={(e) => setSelectedScript({...selectedScript, target_language: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="languageStyle">Estilo de Linguagem</Label>
                <Input
                  id="languageStyle"
                  value={selectedScript.language_style}
                  onChange={(e) => setSelectedScript({...selectedScript, language_style: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="environment">Ambiente</Label>
                <Input
                  id="environment"
                  value={selectedScript.environment}
                  onChange={(e) => setSelectedScript({...selectedScript, environment: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="seoTitle">Título SEO</Label>
                <Input
                  id="seoTitle"
                  value={selectedScript.seo_title || ''}
                  onChange={(e) => setSelectedScript({...selectedScript, seo_title: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="seoDescription">Descrição SEO</Label>
                <Textarea
                  id="seoDescription"
                  value={selectedScript.seo_description || ''}
                  onChange={(e) => setSelectedScript({...selectedScript, seo_description: e.target.value})}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="thumbnailPrompt">Prompt da Thumbnail</Label>
                <Textarea
                  id="thumbnailPrompt"
                  value={selectedScript.thumbnail_prompt || ''}
                  onChange={(e) => setSelectedScript({...selectedScript, thumbnail_prompt: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este roteiro? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteScript}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
