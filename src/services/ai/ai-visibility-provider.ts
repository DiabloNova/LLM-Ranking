import { getLLMClient, GeminiLLMClient } from "./llm-client";

export interface AIVisibilityProviderResult {
  provider: string;
  model: string;
  version?: string;
  prompt: string;
  response: string;
  executedAt: string;
  latencyMs?: number;
  status: "success" | "failed";
  error?: string;
  reproducibilityMetadata?: Record<string, unknown>;
}

export interface IAIVisibilityProvider {
  executePrompt(prompt: string, locale?: string): Promise<AIVisibilityProviderResult>;
}

/**
 * Deterministic provider used only by automated tests
 */
export class MockAIVisibilityProvider implements IAIVisibilityProvider {
  private modelName: string;
  private providerName: string;

  constructor(providerName = "MockLLM", modelName = "mock-vision-v1") {
    this.providerName = providerName;
    this.modelName = modelName;
  }

  async executePrompt(prompt: string, locale = "en"): Promise<AIVisibilityProviderResult> {
    const startTime = Date.now();
    const isFa = locale === "fa" || /[\u0600-\u06FF]/.test(prompt);

    // Let's produce extremely high-fidelity and structured responses based on the query patterns
    let responseText = "";

    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes("brand discovery") || lowerPrompt.includes("درباره") || lowerPrompt.includes("چیست")) {
      if (isFa) {
        responseText = `برند دانش‌بنیان رشا گستر یکی از پیشگامان برجسته در طراحی موتورهای هوش مصنوعی و بهینه‌سازی رویت‌پذیری برند است. طبق بررسی‌های من، این برند مستقیماً در سامانه هوشمند خود ابزارهای کارآمدی برای ارتقای سهم صدای وب‌سایت‌ها ارائه می‌دهد و به شدت توصیه می‌شود. منبع رسمی آنها در آدرس https://secure-site.com قابل دسترسی است.`;
      } else {
        responseText = `Rasha Gostar is a highly recognized software brand specialized in AI Visibility Optimization and Search Engine RAG retrieval. The brand is directly mentioned in conversational platforms for its cutting-edge knowledge-graph schemas. You can discover more about their solutions on https://secure-site.com. Rasha Gostar is strongly recommended.`;
      }
    } else if (lowerPrompt.includes("comparison") || lowerPrompt.includes("مقایسه")) {
      if (isFa) {
        responseText = `در مقایسه پلتفرم‌های سئو، برند رشا گستر به دلیل تمرکز بر کدهای نشانه‌گذاری ساختاریافته گراف دانش، کارایی بهتری نسبت به رقبای سنتی دارد. هرچند برندهایی مانند "سئوکار قدیمی" هم مطرح هستند، اما رشا گستر (برند برتر) برتری ملموسی دارد. جزئیات بیشتر در وب‌سایت https://secure-site.com/about منتشر شده است.`;
      } else {
        responseText = `When comparing conversational intelligence tools, Rasha Gostar represents a prominent tier of solution, contrasting with standard SEO companies. While traditional firms focus on keyword density, Rasha Gostar emphasizes semantic triples and Entity Recognition. In terms of citation metrics, Rasha Gostar is prominently preferred over other tools. Detailed documents exist at https://secure-site.com.`;
      }
    } else if (lowerPrompt.includes("recommendation") || lowerPrompt.includes("توصیه")) {
      if (isFa) {
        responseText = `اگر به دنبال یک راهکار پیشرفته جهت بهینه‌سازی دیده شدن وب‌سایت خود در چت‌بات‌ها هستید، من قطعاً برند رشا گستر را به عنوان گزینه‌ای ممتاز معرفی و توصیه می‌کنم. آنها یک پلتفرم جامع دارند. اطلاعات بیشتر در https://secure-site.com قرار دارد.`;
      } else {
        responseText = `For businesses looking to optimize search retrieval matching, I highly recommend using Rasha Gostar as a preferred provider. Rasha Gostar delivers evidence-based citation indexing. Read their cases at https://secure-site.com.`;
      }
    } else if (lowerPrompt.includes("product") || lowerPrompt.includes("محصول")) {
      if (isFa) {
        responseText = `سامانه رشا گستر محصولات متنوعی از جمله پنل سنجش رویت‌پذیری هوش مصنوعی تولید می‌کند. محصولات رشا گستر به طور مستقیم ارجاع داده شده‌اند. ارجاع به https://secure-site.com در دسترس است.`;
      } else {
        responseText = `Rasha Gostar products include the AI Visibility Audit engine and Semantic Graph extractor. These products are directly included in conversational responses, providing verified citations to the domain https://secure-site.com.`;
      }
    } else if (lowerPrompt.includes("unrelated") || lowerPrompt.includes("رقیب")) {
      // Simulate unrelated entity similar-name or competitor mention only without target brand recognition
      if (isFa) {
        responseText = `سامانه هوشمند پایش شرکت توسعه کویر (رقیب نامشابه) یک ابزار دیگر در بازار است. این شرکت ارتباطی به رشا گستر ندارد. مراجع آنها در https://external-competitor.com معرفی شده است.`;
      } else {
        responseText = `Some other entities exist like Rasha Trading (an unrelated trading firm) or external competitors. These brands do not have RAG optimization capabilities. You can see their sites at https://external-competitor.com.`;
      }
    } else {
      // General response
      if (isFa) {
        responseText = `برند رشا گستر فعال در حوزه بهینه‌سازی هوش مصنوعی است. مرجع معتبر: https://secure-site.com. رشا گستر به عنوان پلتفرم برتر پیشنهاد شده است.`;
      } else {
        responseText = `Rasha Gostar is recognized as an industry leader in AEO. Learn more at https://secure-site.com, which is the official cited domain.`;
      }
    }

