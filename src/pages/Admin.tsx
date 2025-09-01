import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, BookOpen, Trash2, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Book {
  id: string;
  title: string;
  author: string | null;
  file_type: string;
  file_size: number | null;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  created_at: string;
}

export default function Admin() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    file: null as File | null
  });
  const { toast } = useToast();

  const fetchBooks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar livros",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setBooks((data || []) as Book[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || !formData.title) return;

    setUploading(true);

    try {
      // First, upload file to storage
      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${Date.now()}-${formData.file.name}`;
      const filePath = `books/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('books')
        .upload(filePath, formData.file);

      if (uploadError) throw uploadError;

      // Then create book record
      const { error: insertError } = await supabase
        .from('books')
        .insert({
          title: formData.title,
          author: formData.author || null,
          file_path: filePath,
          file_size: formData.file.size,
          file_type: fileExt || 'unknown',
          status: 'uploading',
          uploaded_by: (await supabase.auth.getUser()).data.user?.id || ''
        });

      if (insertError) throw insertError;

      toast({
        title: "Livro enviado com sucesso",
        description: "O processamento será iniciado automaticamente.",
      });

      setFormData({ title: '', author: '', file: null });
      fetchBooks();

    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    }

    setUploading(false);
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este livro?')) return;

    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Livro excluído",
        description: "O livro foi removido com sucesso.",
      });
      fetchBooks();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      uploading: 'secondary',
      processing: 'outline',
      ready: 'default',
      error: 'destructive'
    } as const;

    const labels = {
      uploading: 'Enviando',
      processing: 'Processando',
      ready: 'Pronto',
      error: 'Erro'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Gerencie a biblioteca de livros que será usada como base de conhecimento 
          para a geração de roteiros.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Adicionar Novo Livro
            </CardTitle>
            <CardDescription>
              Faça upload de livros em PDF, DOC, EPUB ou TXT
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Livro *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Digite o título do livro"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">Autor</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({...formData, author: e.target.value})}
                  placeholder="Nome do autor (opcional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Arquivo *</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.epub,.txt"
                  onChange={(e) => setFormData({...formData, file: e.target.files?.[0] || null})}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: PDF, DOC, DOCX, EPUB, TXT (máx. 50MB)
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar Livro
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Estatísticas da Biblioteca
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {books.filter(b => b.status === 'ready').length}
                </div>
                <div className="text-sm text-muted-foreground">Livros Prontos</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-orange-500">
                  {books.filter(b => b.status === 'processing').length}
                </div>
                <div className="text-sm text-muted-foreground">Processando</div>
              </div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{books.length}</div>
              <div className="text-sm text-muted-foreground">Total de Livros</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Books Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Biblioteca de Livros
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell className="font-medium">{book.title}</TableCell>
                    <TableCell>{book.author || 'N/A'}</TableCell>
                    <TableCell className="uppercase">{book.file_type}</TableCell>
                    <TableCell>{formatFileSize(book.file_size)}</TableCell>
                    <TableCell>{getStatusBadge(book.status)}</TableCell>
                    <TableCell>
                      {new Date(book.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBook(book.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}