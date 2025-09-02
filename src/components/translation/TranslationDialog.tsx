import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Languages, 
  Globe, 
  Settings, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Clock,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { translationService, TranslationService, TranslationOptions, SupportedLanguage } from '@/lib/translation-service';

interface TranslationDialogProps {
  scriptId: string;
  currentLanguage: string;
  scriptTitle: string;
  onTranslationComplete?: () => void;
  children: React.ReactNode;
}

export function TranslationDialog({ 
  scriptId, 
  currentLanguage, 
  scriptTitle, 
  onTranslationComplete,
  children 
}: TranslationDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState<string>('');
  const [translationOptions, setTranslationOptions] = useState<TranslationOptions>({
    preserveFormatting: true,
    adaptIdioms: true,
    maintainTone: true,
    targetAudience: 'general'
  });

  const supportedLanguages = TranslationService.getSupportedLanguages();
  const availableLanguages = supportedLanguages.filter(lang => lang.code !== currentLanguage);

  const handleTranslate = async () => {
    if (!targetLanguage) {
      toast({
        title: "Idioma não selecionado",
        description: "Por favor, selecione um idioma de destino.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const result = await translationService.translateScript(
        scriptId,
        targetLanguage,
        translationOptions
      );

      if (result.success) {
        toast({
          title: "Tradução concluída",
          description: `Roteiro traduzido para ${TranslationService.getLanguageName(targetLanguage)} com sucesso!`,
        });
        
        setOpen(false);
        onTranslationComplete?.();
      } else {
        toast({
          title: "Erro na tradução",
          description: result.error || "Ocorreu um erro durante a tradução.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro na tradução",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLanguageFlag = (code: string) => {
    const language = TranslationService.getLanguageByCode(code);
    return language?.flag || '🌐';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Traduzir Roteiro
          </DialogTitle>
          <DialogDescription>
            Traduza "{scriptTitle}" para outro idioma usando IA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Language */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Idioma Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getLanguageFlag(currentLanguage)}</span>
                <div>
                  <p className="font-medium">{TranslationService.getLanguageName(currentLanguage)}</p>
                  <p className="text-sm text-muted-foreground">{currentLanguage}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Target Language Selection */}
          <div className="space-y-2">
            <Label htmlFor="target-language">Idioma de Destino</Label>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o idioma de destino" />
              </SelectTrigger>
              <SelectContent>
                {availableLanguages.map((language) => (
                  <SelectItem key={language.code} value={language.code}>
                    <div className="flex items-center gap-2">
                      <span>{language.flag}</span>
                      <span>{language.nativeName}</span>
                      <span className="text-muted-foreground">({language.name})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Translation Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Opções de Tradução
              </CardTitle>
              <CardDescription>
                Configure como a tradução deve ser processada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="preserve-formatting">Preservar Formatação</Label>
                  <p className="text-sm text-muted-foreground">
                    Mantém a estrutura e formatação original
                  </p>
                </div>
                <Switch
                  id="preserve-formatting"
                  checked={translationOptions.preserveFormatting}
                  onCheckedChange={(checked) => 
                    setTranslationOptions(prev => ({ ...prev, preserveFormatting: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="adapt-idioms">Adaptar Expressões</Label>
                  <p className="text-sm text-muted-foreground">
                    Adapta expressões idiomáticas para o idioma de destino
                  </p>
                </div>
                <Switch
                  id="adapt-idioms"
                  checked={translationOptions.adaptIdioms}
                  onCheckedChange={(checked) => 
                    setTranslationOptions(prev => ({ ...prev, adaptIdioms: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintain-tone">Manter Tom</Label>
                  <p className="text-sm text-muted-foreground">
                    Preserva o tom e estilo do conteúdo original
                  </p>
                </div>
                <Switch
                  id="maintain-tone"
                  checked={translationOptions.maintainTone}
                  onCheckedChange={(checked) => 
                    setTranslationOptions(prev => ({ ...prev, maintainTone: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="target-audience">Público-Alvo</Label>
                <Select 
                  value={translationOptions.targetAudience} 
                  onValueChange={(value) => 
                    setTranslationOptions(prev => ({ ...prev, targetAudience: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Geral</SelectItem>
                    <SelectItem value="young">Jovens (13-25 anos)</SelectItem>
                    <SelectItem value="adult">Adultos (25+ anos)</SelectItem>
                    <SelectItem value="professional">Profissional</SelectItem>
                    <SelectItem value="academic">Acadêmico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {targetLanguage && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Preview da Tradução
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getLanguageFlag(currentLanguage)}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-2xl">{getLanguageFlag(targetLanguage)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Traduzindo para: <strong>{TranslationService.getLanguageName(targetLanguage)}</strong>
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {translationOptions.preserveFormatting && (
                    <Badge variant="secondary" className="text-xs">Formatação</Badge>
                  )}
                  {translationOptions.adaptIdioms && (
                    <Badge variant="secondary" className="text-xs">Expressões</Badge>
                  )}
                  {translationOptions.maintainTone && (
                    <Badge variant="secondary" className="text-xs">Tom</Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {translationOptions.targetAudience}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleTranslate}
              disabled={loading || !targetLanguage}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traduzindo...
                </>
              ) : (
                <>
                  <Languages className="mr-2 h-4 w-4" />
                  Traduzir
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
