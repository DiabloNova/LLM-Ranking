import FirecrawlApp from '@mendable/firecrawl-js';
import * as cheerio from 'cheerio';
import { getCachedData, setCachedData } from './redis';

export interface SeoSignals {
  title: string | null;
  description: string | null;
  h1: string[];
  h2: string[];
  h3: string[];
  h4: string[];
  h5: string[];
  h6: string[];
  statusCode: number;
  internalLinks: string[];
  externalLinks: string[];
}

export interface CrawlResult {
  success: boolean;
  data: SeoSignals | null;
  error?: string;
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = ''; // Remove hash
    return parsed.toString();
  } catch {
    return url;
  }
}

export async function crawlWebsite(url: string): Promise<CrawlResult> {
  const normalizedUrl = normalizeUrl(url);
  const cacheKey = `seo_signals:${normalizedUrl}`;

  // 1. Check Cache
  try {
    const cached = await getCachedData<SeoSignals>(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }
  } catch (error) {
    console.error('Error reading from cache:', error);
  }

  // 2. Fetch using Firecrawl
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return { success: false, data: null, error: 'Firecrawl API key is missing' };
  }

  try {
    const app = new FirecrawlApp({ apiKey });

    // Using Firecrawl to get HTML
    const response = await app.scrapeUrl(normalizedUrl, {
      formats: ['html'],
    });

    if (!response) {
      return { success: false, data: null, error: 'Failed to crawl website or no HTML returned' };
    }

    if (!('success' in response) || !response.success) {
      const errorResponse = response as unknown as { error?: string };
      return { success: false, data: null, error: errorResponse.error || 'Failed to crawl website' };
    }

    if (!('html' in response) || !response.html) {
      return { success: false, data: null, error: 'Failed to crawl website or no HTML returned' };
    }

    const html = response.html as string;
    const metadata = ('metadata' in response && response.metadata) ? response.metadata : {};
    const statusCode = ('statusCode' in metadata && typeof metadata.statusCode === 'number') ? metadata.statusCode : 200;

    const $ = cheerio.load(html);

    // Extract Headings
    const h1 = $('h1').map((_, el) => $(el).text().trim()).get().filter(Boolean);
    const h2 = $('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean);
    const h3 = $('h3').map((_, el) => $(el).text().trim()).get().filter(Boolean);
    const h4 = $('h4').map((_, el) => $(el).text().trim()).get().filter(Boolean);
    const h5 = $('h5').map((_, el) => $(el).text().trim()).get().filter(Boolean);
    const h6 = $('h6').map((_, el) => $(el).text().trim()).get().filter(Boolean);

    // Extract Title & Description
    const metadataTitle = ('title' in metadata && typeof metadata.title === 'string') ? metadata.title : null;
    const title = metadataTitle || $('title').text().trim() || null;

    const metadataDesc = ('description' in metadata && typeof metadata.description === 'string') ? metadata.description : null;
    const description = metadataDesc || $('meta[name="description"]').attr('content')?.trim() || null;

    // Extract Links
    const internalLinks = new Set<string>();
    const externalLinks = new Set<string>();

    let baseHost = '';
    try {
      baseHost = new URL(normalizedUrl).hostname;
    } catch {
      // ignore
    }

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')?.trim();
      if (!href) return;

      try {
        if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;

        const linkUrl = new URL(href, normalizedUrl);
        if (linkUrl.hostname === baseHost) {
          internalLinks.add(linkUrl.toString());
        } else {
          externalLinks.add(linkUrl.toString());
        }
      } catch {
        // Ignore invalid URLs
      }
    });

    const seoSignals: SeoSignals = {
      title,
      description,
      h1,
      h2,
      h3,
      h4,
      h5,
      h6,
      statusCode,
      internalLinks: Array.from(internalLinks),
      externalLinks: Array.from(externalLinks),
    };

    // 3. Cache Result (24 hours = 86400 seconds)
    try {
      await setCachedData(cacheKey, seoSignals, 86400);
    } catch (error) {
      console.error('Error setting cache:', error);
    }

    return { success: true, data: seoSignals };

  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred during crawling'
    };
  }
}
