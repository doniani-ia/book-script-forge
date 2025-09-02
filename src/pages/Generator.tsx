import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Wand2, Clock, Globe, Mic, Volume2, Eye, MapPin, CheckCircle, RotateCcw, Copy, Save } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { llmService } from '@/lib/llm-service';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TranslationService } from '@/lib/translation-service';
import { calculateScriptSize } from '@/lib/utils';

export default function Generator() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    theme: '',
    duration: '',
    languageStyle: '',
    environment: '',
    environmentDescription: '',
    targetLanguage: 'pt-BR'
  });
  
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
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

      // Generate script using LLM (without saving to database yet)
      const response = await llmService.generateScript(
        formData.theme,
        parseInt(formData.duration),
        formData.languageStyle,
        formData.environment,
        formData.environmentDescription
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

      setGeneratedScript({
        title: scriptContent.title,
        contentPortuguese: scriptContent.content,
        seoTitle: scriptContent.seo_title,
        seoDescription: scriptContent.seo_description,
        seoTags: scriptContent.seo_tags,
        thumbnailPrompt: scriptContent.thumbnail_prompt,
        contentFinal: null
      });

      toast({
        title: "Roteiro gerado com sucesso!",
        description: "Revise o roteiro e aprove para traduzir.",
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
    if (!user || !generatedScript) {
      toast({
        title: "Erro",
        description: "Dados insuficientes para aprovar o roteiro.",
        variant: "destructive",
      });
      return;
    }

    setTranslating(true);

    try {
      // Initialize LLM service
      await llmService.initialize(user.id);

      // Generate final script in target language (without saving to database yet)
      const response = await llmService.generateFinalScript(
        generatedScript.contentPortuguese,
        formData.targetLanguage,
        generatedScript.seoTitle,
        generatedScript.seoDescription,
        generatedScript.seoTags,
        generatedScript.thumbnailPrompt
      );

      // Parse the JSON response
      let translatedContent;
      try {
        translatedContent = JSON.parse(response.content);
      } catch (parseError) {
        // If JSON parsing fails, create a structured response with just the content
        translatedContent = {
          content: response.content,
          seo_title: generatedScript.seoTitle,
          seo_description: generatedScript.seoDescription,
          seo_tags: generatedScript.seoTags,
          thumbnail_prompt: generatedScript.thumbnailPrompt
        };
      }

      // Update local state only
      setGeneratedScript({
        ...generatedScript,
        contentFinal: translatedContent.content,
        seoTitleTranslated: translatedContent.seo_title,
        seoDescriptionTranslated: translatedContent.seo_description,
        seoTagsTranslated: translatedContent.seo_tags,
        thumbnailPromptTranslated: translatedContent.thumbnail_prompt
      });

      toast({
        title: "Tradução concluída!",
        description: "Roteiro traduzido com sucesso. Agora você pode salvar.",
      });

    } catch (error: any) {
      console.error('Error generating final script:', error);
      toast({
        title: "Erro na tradução",
        description: error.message || "Ocorreu um erro ao gerar a versão final.",
        variant: "destructive",
      });
    } finally {
      setTranslating(false);
    }
  };

  const handleRefazer = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para gerar roteiros.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setGeneratedScript(null);
    setScriptId(null);
    
    try {
      // Initialize LLM service
      await llmService.initialize(user.id);

      // Generate new script using LLM with same configurations
      const response = await llmService.generateScript(
        formData.theme,
        parseInt(formData.duration),
        formData.languageStyle,
        formData.environment,
        formData.environmentDescription
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

      setGeneratedScript({
        title: scriptContent.title,
        contentPortuguese: scriptContent.content,
        seoTitle: scriptContent.seo_title,
        seoDescription: scriptContent.seo_description,
        seoTags: scriptContent.seo_tags,
        thumbnailPrompt: scriptContent.thumbnail_prompt,
        contentFinal: null
      });

      toast({
        title: "Novo roteiro gerado!",
        description: "Roteiro refeito com as mesmas configurações.",
      });

    } catch (error: any) {
      console.error('Error regenerating script:', error);
      toast({
        title: "Erro ao refazer roteiro",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopiar = async () => {
    if (!generatedScript?.contentFinal) {
      toast({
        title: "Erro",
        description: "Nenhum roteiro traduzido para copiar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const contentToCopy = `TÍTULO: ${generatedScript.seoTitleTranslated || generatedScript.seoTitle}

ROTEIRO:
${generatedScript.contentFinal}

SEO:
Descrição: ${generatedScript.seoDescriptionTranslated || generatedScript.seoDescription}
Tags: ${(generatedScript.seoTagsTranslated || generatedScript.seoTags).join(', ')}

THUMBNAIL:
${generatedScript.thumbnailPromptTranslated || generatedScript.thumbnailPrompt}`;

      await navigator.clipboard.writeText(contentToCopy);
      toast({
        title: "Copiado!",
        description: "Roteiro completo traduzido copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o roteiro.",
        variant: "destructive",
      });
    }
  };

  const handleSalvar = async () => {
    if (!user || !generatedScript) {
      toast({
        title: "Erro",
        description: "Dados insuficientes para salvar o roteiro.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create script record in database
      const { data: scriptData, error: scriptError } = await supabase
        .from('scripts')
        .insert({
          user_id: user.id,
          title: generatedScript.title || `Roteiro: ${formData.theme.substring(0, 50)}...`,
          theme: formData.theme,
          duration_minutes: parseInt(formData.duration),
          language_style: formData.languageStyle,
          environment: formData.environment,
          target_language: formData.targetLanguage,
          content_portuguese: generatedScript.contentPortuguese,
          content_final: generatedScript.contentFinal,
          seo_title: generatedScript.seoTitleTranslated || generatedScript.seoTitle,
          seo_description: generatedScript.seoDescriptionTranslated || generatedScript.seoDescription,
          seo_tags: generatedScript.seoTagsTranslated || generatedScript.seoTags,
          thumbnail_prompt: generatedScript.thumbnailPromptTranslated || generatedScript.thumbnailPrompt,
          status: 'final'
        })
        .select()
        .single();

      if (scriptError) {
        throw new Error(`Failed to save script: ${scriptError.message}`);
      }

      setScriptId(scriptData.id);

      toast({
        title: "Roteiro salvo com sucesso!",
        description: "O roteiro foi salvo na sua biblioteca.",
      });

    } catch (error: any) {
      console.error('Error saving script:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar o roteiro.",
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

      {/* Configurações do Roteiro - Parte Superior */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Coluna 1: Tema do Vídeo */}
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

              {/* Coluna 2: Duração + Estilo da Linguagem */}
              <div className="space-y-4">
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
                  {formData.duration && (
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      <div className="font-medium">Tamanho do roteiro:</div>
                      <div>
                        {(() => {
                          const duration = parseInt(formData.duration);
                          if (duration > 0) {
                            const size = calculateScriptSize(duration);
                            return `${size.words.toLocaleString()} palavras ≈ ${size.characters.toLocaleString()} caracteres`;
                          }
                          return '';
                        })()}
                      </div>
                    </div>
                  )}
                </div>

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
              </div>

              {/* Coluna 3: Ambiente + Idioma Final */}
              <div className="space-y-4">
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

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Idioma Final
                  </Label>
                  <Select
                    value={formData.targetLanguage}
                    onValueChange={(value) => setFormData({...formData, targetLanguage: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o idioma final" />
                    </SelectTrigger>
                    <SelectContent>
                      {TranslationService.getSupportedLanguages().map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <div className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.portugueseName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Coluna 4: Descrição do Ambiente */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Descrição do Ambiente
                </Label>
                <Textarea
                  placeholder="Descreva livremente o ambiente, cenário, atmosfera ou contexto específico que deseja para o vídeo..."
                  value={formData.environmentDescription}
                  onChange={(e) => setFormData({...formData, environmentDescription: e.target.value})}
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  Ex: "Ambiente noturno com iluminação suave, cenário de biblioteca, atmosfera intimista..."
                </p>
                
                <Button type="submit" className="w-full mt-4" disabled={loading}>
                  <Wand2 className="h-4 w-4 mr-2" />
                  {loading ? 'Gerando Roteiro...' : 'Gerar Roteiro'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Roteiros - Lado Esquerdo e Direito */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Roteiro em Português - Lado Esquerdo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Roteiro em Português
            </CardTitle>
            <CardDescription>
              Roteiro gerado em português brasileiro
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
                  <h3 className="font-semibold mb-2">Roteiro Completo</h3>
                  {generatedScript.contentPortuguese && (
                    <div className="mb-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-2 rounded border border-blue-200 dark:border-blue-800">
                      <div className="font-medium">Tamanho Real do Roteiro:</div>
                      <div>
                        {(() => {
                          const content = generatedScript.contentPortuguese;
                          const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
                          const charCount = content.length;
                          const duration = parseInt(formData.duration);
                          const expectedSize = calculateScriptSize(duration);
                          
                          return (
                            <div className="space-y-1">
                              <div>Palavras: {wordCount.toLocaleString()} (esperado: {expectedSize.words.toLocaleString()})</div>
                              <div>Caracteres: {charCount.toLocaleString()} (esperado: {expectedSize.characters.toLocaleString()})</div>
                              <div className={`font-medium ${
                                Math.abs(wordCount - expectedSize.words) <= 50 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                              }`}>
                                {Math.abs(wordCount - expectedSize.words) <= 50 ? '✅ Tamanho adequado' : '⚠️ Tamanho pode precisar de ajuste'}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                  <div className="text-sm bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
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

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={handleRefazer} 
                    variant="outline"
                    disabled={loading}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {loading ? 'Refazendo...' : 'Refazer'}
                  </Button>
                  <Button 
                    onClick={handleApprove} 
                    disabled={loading || translating || generatedScript.contentFinal}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    {translating ? 'Traduzindo...' : 
                     generatedScript.contentFinal ? 'Traduzido' : 
                     'Aprovar e Traduzir'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Preencha o formulário e clique em "Gerar Roteiro" para começar
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roteiro Traduzido - Lado Direito */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Roteiro Traduzido
            </CardTitle>
            <CardDescription>
              Versão final no idioma selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {translating ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground">Traduzindo roteiro...</p>
                </div>
              </div>
            ) : generatedScript?.contentFinal ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Título Sugerido</h3>
                  <p className="text-sm bg-muted p-3 rounded-lg">
                    {generatedScript.seoTitleTranslated || generatedScript.seoTitle}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Roteiro Final ({formData.targetLanguage})</h3>
                  <div className="text-sm bg-green-50 dark:bg-green-950 p-4 rounded-lg max-h-96 overflow-y-auto border border-green-200 dark:border-green-800">
                    {generatedScript.contentFinal}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">SEO</h3>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Descrição:</p>
                    <p className="text-sm">
                      {generatedScript.seoDescriptionTranslated || generatedScript.seoDescription}
                    </p>
                    <p className="text-xs text-muted-foreground">Tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {(generatedScript.seoTagsTranslated || generatedScript.seoTags).map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Prompt para Thumbnail</h3>
                  <p className="text-sm bg-muted p-3 rounded-lg">
                    {generatedScript.thumbnailPromptTranslated || generatedScript.thumbnailPrompt}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Tradução concluída com sucesso!</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={handleCopiar} 
                    variant="outline"
                    disabled={loading}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                  <Button 
                    onClick={handleSalvar} 
                    disabled={loading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center space-y-2">
                  <Globe className="h-12 w-12 mx-auto opacity-50" />
                  <p>Aprove o roteiro em português para gerar a versão traduzida</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}