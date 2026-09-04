/**
 * Phase 7C.1 — AI Visibility Intelligence Engine
 * AI Processing Pipeline Contract Specifications
 * Establishes decoupled contracts for background workers and scraper pipelines.
 */

import { Citation, Entity, ConfidenceVO, Prompt } from "../domain/types";

export interface IAIEngineAdapter {
  /**
   * Dispatches a structured Prompt to an external LLM provider
   */
  executePrompt(prompt: Prompt, options?: Record<string, unknown>): Promise<string>;
}

export interface IPromptExecutionPipeline {
  /**
   * Orchestrates scheduled execution of all registered active prompts
   */
  runScheduler(organizationId: string): Promise<void>;
}

export interface IObservationProcessingPipeline {
  /**
   * Scrubs raw LLM response texts, applying security filters and masking secrets
   */
  sanitizeResponse(responseText: string): string;
}

export interface ICitationExtractionPipeline {
  /**
   * Coordinates reference URL extraction from response bodies, fetching title headers
   */
  extractCitations(organizationId: string, responseText: string): Promise<Citation[]>;
}

export interface IEntityResolutionPipeline {
  /**
   * Links raw brand names inside response texts with established Wikidata items
   */
  resolveEntities(organizationId: string, responseText: string): Promise<Entity[]>;
}

export interface IConfidenceScoringPipeline {
  /**
   * Calculates structural classification accuracy ratings
   */
  computeExtractionConfidence(responseText: string, matchedSegment: string): ConfidenceVO;
}
