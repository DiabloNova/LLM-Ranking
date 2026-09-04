import FirecrawlApp from '@mendable/firecrawl-js';

export const firecrawlApp = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || ''
});
