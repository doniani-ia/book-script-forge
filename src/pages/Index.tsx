import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, BookOpen, Wand2, Globe, Clock, Zap, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

const Index = () => {
  const { profile, user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-12 space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <Badge variant="secondary" className="px-4 py-2">
            <Zap className="h-4 w-4 mr-2" />
            Powered by AI + RAG
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            YouTube Script Generator
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Crie roteiros únicos e envolventes para YouTube baseados no conhecimento de livros indexados. 
            IA avançada + Retrieval Augmented Generation para conteúdo de qualidade superior.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            // Usuário logado - mostrar botões de funcionalidades
            <>
              <Link to="/generator">
                <Button size="lg" className="w-full sm:w-auto">
                  <Wand2 className="h-5 w-5 mr-2" />
                  Criar Roteiro Agora
                </Button>
              </Link>
              <Link to="/scripts">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <FileText className="h-5 w-5 mr-2" />
                  Meus Roteiros
                </Button>
              </Link>
              {profile?.role === 'admin' && (
                <Link to="/admin">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Gerenciar Biblioteca
                  </Button>
                </Link>
              )}
            </>
          ) : (
            // Usuário não logado - mostrar botões de login
            <>
              <Link to="/login">
                <Button size="lg" className="w-full sm:w-auto">
                  <LogIn className="h-5 w-5 mr-2" />
                  Fazer Login
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <UserPlus className="h-5 w-5 mr-2" />
                  Criar Conta
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="text-center">
          <CardHeader>
            <BookOpen className="h-12 w-12 mx-auto text-primary" />
            <CardTitle>Base de Conhecimento</CardTitle>
            <CardDescription>
              Roteiros baseados em livros indexados para conteúdo mais profundo e original
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <Wand2 className="h-12 w-12 mx-auto text-primary" />
            <CardTitle>IA Avançada</CardTitle>
            <CardDescription>
              Tecnologia RAG para recuperar informações relevantes e gerar conteúdo coerente
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <Globe className="h-12 w-12 mx-auto text-primary" />
            <CardTitle>Multilíngue</CardTitle>
            <CardDescription>
              Geração inicial em português com tradução para múltiplos idiomas
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <Clock className="h-12 w-12 mx-auto text-primary" />
            <CardTitle>Personalização</CardTitle>
            <CardDescription>
              Configure duração, estilo, ambiente e tom para cada tipo de conteúdo
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <FileText className="h-12 w-12 mx-auto text-primary" />
            <CardTitle>SEO Integrado</CardTitle>
            <CardDescription>
              Títulos, descrições e tags otimizadas automaticamente para melhor alcance
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <Zap className="h-12 w-12 mx-auto text-primary" />
            <CardTitle>Processo Ágil</CardTitle>
            <CardDescription>
              Fluxo simplificado: tema → geração → validação → entrega final
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* How it Works */}
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-center">Como Funciona</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mx-auto">
              1
            </div>
            <h3 className="font-semibold">Digite o Tema</h3>
            <p className="text-sm text-muted-foreground">
              Informe o assunto do seu vídeo e configure as preferências
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mx-auto">
              2
            </div>
            <h3 className="font-semibold">IA Gera Roteiro</h3>
            <p className="text-sm text-muted-foreground">
              RAG busca informações nos livros e cria roteiro estruturado
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mx-auto">
              3
            </div>
            <h3 className="font-semibold">Valide e Aprove</h3>
            <p className="text-sm text-muted-foreground">
              Revise o roteiro em português e solicite ajustes se necessário
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mx-auto">
              4
            </div>
            <h3 className="font-semibold">Receba o Final</h3>
            <p className="text-sm text-muted-foreground">
              Versão final no idioma escolhido, pronta para gravar
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center space-y-6 bg-muted/30 rounded-2xl p-8">
        <h2 className="text-3xl font-bold">Pronto para Começar?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Transforme seus conhecimentos em roteiros envolventes e aumente 
          o engajamento dos seus vídeos no YouTube.
        </p>
        <Link to="/generator">
          <Button size="lg">
            <FileText className="h-5 w-5 mr-2" />
            Criar Primeiro Roteiro
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
