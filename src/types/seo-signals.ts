export interface PageIdentitySignals {
  url: string;
  normalizedUrl: string;
  crawledAt: string;
  charset: string | null;
  language: string | null;
}

export interface MetadataField {
  value: string | null;
  present: boolean;
  count: number;
  source: "tag" | "og" | "twitter" | "none";
}

export interface MetadataSignals {
  title: MetadataField;
  description: MetadataField;
  robots: {
    value: string | null;
    present: boolean;
  };
  viewport: {
    value: string | null;
    present: boolean;
  };
  language: string | null;
  charset: string | null;
  openGraph: Record<string, string>;
  twitter: Record<string, string>;
  rawMetadata: Array<{ name?: string; property?: string; content?: string }>;
}

export interface HeadingItem {
  text: string;
  index: number;
  level: number;
}

export interface HeadingSignals {
  h1: HeadingItem[];
  h2: HeadingItem[];
  h3: HeadingItem[];
  h4: HeadingItem[];
  h5: HeadingItem[];
  h6: HeadingItem[];
  counts: Record<string, number>;
  sequence: HeadingItem[];
}

export interface CanonicalSignals {
  present: boolean;
  url: string | null;
  normalizedUrl: string | null;
  multiple: boolean;
  isValid: boolean;
  matchesPageUrl: boolean | null;
  occurrences: string[];
}

export interface RobotsSignals {
  metaDirectives: string[];
  headerDirectives: string[];
  directives: string[]; // Normalized merged directives (e.g. ['noindex', 'nofollow'])
  indexAllowed: boolean;
  followAllowed: boolean;
  rawMeta: string | null;
  rawHeader: string | null;
}

export interface SitemapSignals {
  discovered: boolean;
  url: string | null;
  status: number | null;
  parsedSuccessfully: boolean | null;
  urlsCount: number | null;
  entries: string[];
  isIndex: boolean | null;
  lastModified: string | null;
  parseError: string | null;
}

export interface StructuredDataBlock {
  type: string | null;
  payload: Record<string, unknown> | Array<Record<string, unknown>>;
  isParsed: boolean;
  parseError: string | null;
}

export interface MicrodataBlock {
  type: string;
  properties: Record<string, string>;
}

export interface StructuredDataSignals {
  hasJsonLd: boolean;
  blocks: StructuredDataBlock[];
  blocksCount: number;
  schemaTypes: string[];
  parseErrors: string[];
  microdata: MicrodataBlock[];
}

export interface LinkItem {
  sourceUrl: string;
  targetUrl: string;
  normalizedTargetUrl: string;
  anchorText: string;
  rel: string | null;
  isRelative: boolean;
  isExternal: boolean;
  isFragmentOnly: boolean;
}

export interface InternalLinkSignals {
  links: LinkItem[];
  internalCount: number;
  externalCount: number;
  relativeCount: number;
  absoluteCount: number;
  fragmentOnlyCount: number;
  uniqueTargets: string[];
}

export interface HttpSignals {
  statusCode: number;
  isSuccess: boolean; // 2xx
  isRedirect: boolean; // 3xx
  isClientError: boolean; // 4xx
  isServerError: boolean; // 5xx
  headers: Record<string, string>;
}

export interface RedirectSignals {
  initialUrl: string;
  finalUrl: string;
  redirectChain: string[];
  redirectStatusCodes: number[];
  redirectLocations: string[];
  redirectCount: number;
  isLoop: boolean;
  excessiveCount: boolean;
}

export interface IndexabilityEvidence {
  statusCode: number;
  robotsIndexAllowed: boolean;
  canonicalMatches: boolean | null;
  hasNoIndexDirective: boolean;
}

export interface IndexabilitySignals {
  isIndexable: boolean;
  status: "indexable" | "noindex" | "blocked_by_robots" | "non_200_status" | "canonical_mismatch" | "undetermined";
  evidence: IndexabilityEvidence;
  limitations: string[];
}

export interface ContentStructureSignals {
  hasBody: boolean;
  hasMain: boolean;
  paragraphCount: number;
  textBlockCount: number;
  listCount: number;
  tableCount: number;
  imageCount: number;
  videoCount: number;
  semanticElements: string[];
  wordCount: number;
  textLength: number;
  headingToContentRatio: number; // headingsCount / (wordCount || 1)
}

export interface PerformanceSignals {
  responseTimeMs: number | null;
  downloadDurationMs: number | null;
  responseSize: number;
  resourceCount: number | null;
  isMeasured: boolean;
}

export interface SeoSignals {
  page: PageIdentitySignals;
  metadata: MetadataSignals;
  headings: HeadingSignals;
  canonical: CanonicalSignals;
  robots: RobotsSignals;
  sitemap: SitemapSignals;
  structuredData: StructuredDataSignals;
  internalLinks: InternalLinkSignals;
  http: HttpSignals;
  redirects: RedirectSignals;
  indexability: IndexabilitySignals;
  contentStructure: ContentStructureSignals;
  performance: PerformanceSignals;
}
