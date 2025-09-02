import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Settings, Brain } from 'lucide-react';

interface UserSettings {
  llm_provider: string;
  llm_model: string;
  openai_api_key?: string;
}

const LLM_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: [
      { 
        id: 'gpt-4o', 
        name: 'GPT-4o', 
        description: 'Modelo mais avançado com contexto de 128k tokens',
        contextWindow: '128k tokens',
        pricing: 'Premium'
      },
      { 
        id: 'gpt-4o-mini', 
        name: 'GPT-4o Mini', 
        description: 'Modelo otimizado para custo-benefício com contexto de 128k tokens',
        contextWindow: '128k tokens',
        pricing: 'Econômico'
      },
      { 
        id: 'gpt-4-turbo', 
        name: 'GPT-4 Turbo', 
        description: 'Versão turbo do GPT-4 com contexto de 128k tokens',
        contextWindow: '128k tokens',
        pricing: 'Premium'
      },
      { 
        id: 'gpt-4', 
        name: 'GPT-4', 
        description: 'Modelo GPT-4 padrão com contexto de 8k tokens',
        contextWindow: '8k tokens',
        pricing: 'Premium'
      },
      { 
        id: 'gpt-3.5-turbo', 
        name: 'GPT-3.5 Turbo', 
        description: 'Modelo rápido e econômico com contexto de 16k tokens',
        contextWindow: '16k tokens',
        pricing: 'Econômico'
      }
    ]
  }
};

export const LLMSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState<UserSettings>({
    llm_provider: 'openai',
    llm_model: 'gpt-4o-mini',
    openai_api_key: ''
  });

  useEffect(() => {
    if (open && user) {
      fetchUserSettings();
    }
  }, [open, user]);

  const fetchUserSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          llm_provider: data.llm_provider || 'openai',
          llm_model: data.llm_model || 'gpt-4o-mini',
          openai_api_key: data.openai_api_key || ''
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          llm_provider: settings.llm_provider,
          llm_model: settings.llm_model,
          openai_api_key: settings.openai_api_key
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!"
      });
      setOpen(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleProviderChange = (provider: string) => {
    const defaultModel = LLM_PROVIDERS[provider as keyof typeof LLM_PROVIDERS]?.models[0]?.id || '';
    setSettings(prev => ({
      ...prev,
      llm_provider: provider,
      llm_model: defaultModel
    }));
  };

  const currentProvider = LLM_PROVIDERS[settings.llm_provider as keyof typeof LLM_PROVIDERS];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configurações LLM
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Configurações de IA
          </DialogTitle>
          <DialogDescription>
            Configure qual provedor de IA e modelo usar para gerar seus roteiros.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Provider Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Provedor de IA</CardTitle>
                <CardDescription>
                  Escolha qual serviço de IA usar para gerar conteúdo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="provider">Provedor</Label>
                  <Select
                    value={settings.llm_provider}
                    onValueChange={handleProviderChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um provedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LLM_PROVIDERS).map(([key, provider]) => (
                        <SelectItem key={key} value={key}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="model">Modelo</Label>
                  <Select
                    value={settings.llm_model}
                    onValueChange={(model) => setSettings(prev => ({ ...prev, llm_model: model }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentProvider?.models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{model.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {model.contextWindow} • {model.pricing}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Informações do modelo selecionado */}
                  {currentProvider && (
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      {(() => {
                        const selectedModel = currentProvider.models.find(m => m.id === settings.llm_model);
                        return selectedModel ? (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{selectedModel.name}</p>
                            <p className="text-xs text-muted-foreground">{selectedModel.description}</p>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>Contexto: {selectedModel.contextWindow}</span>
                              <span>Preço: {selectedModel.pricing}</span>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* API Key */}
            <Card>
              <CardHeader>
                <CardTitle>Chave de API OpenAI</CardTitle>
                <CardDescription>
                  Configure sua chave de API da OpenAI para gerar roteiros
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="openai_key">OpenAI API Key</Label>
                  <Input
                    id="openai_key"
                    type="password"
                    placeholder="sk-..."
                    value={settings.openai_api_key}
                    onChange={(e) => setSettings(prev => ({ ...prev, openai_api_key: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Sua chave de API é armazenada de forma segura e usada apenas para gerar roteiros.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};