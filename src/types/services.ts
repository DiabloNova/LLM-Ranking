export interface BilingualString {
  en: string;
  fa: string;
}

export interface Capability {
  id: string;
  title: BilingualString;
  description: BilingualString;
  iconName: string; // e.g. "Search", "Brain", etc.
}

export interface WorkflowStep {
  id: string;
  title: BilingualString;
  description: BilingualString;
  order: number;
}

export interface Insight {
  id: string;
  title: BilingualString;
  description: BilingualString;
  metric?: BilingualString;
}

export interface Hero {
  title: BilingualString;
  subtitle: BilingualString;
  ctaText: BilingualString;
  visualPlaceholder: string;
}

export interface ServicePageData {
  slug: string;
  hero: Hero;
  capabilities: Capability[];
  workflow: WorkflowStep[];
  insights: Insight[];
  ctaTitle: BilingualString;
  ctaSubtitle: BilingualString;
  ctaButtonText: BilingualString;
  metadataTitle: BilingualString;
  metadataDescription: BilingualString;
}
