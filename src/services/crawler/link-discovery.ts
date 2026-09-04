import * as cheerio from "cheerio";

/**
 * Parses the HTML of a seed URL, extracts links, resolves relative paths,
 * filters links by matching the seed's hostname, removes duplicates, and returns a list of unique absolute URLs.
 * Falls back to hardcoded mock links if URL contains "mock.com" or USE_MOCK_CRAWLER=true.
 */
export async function extractSeedLinks(
  seedUrl: string,
  maxLinks: number = 5
): Promise<string[]> {
  const useMock =
    process.env.USE_MOCK_CRAWLER === "true" ||
    seedUrl.toLowerCase().includes("mock.com");

  if (useMock) {
    // Generate realistic mock URLs based on the hostname of the seed URL
    let base = "https://mock.com";
    try {
      const parsedSeed = new URL(seedUrl);
      base = `${parsedSeed.protocol}//${parsedSeed.hostname}`;
    } catch {
      // Keep mock.com if seedUrl parsing fails
    }

    const mockPaths = ["/news/1", "/blog/2", "/articles/3", "/about", "/contact"];
    const mockUrls = mockPaths.map((path) => `${base}${path}`);
    return mockUrls.slice(0, maxLinks);
  }

  try {
    const seedParsed = new URL(seedUrl);
    const seedHostname = seedParsed.hostname.toLowerCase();

    const response = await fetch(seedUrl, {
      headers: {
        "User-Agent": "OptimusAICrawler/1.0 (Autonomous Data Collection Agent)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      signal: AbortSignal.timeout(10000) // 10 seconds timeout
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch seed URL. Status: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const discoveredUrlsSet = new Set<string>();

    $("a[href]").each((_, element) => {
      const href = $(element).attr("href")?.trim();
      if (!href) return;

      try {
        // Resolve relative links relative to the seed URL base
        const absoluteUrl = new URL(href, seedUrl).toString();
        const parsedUrl = new URL(absoluteUrl);

        // Ensure we only process http and https protocols
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
          return;
        }

        // Enforce strict hostname match to avoid crawling other websites
        if (parsedUrl.hostname.toLowerCase() === seedHostname) {
          // Normalize URL: remove hash/fragment to ensure uniqueness
          parsedUrl.hash = "";
          discoveredUrlsSet.add(parsedUrl.toString());
        }
      } catch {
        // Ignore invalid hrefs
      }
    });

    return Array.from(discoveredUrlsSet).slice(0, maxLinks);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`LinkDiscoveryError: Failed to extract links from ${seedUrl}. Details: ${errorMsg}`);
  }
}

export class LinkDiscoveryService {
  /**
   * Instance wrapper of extractSeedLinks
   */
  public async extractSeedLinks(url: string, maxLinks: number = 5): Promise<string[]> {
    return extractSeedLinks(url, maxLinks);
  }
}
