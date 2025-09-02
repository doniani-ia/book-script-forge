import { supabase } from '@/integrations/supabase/client';
import { llmService } from './llm-service';

export interface TranslationOptions {
  preserveFormatting: boolean;
  adaptIdioms: boolean;
  maintainTone: boolean;
  targetAudience: string;
}

export interface TranslationResult {
  success: boolean;
  translatedContent: string;
  originalLanguage: string;
  targetLanguage: string;
  translationTime: number;
  error?: string;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export class TranslationService {
  private static readonly SUPPORTED_LANGUAGES: SupportedLanguage[] = [
    { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', flag: '🇧🇷' },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文 (简体)', flag: '🇨🇳' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' }
  ];

  static getSupportedLanguages(): SupportedLanguage[] {
    return this.SUPPORTED_LANGUAGES;
  }

  static getLanguageByCode(code: string): SupportedLanguage | undefined {
    return this.SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  }

  static getLanguageName(code: string): string {
    const language = this.getLanguageByCode(code);
    return language ? language.nativeName : code;
  }

  async translateScript(
    scriptId: string,
    targetLanguage: string,
    options: TranslationOptions = {
      preserveFormatting: true,
      adaptIdioms: true,
      maintainTone: true,
      targetAudience: 'general'
    }
  ): Promise<TranslationResult> {
    const startTime = Date.now();

    try {
      console.log(`[TranslationService] Starting translation for script ${scriptId} to ${targetLanguage}`);

      // Get the script from database
      const { data: script, error: scriptError } = await supabase
        .from('scripts')
        .select('*')
        .eq('id', scriptId)
        .single();

      if (scriptError || !script) {
        throw new Error(`Script not found: ${scriptError?.message}`);
      }

      if (!script.content_portuguese) {
        throw new Error('No Portuguese content found to translate');
      }

      console.log(`[TranslationService] Script found: ${script.title}`);

      // Initialize LLM service
      await llmService.initialize(script.user_id);

      // Generate enhanced translation prompt
      const prompt = this.buildEnhancedTranslationPrompt(
        script.content_portuguese,
        script.target_language,
        targetLanguage,
        options
      );

      // Call LLM for translation
      const response = await this.callLLMForTranslation(prompt);

      // Parse and validate the response
      const translatedContent = this.parseTranslationResponse(response.content);

      // Update the script with translated content
      const { error: updateError } = await supabase
        .from('scripts')
        .update({
          content_final: translatedContent,
          target_language: targetLanguage,
          status: 'final',
          updated_at: new Date().toISOString()
        })
        .eq('id', scriptId);

      if (updateError) {
        throw new Error(`Failed to update script: ${updateError.message}`);
      }

      const translationTime = Date.now() - startTime;

      console.log(`[TranslationService] Translation completed in ${translationTime}ms`);

      return {
        success: true,
        translatedContent,
        originalLanguage: script.target_language,
        targetLanguage,
        translationTime
      };

    } catch (error: any) {
      console.error(`[TranslationService] Translation failed:`, error);
      return {
        success: false,
        translatedContent: '',
        originalLanguage: 'pt-BR',
        targetLanguage,
        translationTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  private buildEnhancedTranslationPrompt(
    originalContent: string,
    sourceLanguage: string,
    targetLanguage: string,
    options: TranslationOptions
  ): string {
    const sourceLangName = TranslationService.getLanguageName(sourceLanguage);
    const targetLangName = TranslationService.getLanguageName(targetLanguage);

    return `You are a professional translator specializing in YouTube script translation. Translate the following YouTube script from ${sourceLangName} to ${targetLanguage}.

ORIGINAL SCRIPT:
${originalContent}

TRANSLATION REQUIREMENTS:
1. **Preserve Structure**: Maintain the original script structure and formatting
2. **Adapt Idioms**: ${options.adaptIdioms ? 'Adapt idioms and cultural references to the target language' : 'Keep idioms as close to original as possible'}
3. **Maintain Tone**: ${options.maintainTone ? 'Preserve the original tone and style' : 'Adapt tone to target culture'}
4. **Target Audience**: Translate for ${options.targetAudience} audience
5. **Engagement Elements**: Keep all engagement elements (questions, call-to-actions, hooks)
6. **Natural Flow**: Ensure the translation sounds natural and engaging in ${targetLangName}

SPECIFIC INSTRUCTIONS:
- Maintain video timing and pacing cues
- Preserve any timestamps or time markers
- Keep brand names and proper nouns as appropriate
- Ensure cultural sensitivity for the target audience
- Maintain the educational/informational value
- Keep the script engaging and YouTube-optimized

RESPONSE FORMAT:
Provide ONLY the translated script content, without any additional text, explanations, or formatting markers.`;
  }

  private async callLLMForTranslation(prompt: string): Promise<any> {
    // Use the existing LLM service infrastructure
    const response = await llmService.generateScript(
      'translation', // theme (not used for translation)
      10, // duration (not used for translation)
      'professional', // language style
      'translation', // environment
      [prompt] // pass prompt as relevant content
    );

    return response;
  }

  private parseTranslationResponse(response: string): string {
    // Clean up the response and extract the translated content
    let content = response.trim();

    // Remove any JSON formatting if present
    if (content.startsWith('{') && content.endsWith('}')) {
      try {
        const parsed = JSON.parse(content);
        content = parsed.content || parsed.translated_content || content;
      } catch (error) {
        console.warn('Failed to parse JSON response, using raw content');
      }
    }

    // Remove any markdown formatting
    content = content.replace(/```[\s\S]*?```/g, '');
    content = content.replace(/`([^`]+)`/g, '$1');

    return content.trim();
  }

  async getTranslationHistory(scriptId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select('target_language, updated_at, status')
        .eq('id', scriptId)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch translation history: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      console.error('Error fetching translation history:', error);
      return [];
    }
  }

  async batchTranslateScripts(
    scriptIds: string[],
    targetLanguage: string,
    options: TranslationOptions
  ): Promise<TranslationResult[]> {
    const results: TranslationResult[] = [];

    for (const scriptId of scriptIds) {
      try {
        const result = await this.translateScript(scriptId, targetLanguage, options);
        results.push(result);
        
        // Add a small delay between translations to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        results.push({
          success: false,
          translatedContent: '',
          originalLanguage: 'pt-BR',
          targetLanguage,
          translationTime: 0,
          error: error.message
        });
      }
    }

    return results;
  }
}

// Singleton instance
export const translationService = new TranslationService();
