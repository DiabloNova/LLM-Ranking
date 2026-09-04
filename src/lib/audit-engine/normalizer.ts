import { RawWebsiteSignals, NormalizedIntelligenceFeatures } from "@/types/audit";

/**
 * Normalizes RawWebsiteSignals into structured, decoupled intelligence features.
 */
export function normalizeFeatures(signals: RawWebsiteSignals): NormalizedIntelligenceFeatures {
  const { technical, metadata, content, entities, structuredData } = signals;

  // 1. Technical Health Feature
  let techScore = 100;
  const techFactors: string[] = [];

  if (technical.isHttps) {
    techFactors.push("HTTPS enabled (+10)");
  } else {
    techScore -= 30;
    techFactors.push("Missing HTTPS encryption (-30)");
  }

  if (technical.statusCode === 200) {
    techFactors.push("HTTP 200 OK status validated (+15)");
  } else {
    techScore -= 15;
    techFactors.push(`Unusual HTTP response status: ${technical.statusCode} (-15)`);
  }

  if (technical.hasCanonical) {
    techFactors.push("Canonical tag defined correctly (+15)");
  } else {
    techScore -= 15;
    techFactors.push("Missing canonical reference link (-15)");
  }

  if (technical.robotsTxtAllowed) {
    techFactors.push("Robots.txt available (+10)");
  } else {
    techScore -= 10;
    techFactors.push("Robots.txt file not found (-10)");
  }

  if (technical.sitemapAvailable) {
    techFactors.push("XML Sitemap discovered (+15)");
  } else {
    techScore -= 15;
    techFactors.push("XML Sitemap missing or unreachable (-15)");
  }

  if (technical.responseTimeMs < 1000) {
    techFactors.push("Excellent response latency (< 1s) (+15)");
  } else if (technical.responseTimeMs < 2000) {
    techScore -= 5;
    techFactors.push("Moderate response latency (1-2s) (-5)");
  } else {
    techScore -= 15;
    techFactors.push("Slow response latency (> 2s) (-15)");
  }

  techScore = Math.max(0, Math.min(100, techScore));

  // 2. Content Quality Feature
  let contentScore = 100;
  const contentFactors: string[] = [];

  const title = metadata.title || "";
  if (title) {
    const len = title.length;
    if (len >= 40 && len <= 70) {
      contentFactors.push("Optimal Title length (40-70 characters) (+20)");
    } else {
      contentScore -= 10;
      contentFactors.push(`Sub-optimal Title length: ${len} characters (-10)`);
    }
  } else {
    contentScore -= 30;
    contentFactors.push("Missing Title metadata tag (-30)");
  }

  const desc = metadata.description || "";
  if (desc) {
    const len = desc.length;
    if (len >= 120 && len <= 170) {
      contentFactors.push("Optimal Meta Description length (120-170 characters) (+20)");
    } else {
      contentScore -= 10;
      contentFactors.push(`Sub-optimal Meta Description length: ${len} characters (-10)`);
    }
  } else {
    contentScore -= 30;
    contentFactors.push("Missing Meta Description metadata tag (-30)");
  }

  const h1Count = content.headingHierarchy.h1 || 0;
  if (h1Count === 1) {
    contentFactors.push("Proper single H1 tag hierarchy verified (+15)");
  } else if (h1Count === 0) {
    contentScore -= 15;
    contentFactors.push("No H1 heading found on page (-15)");
  } else {
    contentScore -= 10;
    contentFactors.push(`Multiple H1 headings (${h1Count}) discovered (-10)`);
  }

  if (content.wordCount >= 300) {
    contentFactors.push(`Sufficient word count (${content.wordCount} words) (+15)`);
  } else {
    contentScore -= 15;
    contentFactors.push(`Low word count (${content.wordCount} words) (-15)`);
  }

  if (content.imageCount > 0) {
    if (content.missingAltCount === 0) {
      contentFactors.push("All page images have optimized ALT attributes (+10)");
    } else {
      const penalty = Math.min(20, content.missingAltCount * 5);
      contentScore -= penalty;
      contentFactors.push(`${content.missingAltCount} images lack ALT attributes (-${penalty})`);
    }
  }

  contentScore = Math.max(0, Math.min(100, contentScore));

  // 3. Entity Signals Feature
  let entityScore = 100;
  const entityFactors: string[] = [];

  if (entities.hasBrandEntity) {
    entityFactors.push("Brand/Entity presence detected on page (+30)");
  } else {
    entityScore -= 30;
    entityFactors.push("No registered brand entity discovered in main copy (-30)");
  }

  const entCount = entities.detectedEntities.length;
  if (entCount >= 4) {
    entityFactors.push(`Rich semantic entity diversity (${entCount} entities) (+30)`);
  } else if (entCount >= 1) {
    entityScore -= 15;
    entityFactors.push(`Sparse entity footprint (${entCount} entities) (-15)`);
  } else {
    entityScore -= 30;
    entityFactors.push("Zero semantic entities matched on page (-30)");
  }

  if (content.hasAuthor) {
    entityFactors.push("Author credentials declared (+20)");
  } else {
    entityScore -= 20;
    entityFactors.push("No explicit author schema or credits found (-20)");
  }

  if (content.hasPublishDate) {
    entityFactors.push("Publication or modification date timestamped (+20)");
  } else {
    entityScore -= 20;
    entityFactors.push("Missing editorial publication date headers (-20)");
  }

  entityScore = Math.max(0, Math.min(100, entityScore));

  // 4. Structured Data Signals Feature
  let schemaScore = 100;
  const schemaFactors: string[] = [];

  if (structuredData.hasJsonLd) {
    schemaFactors.push("JSON-LD structured data detected (+50)");
    if (structuredData.isValidSchema) {
      schemaFactors.push("Valid semantic schemas parsed successfully (+30)");
    } else {
      schemaScore -= 50;
      schemaFactors.push("Malformed/invalid JSON structures inside schema tag (-50)");
    }
  } else {
    schemaScore -= 70;
    schemaFactors.push("No JSON-LD structured metadata blocks detected (-70)");
  }

  const commonSchemas = ["Organization", "Product", "Article", "FAQPage", "WebSite", "BreadcrumbList", "LocalBusiness"];
  const matches = structuredData.schemaTypes.filter(type => commonSchemas.includes(type));
  if (matches.length > 0) {
    schemaFactors.push(`Standard search schema type matches: ${matches.join(", ")} (+20)`);
  } else if (structuredData.hasJsonLd) {
    schemaScore -= 20;
    schemaFactors.push("No common SEO standard schema types discovered (-20)");
  }

  schemaScore = Math.max(0, Math.min(100, schemaScore));

  return {
    technicalHealth: {
      score: techScore,
      factors: techFactors
    },
    contentQuality: {
      score: contentScore,
      factors: contentFactors
    },
    entitySignals: {
      score: entityScore,
      factors: entityFactors
    },
    structuredDataSignals: {
      score: schemaScore,
      factors: schemaFactors
    }
  };
}
