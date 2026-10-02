import { Question, QuestionOption } from '../types';
import { geminiService } from './geminiService';

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'pt', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
];

export interface TranslatedQuestionData {
  prompt: string;
  scenarioContext?: string;
  options?: Array<{
    id: string;
    text: string;
    comment?: string;
    explanation?: string;
  }>;
  explanation?: string;
  targetLang: string;
}

class TranslationService {
  // In-memory cache: `${questionId}_${targetLang}` -> TranslatedQuestionData
  private cache = new Map<string, TranslatedQuestionData>();

  /**
   * Translate single text string using Google Translate public endpoint, with fallback to Gemini
   */
  public async translateText(text: string, targetLang: string): Promise<string> {
    const trimmed = text.trim();
    if (!trimmed) return text;

    // Normalizing language code (e.g. 'pt-BR' -> 'pt')
    const langCode = targetLang.split('-')[0].toLowerCase();

    // 1. Try Google Translate public client-side endpoint
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
        langCode
      )}&dt=t&q=${encodeURIComponent(trimmed)}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const translated = data[0]
            .map((chunk: any) => (Array.isArray(chunk) ? chunk[0] : ''))
            .filter(Boolean)
            .join('');

          if (translated && translated.trim()) {
            return translated;
          }
        }
      }
    } catch (err) {
      console.warn('Google Translate public endpoint failed, checking Gemini fallback:', err);
    }

    // 2. Fallback to Gemini if API key is present
    if (geminiService.hasApiKey()) {
      try {
        const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === langCode || l.code === targetLang);
        const targetName = langObj ? langObj.name : targetLang;

        const ai = geminiService.getClient();
        const res = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Translate the following text into ${targetName}. Preserve technical certification terms (AWS, Azure, GCP, Kubernetes, CLI commands, YAML parameters) accurately. Return ONLY the translated text without extra comments, quotes or explanations:\n\n${trimmed}`,
                },
              ],
            },
          ],
        });

        const resultText = res.text?.trim();
        if (resultText) {
          return resultText;
        }
      } catch (geminiErr) {
        console.warn('Gemini translation fallback error:', geminiErr);
      }
    }

    // Fallback: return original text if translation failed
    return text;
  }

  /**
   * Translate an entire Question (prompt, scenario, options text & comments, question explanation)
   */
  public async translateQuestion(
    question: Question,
    targetLang: string
  ): Promise<TranslatedQuestionData> {
    const cacheKey = `${question.id}_${targetLang}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Translate prompt
    const promptPromise = this.translateText(question.prompt, targetLang);

    // Translate scenario context if present
    const scenarioPromise = question.scenarioDetails?.context
      ? this.translateText(question.scenarioDetails.context, targetLang)
      : Promise.resolve(undefined);

    // Translate explanation if present
    const explanationPromise = question.explanation
      ? this.translateText(question.explanation, targetLang)
      : Promise.resolve(undefined);

    // Translate options text and comments
    const optionsPromises = (question.options || []).map(async (opt) => {
      const optText = await this.translateText(opt.text, targetLang);
      const optComment = opt.comment || opt.explanation
        ? await this.translateText((opt.comment || opt.explanation) as string, targetLang)
        : undefined;

      return {
        id: opt.id,
        text: optText,
        comment: optComment,
        explanation: optComment,
      };
    });

    const [translatedPrompt, translatedScenario, translatedExplanation, translatedOptions] =
      await Promise.all([
        promptPromise,
        scenarioPromise,
        explanationPromise,
        Promise.all(optionsPromises),
      ]);

    const result: TranslatedQuestionData = {
      prompt: translatedPrompt,
      scenarioContext: translatedScenario,
      options: translatedOptions,
      explanation: translatedExplanation,
      targetLang,
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Check if translation is cached
   */
  public getCached(questionId: string, targetLang: string): TranslatedQuestionData | undefined {
    return this.cache.get(`${questionId}_${targetLang}`);
  }

  /**
   * Clear cache if needed
   */
  public clearCache(): void {
    this.cache.clear();
  }
}

export const translationService = new TranslationService();