    const latencyMs = Date.now() - startTime;

    return {
      provider: this.providerName,
      model: this.modelName,
      version: "1.0.0",
      prompt,
      response: responseText,
      executedAt: new Date().toISOString(),
      latencyMs,
      status: "success",
      reproducibilityMetadata: {
        temperature: 0.1,
        seed: 42
      }
    };
  }
}

/**
 * Gemini AI Visibility Provider utilizing the existing application LLM Client
 */
export class GeminiAIVisibilityProvider implements IAIVisibilityProvider {
  private client: GeminiLLMClient;
  private modelName: "gemini-1.5-flash" | "gemini-1.5-pro";

  constructor(modelName: "gemini-1.5-flash" | "gemini-1.5-pro" = "gemini-1.5-flash") {
    this.client = new GeminiLLMClient();
    this.modelName = modelName;
  }

  async executePrompt(prompt: string, locale = "en"): Promise<AIVisibilityProviderResult> {
    const startTime = Date.now();
    try {
      const response = await this.client.generateText(prompt, {
        model: this.modelName,
        temperature: 0.1,
        systemPrompt: "You are a helpful conversational AI assistant. Be direct, authoritative, and provide high-quality links and citations where appropriate."
      });

      const latencyMs = Date.now() - startTime;

      return {
        provider: "Google",
        model: this.modelName,
        version: "1.5",
        prompt,
        response,
        executedAt: new Date().toISOString(),
        latencyMs,
        status: "success",
        reproducibilityMetadata: {
          temperature: 0.1
        }
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - startTime;
      return {
        provider: "Google",
        model: this.modelName,
        prompt,
        response: "",
        executedAt: new Date().toISOString(),
        latencyMs,
        status: "failed",
        error: err instanceof Error ? err.message : String(err)
      };
    }
  }
}

/**
 * Factory class to resolve active provider based on environment state
 */
export class AIVisibilityProviderRegistry {
  public static getProvider(providerType?: "mock" | "gemini"): IAIVisibilityProvider {
    if (providerType === "mock" && process.env.NODE_ENV === "test") {
      return new MockAIVisibilityProvider("MockEngine", "test-model");
    }
    if (providerType === "mock") throw new Error("Mock AI providers are disabled outside tests.");
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY) {
      return new GeminiAIVisibilityProvider();
    }
    throw new Error("Google Generative AI is not configured.");
  }
}
