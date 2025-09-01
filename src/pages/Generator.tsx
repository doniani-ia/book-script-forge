import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Wand2, Clock, Globe, Mic, Volume2, Eye } from 'lucide-react';

export default function Generator() {
  const [formData, setFormData] = useState({
    theme: '',
    duration: '',
    languageStyle: '',
    environment: '',
    targetLanguage: 'pt-BR'
  });
  
  const [loading, setLoading] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate script generation
    setTimeout(() => {
      setGeneratedScript({
        title: 'Como Transformar Sua Vida Financeira',
        contentPortuguese: 'Script gerado em português baseado nos livros indexados...',
        seoTitle: 'Transforme Sua Vida Financeira em 30 Dias | Guia Completo',
        seoDescription: 'Descubra as estratégias dos maiores investidores para transformar sua situação financeira.',
        seoTags: ['finanças', 'investimentos', 'dinheiro', 'riqueza'],
        thumbnailPrompt: 'Uma pessoa confiante segurando dinheiro com gráficos de crescimento ao fundo'
      });
      setLoading(false);
    }, 3000);
  };

  const handleApprove = () => {
    // Here would be the logic to generate final script in target language
    console.log('Script approved, generating final version...');
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Gerador de Roteiros para YouTube</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Crie roteiros únicos e envolventes baseados no conhecimento de livros indexados. 
          Apenas digite o tema e configure suas preferências.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Configurações do Roteiro
            </CardTitle>
            <CardDescription>
              Defina o tema e as preferências para seu roteiro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">Tema do Vídeo *</Label>
                <Textarea
                  id="theme"
                  placeholder="Ex: Como investir na bolsa de valores para iniciantes"
                  value={formData.theme}
                  onChange={(e) => setFormData({...formData, theme: e.target.value})}
                  required
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Duração (minutos)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="60"
                    placeholder="10"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Idioma Final
                  </Label>
                  <Select
                    value={formData.targetLanguage}
                    onValueChange={(value) => setFormData({...formData, targetLanguage: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    Estilo da Linguagem
                  </Label>
                  <Select
                    value={formData.languageStyle}
                    onValueChange={(value) => setFormData({...formData, languageStyle: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estilo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="descontraida">Descontraída</SelectItem>
                      <SelectItem value="narrativa">Narrativa</SelectItem>
                      <SelectItem value="inspiracional">Inspiracional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Ambiente
                  </Label>
                  <Select
                    value={formData.environment}
                    onValueChange={(value) => setFormData({...formData, environment: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ambiente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="calmo">Calmo</SelectItem>
                      <SelectItem value="suspense">Suspense</SelectItem>
                      <SelectItem value="motivacional">Motivacional</SelectItem>
                      <SelectItem value="educativo">Educativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Gerando Roteiro...' : 'Gerar Roteiro'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Generated Script Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Roteiro Gerado
            </CardTitle>
            <CardDescription>
              Revise o roteiro e aprove para gerar a versão final
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : generatedScript ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Título Sugerido</h3>
                  <p className="text-sm bg-muted p-3 rounded-lg">{generatedScript.seoTitle}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Roteiro (Português)</h3>
                  <div className="text-sm bg-muted p-4 rounded-lg max-h-40 overflow-y-auto">
                    {generatedScript.contentPortuguese}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">SEO</h3>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Descrição:</p>
                    <p className="text-sm">{generatedScript.seoDescription}</p>
                    <p className="text-xs text-muted-foreground">Tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {generatedScript.seoTags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Prompt para Thumbnail</h3>
                  <p className="text-sm bg-muted p-3 rounded-lg">{generatedScript.thumbnailPrompt}</p>
                </div>

                <Button onClick={handleApprove} className="w-full">
                  Aprovar e Gerar Versão Final
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Preencha o formulário e clique em "Gerar Roteiro" para começar
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}