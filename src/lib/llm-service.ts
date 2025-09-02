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
}

export class LLMService {
  private settings: UserSettings | null = null;
  private currentUserId: string | null = null;

  /**
   * Calcula o tamanho do roteiro baseado na duração do vídeo
   * Fórmula: 160 palavras por minuto × 8 caracteres por palavra (incluindo espaços)
   * Adiciona 10% a mais na duração para cálculo mais preciso
   * @param durationMinutes Duração do vídeo em minutos
   * @returns Objeto com palavras e caracteres calculados
   */
  private calculateScriptSize(durationMinutes: number): { words: number; characters: number } {
    const wordsPerMinute = 160;
    const charactersPerWord = 8; // Incluindo espaços
    
    // Adiciona 10% a mais na duração para cálculo mais preciso
    const adjustedDuration = durationMinutes * 1.1;
    
    const totalWords = adjustedDuration * wordsPerMinute;
    const totalCharacters = totalWords * charactersPerWord;
    
    return {
      words: Math.round(totalWords),
      characters: Math.round(totalCharacters)
    };
  }

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
      openai_api_key: ''
    };
  }

  async generateScript(
    theme: string,
    duration: number,
    languageStyle: string,
    environment: string,
    environmentDescription?: string,
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

    const prompt = this.buildScriptPrompt(theme, duration, languageStyle, environment, environmentDescription, ragContent);

    // Apenas OpenAI é suportado
    if (this.settings.llm_provider !== 'openai') {
      throw new Error('Apenas OpenAI é suportado atualmente');
    }
    
    return this.callOpenAI(prompt);
  }

  async generateFinalScript(
    portugueseScript: string,
    targetLanguage: string,
    seoTitle?: string,
    seoDescription?: string,
    seoTags?: string[],
    thumbnailPrompt?: string
  ): Promise<LLMResponse> {
    if (!this.settings) {
      throw new Error('LLMService not initialized');
    }

    const prompt = this.buildTranslationPrompt(
      portugueseScript, 
      targetLanguage, 
      seoTitle, 
      seoDescription, 
      seoTags, 
      thumbnailPrompt
    );

    // Apenas OpenAI é suportado
    if (this.settings.llm_provider !== 'openai') {
      throw new Error('Apenas OpenAI é suportado atualmente');
    }
    
    return this.callOpenAI(prompt);
  }

  private buildScriptPrompt(
    theme: string,
    duration: number,
    languageStyle: string,
    environment: string,
    environmentDescription?: string,
    relevantContent?: string[]
  ): string {
    const contentContext = relevantContent && relevantContent.length > 0 
      ? `\n\nCONTEÚDO RELEVANTE DOS LIVROS:\n${relevantContent.join('\n\n')}`
      : '';

    const environmentContext = environmentDescription 
      ? `\n\nDESCRIÇÃO DETALHADA DO AMBIENTE:\n${environmentDescription}`
      : '';

    // Calcula o tamanho do roteiro baseado na duração
    const scriptSize = this.calculateScriptSize(duration);

    return `Você é um especialista em criação de roteiros para YouTube. Crie um roteiro envolvente e bem estruturado baseado nas informações fornecidas.

TEMA: ${theme}
DURAÇÃO: ${duration} minutos
ESTILO DE LINGUAGEM: ${languageStyle}
AMBIENTE: ${environment} ${environmentContext} ${contentContext}

⚠️ ESPECIFICAÇÕES CRÍTICAS DE TAMANHO DO ROTEIRO ⚠️
- DURAÇÃO DO VÍDEO: ${duration} minutos
- PALAVRAS OBRIGATÓRIAS: EXATAMENTE ${scriptSize.words} palavras
- CARACTERES OBRIGATÓRIOS: EXATAMENTE ${scriptSize.characters.toLocaleString()} caracteres (incluindo espaços)
- VELOCIDADE DE NARRAÇÃO: 160 palavras por minuto (padrão para vídeos)
- CARACTERES POR PALAVRA: 8 caracteres (incluindo espaços)

🎯 INSTRUÇÕES OBRIGATÓRIAS:
1. O roteiro DEVE ter EXATAMENTE ${scriptSize.words} palavras para ${duration} minutos de vídeo
2. O roteiro DEVE ter EXATAMENTE ${scriptSize.characters.toLocaleString()} caracteres (incluindo espaços)
3. Crie um roteiro estruturado com introdução, desenvolvimento e conclusão
4. Use o estilo de linguagem ${languageStyle}
5. Mantenha o ambiente ${environment} ao longo do vídeo
6. Inclua elementos de engajamento (perguntas, call-to-actions)
7. Use sempre as informações dos livros em RAG para enriquecer o conteúdo do roteiro
8. O roteiro deve conter apenas o conteúdo do vídeo, sem descrições de capítulos
9. Mantenha a linguagem fluida, natural e própria para narração
10. Incorpore os detalhes específicos da descrição do ambiente fornecida ${environmentDescription}

📏 CONTROLE DE QUALIDADE:
- Conte as palavras e caracteres do roteiro antes de finalizar
- Se estiver muito curto, adicione mais conteúdo relevante
- Se estiver muito longo, edite para reduzir mantendo a qualidade
- O tamanho é CRÍTICO para a duração do vídeo

FORMATO DE RESPOSTA (JSON):
{
  "title": "Título atrativo do vídeo",
  "content": "Roteiro completo em português brasileiro com EXATAMENTE ${scriptSize.words} palavras e ${scriptSize.characters.toLocaleString()} caracteres",
  "seo_title": "Título otimizado para SEO",
  "seo_description": "Descrição otimizada para SEO (máx 160 caracteres)",
  "seo_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "thumbnail_prompt": "Prompt detalhado para gerar thumbnail do vídeo"
}

Responda APENAS com o JSON válido, sem texto adicional.`;
  }

  private buildTranslationPrompt(
    portugueseScript: string, 
    targetLanguage: string,
    seoTitle?: string,
    seoDescription?: string,
    seoTags?: string[],
    thumbnailPrompt?: string
  ): string {
    const languageNames = {
      'en': 'inglês',
      'es': 'espanhol',
      'fr': 'francês',
      'de': 'alemão',
      'it': 'italiano',
      'ja': 'japonês',
      'ko': 'coreano',
      'zh': 'chinês',
      'ru': 'russo',
      'ar': 'árabe',
      'hi': 'hindi',
      'pt-BR': 'português brasileiro'
    };

    const targetLangName = languageNames[targetLanguage as keyof typeof languageNames] || targetLanguage;

    const additionalContent = seoTitle || seoDescription || seoTags || thumbnailPrompt 
      ? `\n\nCONTEÚDO ADICIONAL PARA TRADUZIR:\n` +
        (seoTitle ? `TÍTULO SEO: ${seoTitle}\n` : '') +
        (seoDescription ? `DESCRIÇÃO SEO: ${seoDescription}\n` : '') +
        (seoTags ? `TAGS SEO: ${seoTags.join(', ')}\n` : '') +
        (thumbnailPrompt ? `PROMPT THUMBNAIL: ${thumbnailPrompt}\n` : '')
      : '';

    return `Traduza o seguinte conteúdo de YouTube do português brasileiro para ${targetLangName}.

ROTEIRO ORIGINAL:
${portugueseScript}${additionalContent}

INSTRUÇÕES:
1. Mantenha a estrutura e formatação do roteiro
2. Adapte expressões idiomáticas para o idioma de destino
3. Preserve o tom e estilo do conteúdo original
4. Mantenha elementos de engajamento (perguntas, call-to-actions)
5. Certifique-se de que a tradução soe natural no idioma de destino
6. Traduza também todos os elementos SEO e prompts fornecidos

FORMATO DE RESPOSTA (JSON):
{
  "content": "Roteiro traduzido completo",
  "seo_title": "Título SEO traduzido",
  "seo_description": "Descrição SEO traduzida",
  "seo_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "thumbnail_prompt": "Prompt para thumbnail traduzido"
}

Responda APENAS com o JSON válido, sem texto adicional.`;
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


}

// Singleton instance
export const llmService = new LLMService();
