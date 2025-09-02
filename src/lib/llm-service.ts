import { supabase } from '@/integrations/supabase/client';
import { bookProcessingService } from './book-processing-service';

export interface LLMProvider {
  name: string;
  models: Array<{
    id: string;
    name: string;
  }>;
}

export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface UserSettings {
  llm_provider: string;
  llm_model: string;
  openai_api_key?: string;
  claude_api_key?: string;
  gemini_api_key?: string;
}

export class LLMService {
  private settings: UserSettings | null = null;
  private currentUserId: string | null = null;

  async initialize(userId: string): Promise<void> {
    this.currentUserId = userId;
    
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch user settings: ${error.message}`);
    }

    this.settings = data || {
      llm_provider: 'openai',
      llm_model: 'gpt-4o-mini',
      openai_api_key: '',
      claude_api_key: '',
      gemini_api_key: ''
    };
  }

  async generateScript(
    theme: string,
    duration: number,
    languageStyle: string,
    environment: string,
    relevantContent?: string[]
  ): Promise<LLMResponse> {
    if (!this.settings) {
      throw new Error('LLMService not initialized');
    }

    // Search for relevant content using RAG if not provided
    let ragContent: string[] = relevantContent || [];
    if (ragContent.length === 0 && this.currentUserId) {
      try {
        const relevantChunks = await bookProcessingService.searchRelevantContent(theme, this.currentUserId, 3);
        ragContent = relevantChunks.map(chunk => chunk.content);
      } catch (error) {
        console.warn('RAG search failed, proceeding without relevant content:', error);
      }
    }

    const prompt = this.buildScriptPrompt(theme, duration, languageStyle, environment, ragContent);

    switch (this.settings.llm_provider) {
      case 'openai':
        return this.callOpenAI(prompt);
      case 'claude':
        return this.callClaude(prompt);
      case 'gemini':
        return this.callGemini(prompt);
      default:
        throw new Error(`Unsupported LLM provider: ${this.settings.llm_provider}`);
    }
  }

  async generateFinalScript(
    portugueseScript: string,
    targetLanguage: string
  ): Promise<LLMResponse> {
    if (!this.settings) {
      throw new Error('LLMService not initialized');
    }

    const prompt = this.buildTranslationPrompt(portugueseScript, targetLanguage);

    switch (this.settings.llm_provider) {
      case 'openai':
        return this.callOpenAI(prompt);
      case 'claude':
        return this.callClaude(prompt);
      case 'gemini':
        return this.callGemini(prompt);
      default:
        throw new Error(`Unsupported LLM provider: ${this.settings.llm_provider}`);
    }
  }

  private buildScriptPrompt(
    theme: string,
    duration: number,
    languageStyle: string,
    environment: string,
    relevantContent?: string[]
  ): string {
    const contentContext = relevantContent && relevantContent.length > 0 
      ? `\n\nCONTEÚDO RELEVANTE DOS LIVROS:\n${relevantContent.join('\n\n')}`
      : '';

    return `Você é um especialista em criação de roteiros para YouTube. Crie um roteiro envolvente e bem estruturado baseado nas informações fornecidas.

TEMA: ${theme}
DURAÇÃO: ${duration} minutos
ESTILO DE LINGUAGEM: ${languageStyle}
AMBIENTE: ${environment}${contentContext}

INSTRUÇÕES:
1. Crie um roteiro estruturado com introdução, desenvolvimento e conclusão
2. Use o estilo de linguagem ${languageStyle}
3. Mantenha o ambiente ${environment} ao longo do vídeo
4. Inclua elementos de engajamento (perguntas, call-to-actions)
5. Estruture o conteúdo para ${duration} minutos de duração
6. Use as informações dos livros quando relevante para enriquecer o conteúdo

FORMATO DE RESPOSTA (JSON):
{
  "title": "Título atrativo do vídeo",
  "content": "Roteiro completo em português brasileiro",
  "seo_title": "Título otimizado para SEO",
  "seo_description": "Descrição otimizada para SEO (máx 160 caracteres)",
  "seo_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "thumbnail_prompt": "Prompt detalhado para gerar thumbnail"
}

Responda APENAS com o JSON válido, sem texto adicional.`;
  }

  private buildTranslationPrompt(portugueseScript: string, targetLanguage: string): string {
    const languageNames = {
      'en': 'inglês',
      'es': 'espanhol',
      'fr': 'francês',
      'pt-BR': 'português brasileiro'
    };

    const targetLangName = languageNames[targetLanguage as keyof typeof languageNames] || targetLanguage;

    return `Traduza o seguinte roteiro de YouTube do português brasileiro para ${targetLangName}.

ROTEIRO ORIGINAL:
${portugueseScript}

INSTRUÇÕES:
1. Mantenha a estrutura e formatação do roteiro
2. Adapte expressões idiomáticas para o idioma de destino
3. Preserve o tom e estilo do conteúdo original
4. Mantenha elementos de engajamento (perguntas, call-to-actions)
5. Certifique-se de que a tradução soe natural no idioma de destino

Responda APENAS com o roteiro traduzido, sem texto adicional.`;
  }

  private async callOpenAI(prompt: string): Promise<LLMResponse> {
    if (!this.settings?.openai_api_key) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.settings.openai_api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.settings.llm_model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    return {
      content,
      usage: data.usage
    };
  }

  private async callClaude(prompt: string): Promise<LLMResponse> {
    if (!this.settings?.claude_api_key) {
      throw new Error('Claude API key not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.settings.claude_api_key,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.settings.llm_model,
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Claude API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text;

    if (!content) {
      throw new Error('No content received from Claude');
    }

    return {
      content,
      usage: data.usage
    };
  }

  private async callGemini(prompt: string): Promise<LLMResponse> {
    if (!this.settings?.gemini_api_key) {
      throw new Error('Gemini API key not configured');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.settings.llm_model}:generateContent?key=${this.settings.gemini_api_key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No content received from Gemini');
    }

    return {
      content,
      usage: data.usageMetadata
    };
  }
}

// Singleton instance
export const llmService = new LLMService();
