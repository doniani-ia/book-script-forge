import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, BookOpen, Trash2, FileText, Loader2, Play, RefreshCw, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { bookProcessingService } from '@/lib/book-processing-service';
import { generateUniqueFilename, isAllowedFileType, getFileExtension } from '@/lib/file-utils';
import { useAuth } from '@/components/auth/AuthProvider';

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
  const { user, profile, loading: authLoading } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    file: null as File | null
  });
  const { toast } = useToast();

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to generator if not admin
  if (profile?.role !== 'admin') {
    return <Navigate to="/generator" replace />;
  }

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

    // Validate file type
    if (!isAllowedFileType(formData.file.name)) {
      toast({
        title: "Tipo de arquivo não suportado",
        description: "Apenas PDF, TXT, DOC, DOCX e EPUB são permitidos.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const fileName = generateUniqueFilename(formData.file.name);
      const filePath = `books/${fileName}`;
      const fileExt = getFileExtension(formData.file.name);

      console.log('Uploading file to storage:', filePath);
      const { error: uploadError } = await supabase.storage
        .from('books')
        .upload(filePath, formData.file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }
      
      console.log('File uploaded successfully to storage');

      // Then create book record
      console.log('Creating book record in database');
      const { error: insertError } = await supabase
        .from('books')
        .insert({
          title: formData.title,
          author: formData.author || null,
          file_path: filePath,
          file_size: formData.file.size,
          file_type: fileExt,
          status: 'uploading',
          uploaded_by: (await supabase.auth.getUser()).data.user?.id || ''
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw insertError;
      }
      
      console.log('Book record created successfully');

      // Get the inserted book ID for processing
      console.log('Getting book ID for processing');
      const { data: insertedBook } = await supabase
        .from('books')
        .select('id')
        .eq('file_path', filePath)
        .single();

      if (insertedBook) {
        console.log('Starting automatic processing for book:', insertedBook.id);
        // Start processing automatically
        try {
          await bookProcessingService.processBook(insertedBook.id);
          console.log('Book processing completed successfully');
        } catch (processError) {
          console.error('Error processing book:', processError);
          // Don't throw here, just log the error
        }
      } else {
        console.error('Could not find inserted book for processing');
      }

      toast({
        title: "Livro enviado com sucesso",
        description: "O processamento foi iniciado automaticamente.",
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
    if (!confirm('Tem certeza que deseja excluir este livro? Esta ação não pode ser desfeita.')) return;

    try {
      const result = await bookProcessingService.deleteBook(id);

      if (result.success) {
        toast({
          title: "Livro excluído completamente",
          description: "Livro, chunks e arquivo foram removidos com sucesso.",
        });
      } else {
        toast({
          title: "Erro ao excluir",
          description: result.error || "Ocorreu um erro ao excluir o livro.",
          variant: "destructive",
        });
      }

      // Refresh the books list
      fetchBooks();

    } catch (error: any) {
      console.error('Error in delete process:', error);
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleProcessBook = async (id: string) => {
    try {
      toast({
        title: "Iniciando processamento",
        description: "O livro está sendo processado...",
      });

      await bookProcessingService.processBook(id);
      
      toast({
        title: "Processamento concluído",
        description: "O livro foi processado com sucesso.",
      });
      
      fetchBooks();
    } catch (error: any) {
      toast({
        title: "Erro no processamento",
        description: error.message || "Ocorreu um erro ao processar o livro.",
        variant: "destructive",
      });
    }
  };

  const handleRefreshStatus = async () => {
    await fetchBooks();
    toast({
      title: "Status atualizado",
      description: "Lista de livros atualizada.",
    });
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
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Estatísticas da Biblioteca
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshStatus}
                title="Atualizar status"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
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
                      <div className="flex items-center gap-2">
                        {book.status === 'uploading' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleProcessBook(book.id)}
                            title="Processar livro"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {book.status === 'processing' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleProcessBook(book.id)}
                            title="Reprocessar livro"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBook(book.id)}
                          title="Excluir livro"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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