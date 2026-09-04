import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, LanguageModel } from 'ai';
import { AI_CONFIG } from '@/config/ai';

export interface GenerateOptions {
  model?: 'gemini-1.5-flash' | 'gemini-1.5-pro';
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ILLMClient {
  generateText(prompt: string, options?: GenerateOptions): Promise<string>;
}

// 1. Google Gemini Provider configuration
const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';

export const googleProvider = googleApiKey
  ? createGoogleGenerativeAI({ apiKey: googleApiKey })
  : null;

export const geminiFlashModel = googleProvider ? googleProvider('gemini-1.5-flash') : null;
export const geminiProModel = googleProvider ? googleProvider('gemini-1.5-pro') : null;

export class GeminiLLMClient implements ILLMClient {
  private getModel(modelName?: string): LanguageModel {
    if (!googleProvider) {
      throw new Error(
        'Gemini API key is not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY in your environment.'
      );
    }
    if (modelName === 'gemini-1.5-pro') {
      return googleProvider('gemini-1.5-pro');
    }
    return googleProvider('gemini-1.5-flash');
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    const model = this.getModel(options?.model || AI_CONFIG.defaultModel);
    const system = options?.systemPrompt;
    const temperature = options?.temperature ?? AI_CONFIG.temperature;
    const maxOutputTokens = options?.maxTokens ?? AI_CONFIG.maxTokens;

    const response = await generateText({
      model,
      prompt,
      system,
      temperature,
      maxOutputTokens,
    });

    return response.text;
  }
}

// 2. Mock Provider for local development/CI/CD
export class MockLLMClient implements ILLMClient {
  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    const isSentimentRequest = prompt.toLowerCase().includes('sentiment') || (options?.systemPrompt && options.systemPrompt.toLowerCase().includes('sentiment'));

    if (isSentimentRequest) {
      if (prompt.includes('کیفیت محصول فوق‌العاده‌ست')) {
        return JSON.stringify({
          score: 0.95,
          label: 'positive',
          confidence: 0.98,
          emotions: ['joy']
        });
      }
      if (prompt.includes('اصلاً به درد نمی‌خوره')) {
        return JSON.stringify({
          score: -0.9,
          label: 'negative',
          confidence: 0.95,
          emotions: ['anger', 'sadness']
        });
      }
      if (prompt.includes('بسته‌بندی خوب بود')) {
        return JSON.stringify({
          score: 0.0,
          label: 'neutral',
          confidence: 0.85,
          emotions: []
        });
      }
      // General sentiment mock fallback
      return JSON.stringify({
        score: 0.5,
        label: 'positive',
        confidence: 0.9,
        emotions: ['neutral']
      });
    }

    return `[Mock Persian Response for prompt: ${prompt.substring(0, 50)}...] این یک پاسخ شبیه‌سازی شده برای توسعه محلی است.`;
  }
}

// 3. Dynamic Service Resolution
export function getLLMClient(): ILLMClient {
  if (process.env.NODE_ENV === 'test') return new MockLLMClient();
  if (!googleProvider) throw new Error('Google Generative AI is not configured.');
  return new GeminiLLMClient();
}
