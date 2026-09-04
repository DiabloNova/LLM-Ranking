/**
 * Phase 7C.5 — Enterprise Prompt Operations Console
 * Oversees prompt template management, prompt version reviews, experiment tracking, and cost performance comparison.
 */

import { PromptIntent } from "../../ai-intelligence/domain/types";

export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  intent: PromptIntent;
  currentVersion: number;
  draftVersion?: number;
  templateText: string;
  variables: string[];
  status: "approved" | "pending_review" | "experimental";
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

export interface PromptExperiment {
  experimentId: string;
  templateId: string;
  testModels: string[];
  averageSentimentScore: number;
  averageVisibilityScore: number;
  citationRatePct: number;
  sampleSize: number;
  costUsd: number;
}

export class PromptOperationsConsole {
  private templates: Map<string, PromptTemplate> = new Map();
  private experiments: PromptExperiment[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    const t1: PromptTemplate = {
      id: "tmpl-brand-discovery-v1",
      name: "Standard Brand Generative Presence",
      category: "Discovery",
      intent: "Discovery",
      currentVersion: 3,
      templateText: "What are the most notable products and features offered by {brandName} in the industry of {industry}?",
      variables: ["brandName", "industry"],
      status: "approved",
      lastUpdatedBy: "admin-user-super",
      lastUpdatedAt: "2026-01-14T08:00:00Z"
    };

    const t2: PromptTemplate = {
      id: "tmpl-competitor-bench",
      name: "Competitor Market Benchmarking",
      category: "Comparison",
      intent: "Comparison",
      currentVersion: 1,
      draftVersion: 2,
      templateText: "Compare {brandName} with {competitorName} regarding service availability, pricing structures, and UI features.",
      variables: ["brandName", "competitorName"],
      status: "pending_review",
      lastUpdatedBy: "support-agent",
      lastUpdatedAt: "2026-01-20T14:30:00Z"
    };

    this.templates.set(t1.id, t1);
    this.templates.set(t2.id, t2);

    const exp1: PromptExperiment = {
      experimentId: "exp-discovery-gpt4o-vs-claude35",
      templateId: "tmpl-brand-discovery-v1",
      testModels: ["gpt-4o", "claude-3-5-sonnet"],
      averageSentimentScore: 78.4,
      averageVisibilityScore: 82.5,
      citationRatePct: 91.2,
      sampleSize: 150,
      costUsd: 1.28
    };

    this.experiments.push(exp1);
  }

  public getTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  public registerTemplate(template: Omit<PromptTemplate, "id" | "currentVersion" | "lastUpdatedAt">): PromptTemplate {
    const newId = `tmpl-${Math.random().toString(36).substr(2, 9)}`;
    const newTemplate: PromptTemplate = {
      id: newId,
      currentVersion: 1,
      lastUpdatedAt: new Date().toISOString(),
      ...template
    };
    this.templates.set(newId, newTemplate);
    return newTemplate;
  }

  public approveDraft(templateId: string, reviewerId: string): PromptTemplate {
    const template = this.templates.get(templateId);
    if (!template) throw new Error(`Template ${templateId} not found.`);

    if (template.draftVersion) {
      template.currentVersion = template.draftVersion;
      delete template.draftVersion;
    }
    template.status = "approved";
    template.lastUpdatedBy = reviewerId;
    template.lastUpdatedAt = new Date().toISOString();

    return template;
  }

  public createDraftUpdate(templateId: string, draftText: string, authorId: string): PromptTemplate {
    const template = this.templates.get(templateId);
    if (!template) throw new Error(`Template ${templateId} not found.`);

    template.draftVersion = template.currentVersion + 1;
    template.templateText = draftText;
    template.status = "pending_review";
    template.lastUpdatedBy = authorId;
    template.lastUpdatedAt = new Date().toISOString();

    return template;
  }

  public getExperiments(templateId?: string): PromptExperiment[] {
    if (templateId) {
      return this.experiments.filter(e => e.templateId === templateId);
    }
    return this.experiments;
  }

  public comparePerformance(): { model: string; avgScore: number; cost: number; latencyMs: number }[] {
    // Returns simulated model prompt comparative statistics
    return [
      { model: "gpt-4o", avgScore: 84.5, cost: 0.005, latencyMs: 820 },
      { model: "claude-3-5-sonnet", avgScore: 86.8, cost: 0.003, latencyMs: 980 },
      { model: "gemini-1.5-pro", avgScore: 79.2, cost: 0.0015, latencyMs: 1100 }
    ];
  }
}
