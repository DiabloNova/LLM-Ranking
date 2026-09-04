export interface TechnicalChange {
  url: string;
  type: string;
  previousValue: unknown;
  currentValue: unknown;
}

export interface SeoChange {
  url: string;
  type: string;
  previousValue: unknown;
  currentValue: unknown;
}

export interface ContentChange {
  url: string;
  type: string;
  previousValue: unknown;
  currentValue: unknown;
}

export interface SnapshotChangeResult {
  addedPages: string[];
  removedPages: string[];
  modifiedPages: string[];
  technicalChanges: TechnicalChange[];
  seoChanges: SeoChange[];
  contentChanges: ContentChange[];
  hasChanges: boolean;
}
