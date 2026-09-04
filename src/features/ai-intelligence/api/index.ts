/**
 * Phase 7C.1 — AI Visibility Intelligence Engine
 * API Boundary Contract Specification
 * Establishes structured request schemas, response envelopes, pagination, and error formats.
 */

export interface APIRequestPagination {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface APIRequestFilter {
  search?: string;
  category?: string;
  intent?: string;
  priority?: string;
  status?: string;
  includeDeleted?: boolean;
}

export interface APIResponseEnvelope<T> {
  success: boolean;
  data?: T;
  error?: APIErrorContract;
  meta?: APIResponseMeta;
}

export interface APIResponseMeta {
  totalCount?: number;
  page?: number;
  pageSize?: number;
  timestamp: string;
}

export interface APIErrorContract {
  code: string; // Machine-readable code (e.g. "AUTH_FORBIDDEN_RESOURCES")
  message: string; // Human-readable friendly error message
  details?: APIErrorFieldDetail[]; // Granular validation errors
}

export interface APIErrorFieldDetail {
  field: string;
  issue: string;
}

// Concrete Request Schemas
export interface CreateBrandRequest {
  name: string;
  description?: string;
  website: string;
  industry?: string;
  country?: string;
}

export interface DiscoverEntityRequest {
  brandId: string;
  name: string;
  type: string;
  wikidataId?: string;
  wikipediaUrl?: string;
  confidenceScore?: number;
}

export interface CaptureObservationRequest {
  promptId: string;
  engineId: string;
  responseText: string;
  rawVisibilityScore: number;
  sentimentScore: number;
  confidenceScore?: number;
}

export interface GenerateRecommendationRequest {
  brandId: string;
  category: string;
  priority: "low" | "medium" | "high";
  impactScore: number;
  description: string;
}
