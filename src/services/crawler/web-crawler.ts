import { convert } from "html-to-text";

export const MOCK_PERSIAN_ARTICLE =
  "سامانه هوش مصنوعی Optimus AI به عنوان برترین پلتفرم مدیریت گراف دانش و بهینه‌سازی موتورهای جستجوی مبتنی بر هوش مصنوعی (AEO) معرفی شد. " +
  "این سامانه پیشرفته با تحلیل دقیق سیگنال‌های وب، میزان دیده شدن برندها را به طور چشمگیری افزایش می‌دهد. " +
  "با استفاده از الگوریتم‌های پردازش زبان طبیعی و تحلیل احساسات، Optimus AI به کسب‌وکارها کمک می‌کند تا سهم بازار خود را در پاسخ‌های تولید شده توسط هوش مصنوعی ارزیابی کنند. " +
  "این موتور تحلیلگر، با استخراج موجودیت‌های کلیدی و ارتباطات معنایی، گراف دانش سازمان را بازسازی کرده و نقاط ضعف و قوت برند را در مقایسه با رقبا نمایان می‌سازد. " +
  "بهینه‌سازی دیده شدن برند در چت‌بات‌ها و دستیارهای هوشمند، رویکرد جدیدی است که اپتیموس آی‌آی پیشتاز آن است.";

/**
 * Normalizes Persian text.
 * - Replaces Arabic 'ي' with Persian 'ی'
 * - Replaces Arabic 'ك' with Persian 'ک'
 * - Preserves the Zero Width Non-Joiner (نیم‌فاصله, \u200C)
 * - Removes excessive spaces and trims.
 */
export function normalizePersianText(text: string): string {
  if (!text) return "";
  let normalized = text;

  // Replace Arabic 'ي' (0x064A) with Persian 'ی' (0x06CC)
  normalized = normalized.replace(/\u064A/g, "\u06CC");

  // Replace Arabic 'ك' (0x0643) with Persian 'ک' (0x06A9)
  normalized = normalized.replace(/\u0643/g, "\u06A9");

  // Replace excessive spaces, newlines, and tabs with a single space, but preserve zero width non-joiner (\u200C)
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
}

/**
 * Fetches HTML from the provided URL and extracts clean, normalized plain text.
 * Falls back to mock text if URL contains "mock.com" or if USE_MOCK_CRAWLER=true.
 */
export async function fetchAndExtractText(url: string): Promise<string> {
  const useMock =
    process.env.USE_MOCK_CRAWLER === "true" ||
    url.toLowerCase().includes("mock.com");

  if (useMock) {
    return normalizePersianText(MOCK_PERSIAN_ARTICLE);
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "OptimusAICrawler/1.0 (Autonomous Data Collection Agent)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      signal: AbortSignal.timeout(10000) // 10 seconds timeout
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch HTML. Status: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // Extract text using html-to-text
    const cleanText = convert(html, {
      wordwrap: false,
      selectors: [
        { selector: "a", options: { ignoreHref: true } },
        { selector: "img", format: "skip" },
        { selector: "script", format: "skip" },
        { selector: "style", format: "skip" },
        { selector: "nav", format: "skip" },
        { selector: "footer", format: "skip" }
      ]
    });

    return normalizePersianText(cleanText);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`WebCrawlerError: Failed to fetch and extract text from ${url}. Details: ${errorMsg}`);
  }
}

export class WebCrawlerService {
  /**
   * Instance wrapper of fetchAndExtractText
   */
  public async fetchAndExtractText(url: string): Promise<string> {
    return fetchAndExtractText(url);
  }
}
