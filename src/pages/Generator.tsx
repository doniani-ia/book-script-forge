import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Wand2, Clock, Globe, Mic, Volume2, Eye } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { llmService } from '@/lib/llm-service';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function Generator() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    theme: '',
    duration: '',
    languageStyle: '',
    environment: '',
    targetLanguage: 'pt-BR'
  });
  
  const [loading, setLoading] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<any>(null);
  const [scriptId, setScriptId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para gerar roteiros.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Initialize LLM service
      await llmService.initialize(user.id);

      // Create initial script record
      const { data: scriptData, error: scriptError } = await supabase
        .from('scripts')
        .insert({
          user_id: user.id,
          title: `Roteiro: ${formData.theme.substring(0, 50)}...`,
          theme: formData.theme,
          duration_minutes: parseInt(formData.duration),
          language_style: formData.languageStyle,
          environment: formData.environment,
          target_language: formData.targetLanguage,
          status: 'draft'
        })
        .select()
        .single();

      if (scriptError) {
        throw new Error(`Failed to create script: ${scriptError.message}`);
      }

      setScriptId(scriptData.id);

      // Generate script using LLM
      const response = await llmService.generateScript(
        formData.theme,
        parseInt(formData.duration),
        formData.languageStyle,
        formData.environment
      );

      // Parse the JSON response
      let scriptContent;
      try {
        scriptContent = JSON.parse(response.content);
      } catch (parseError) {
        // If JSON parsing fails, create a structured response
        scriptContent = {
          title: `Roteiro: ${formData.theme}`,
          content: response.content,
          seo_title: `Roteiro: ${formData.theme}`,
          seo_description: `Roteiro sobre ${formData.theme}`,
          seo_tags: formData.theme.split(' ').slice(0, 5),
          thumbnail_prompt: `Thumbnail para vídeo sobre ${formData.theme}`
        };
      }

      // Update script with generated content
      const { error: updateError } = await supabase
        .from('scripts')
        .update({
          title: scriptContent.title,
          content_portuguese: scriptContent.content,
          seo_title: scriptContent.seo_title,
          seo_description: scriptContent.seo_description,
          seo_tags: scriptContent.seo_tags,
          thumbnail_prompt: scriptContent.thumbnail_prompt,
          status: 'draft'
        })
        .eq('id', scriptData.id);

      if (updateError) {
        throw new Error(`Failed to update script: ${updateError.message}`);
      }

      setGeneratedScript({
        title: scriptContent.title,
        contentPortuguese: scriptContent.content,
        seoTitle: scriptContent.seo_title,
        seoDescription: scriptContent.seo_description,
        seoTags: scriptContent.seo_tags,
        thumbnailPrompt: scriptContent.thumbnail_prompt
      });

      toast({
        title: "Sucesso",
        description: "Roteiro gerado com sucesso!",
      });

    } catch (error: any) {
      console.error('Error generating script:', error);
      toast({
        title: "Erro na geração",
        description: error.message || "Ocorreu um erro ao gerar o roteiro.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!user || !scriptId || !generatedScript) {
      toast({
        title: "Erro",
        description: "Dados insuficientes para aprovar o roteiro.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Initialize LLM service
      await llmService.initialize(user.id);

      // Generate final script in target language
      const response = await llmService.generateFinalScript(
        generatedScript.contentPortuguese,
        formData.targetLanguage
      );

      // Update script with final content
      const { error: updateError } = await supabase
        .from('scripts')
        .update({
          content_final: response.content,
          status: 'final'
        })
        .eq('id', scriptId);

      if (updateError) {
        throw new Error(`Failed to update script: ${updateError.message}`);
      }

      // Update local state
      setGeneratedScript({
        ...generatedScript,
        contentFinal: response.content
      });

      toast({
        title: "Sucesso",
        description: "Versão final gerada com sucesso!",
      });

    } catch (error: any) {
      console.error('Error generating final script:', error);
      toast({
        title: "Erro na tradução",
        description: error.message || "Ocorreu um erro ao gerar a versão final.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

                {generatedScript.contentFinal && (
                  <div>
                    <h3 className="font-semibold mb-2">Roteiro Final ({formData.targetLanguage})</h3>
                    <div className="text-sm bg-green-50 dark:bg-green-950 p-4 rounded-lg max-h-40 overflow-y-auto border border-green-200 dark:border-green-800">
                      {generatedScript.contentFinal}
                    </div>
                  </div>
                )}

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

                <Button 
                  onClick={handleApprove} 
                  className="w-full"
                  disabled={loading || generatedScript.contentFinal}
                >
                  {loading ? 'Gerando Versão Final...' : 
                   generatedScript.contentFinal ? 'Versão Final Gerada' : 
                   'Aprovar e Gerar Versão Final'}
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