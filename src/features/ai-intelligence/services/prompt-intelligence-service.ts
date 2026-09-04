import {
  PromptDefinition,
  PromptSchedule,
  PromptExecution,
  PromptExecutionStatus,
  PositionObservation,
  PromptVariable,
  PromptCategory,
  PromptIntentType,
  PositionPresence,
  EvidenceStructureType,
  AuditMetadata,
  Brand
} from "../domain/types";
import { PromptIntelligenceRepository, BrandRepository, CompetitorRepository } from "../repositories";
import { AIVisibilityProviderRegistry } from "../../../services/ai/ai-visibility-provider";
import { AIVisibilityAuditEngine } from "./ai-visibility-audit-engine";

export interface ModelDefinition {
  provider: string;
  model: string;
  version?: string;
  capabilities: string[];
  isActive: boolean;
}

export const SUPPORTED_MODELS: ModelDefinition[] = [
  {
    provider: "MockEngine",
    model: "sonar-medium",
    version: "1.0.0",
    capabilities: ["RAG", "citations", "web_search"],
    isActive: true
  },
  {
    provider: "Google",
    model: "gemini-1.5-flash",
    version: "1.5",
    capabilities: ["RAG", "web_search", "large_context"],
    isActive: true
  },
  {
    provider: "Google",
    model: "gemini-1.5-pro",
    version: "1.5",
    capabilities: ["RAG", "web_search", "large_context", "complex_reasoning"],
    isActive: true
  },
  {
    provider: "OpenAI",
    model: "gpt-4o",
    version: "4.0",
    capabilities: ["RAG", "web_search", "code_interpreter"],
    isActive: false // Represents unsupported/unconfigured local model cataloging
  }
];

export class PromptIntelligenceService {
  private repo: PromptIntelligenceRepository;
  private brandRepo: BrandRepository;
  private compRepo: CompetitorRepository;

  constructor(
    repo?: PromptIntelligenceRepository,
    brandRepo?: BrandRepository,
    compRepo?: CompetitorRepository
  ) {
    this.repo = repo || new PromptIntelligenceRepository();
    this.brandRepo = brandRepo || new BrandRepository();
    this.compRepo = compRepo || new CompetitorRepository();
  }

  /**
   * Creates a new Prompt Definition in the library.
   */
  public async createPromptDefinition(
    organizationId: string,
    brandId: string,
    name: string,
    template: string,
    category: PromptCategory,
    intent: PromptIntentType,
    locale: string,
    variables: PromptVariable[],
    competitors: string[],
    tags: string[],
    notes?: string,
    actorId = "system"
  ): Promise<PromptDefinition> {
    const id = crypto.randomUUID();
    const auditMeta: AuditMetadata = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: actorId,
      updatedBy: actorId,
      version: 1
    };

    const definition: PromptDefinition = {
      id,
      organizationId,
      brandId,
      name,
      promptTemplate: template,
      category,
      intent,
      locale,
      isActive: true,
      variables,
      competitors,
      tags,
      notes,
      version: 1, // Start with version 1
      audit: auditMeta
    };

    return await this.repo.saveDefinition(definition);
  }

  /**
   * Updates an existing Prompt Definition. Creates an IMMUTABLE snapshot version if template/variables change.
   */
  public async updatePromptDefinition(
    organizationId: string,
    id: string,
    updates: Partial<Omit<PromptDefinition, "id" | "organizationId" | "brandId" | "audit">>,
    actorId = "system"
  ): Promise<PromptDefinition> {
    const existing = await this.repo.findDefinitionById(organizationId, id);
    if (!existing) {
      throw new Error("Prompt Definition not found");
    }

    let requireNewVersion = false;

    // A new version is required when execution semantics change
    if (updates.promptTemplate !== undefined && updates.promptTemplate !== existing.promptTemplate) {
      requireNewVersion = true;
    }
    if (updates.variables !== undefined && JSON.stringify(updates.variables) !== JSON.stringify(existing.variables)) {
      requireNewVersion = true;
    }
    if (updates.category !== undefined && updates.category !== existing.category) {
      requireNewVersion = true;
    }
    if (updates.intent !== undefined && updates.intent !== existing.intent) {
      requireNewVersion = true;
    }
    if (updates.locale !== undefined && updates.locale !== existing.locale) {
      requireNewVersion = true;
    }

    if (requireNewVersion) {
      existing.version += 1; // Increment template version snapshot count
    }

    // Merge updates
    const updated: PromptDefinition = {
      ...existing,
      ...updates,
      audit: {
        ...existing.audit,
        updatedAt: new Date().toISOString(),
        updatedBy: actorId
      }
    };

    return await this.repo.saveDefinition(updated);
  }

  /**
   * Resolves a parameterized template text with variable values.
   * Throws an explicit validation failure if values are missing or invalid.
   */
  public resolvePromptText(
    template: string,
    variables: PromptVariable[],
    values: Record<string, string>
  ): string {
    let resolved = template;

    for (const v of variables) {
      const value = values[v.name] !== undefined ? values[v.name] : v.defaultValue;

      if (value === undefined || value.trim() === "") {
        throw new Error(`Validation Error: Required variable {${v.name}} is missing or empty, with no default value.`);
      }

      // Safe replace all placeholders
      const placeholder = `{${v.name}}`;
      resolved = resolved.split(placeholder).join(value);
    }

    // Check if there are any remaining unresolved placeholders
    const remaining = resolved.match(/\{([^}]+)\}/g);
    if (remaining) {
      throw new Error(`Validation Error: Unresolved template placeholder(s) detected: ${remaining.join(", ")}`);
    }

    return resolved;
  }

  /**
   * Transition execution state following strict state machine rules.
   */
  public async transitionExecutionStatus(
    organizationId: string,
    executionId: string,
    newStatus: PromptExecutionStatus,
    errMessage?: string
  ): Promise<PromptExecution> {
    const execution = await this.repo.findExecutionById(organizationId, executionId);
    if (!execution) {
      throw new Error("Prompt Execution record not found");
    }

    const current = execution.status;

    // Invariant Enforcement Matrix
    const allowed: Record<PromptExecutionStatus, PromptExecutionStatus[]> = {
      queued: ["running", "cancelled"],
      running: ["succeeded", "failed", "timed_out", "cancelled"],
      succeeded: [], // terminal
      failed: [], // terminal
      timed_out: [], // terminal
      cancelled: [] // terminal
    };

    if (!allowed[current].includes(newStatus)) {
      throw new Error(`Illegal State Transition: Cannot transition execution status from '${current}' to '${newStatus}'.`);
    }

    execution.status = newStatus;
    execution.updatedAt = new Date().toISOString();
    if (errMessage) {
      execution.errorMessage = errMessage;
    }

    if (newStatus === "running") {
      execution.attempts += 1;
    }

    return await this.repo.saveExecution(execution);
  }

  /**
   * Execute a prompt definition against a specific AI model.
   */
  public async executePrompt(
    organizationId: string,
    promptDefinitionId: string,
    values: Record<string, string>,
    modelName: string,
    actorId = "system",
    scheduledFor?: Date | string
  ): Promise<PromptExecution> {
    const definition = await this.repo.findDefinitionById(organizationId, promptDefinitionId);
    if (!definition) {
      throw new Error("Prompt Definition not found");
    }

    const brand = await this.brandRepo.findById(organizationId, definition.brandId);
    if (!brand) {
      throw new Error("Linked brand not found");
    }

    // 1. Resolve Variables
    const resolvedPromptText = this.resolvePromptText(definition.promptTemplate, definition.variables, values);

    // 2. Create Execution in 'queued' state
    const executionId = crypto.randomUUID();
    const modelDef = SUPPORTED_MODELS.find(m => m.model === modelName) || SUPPORTED_MODELS[0];

    const execution: PromptExecution = {
      id: executionId,
      organizationId,
      promptId: promptDefinitionId,
      promptVersion: definition.version,
      resolvedPromptText,
      variablesValues: values,
      status: "queued",
      provider: modelDef.provider,
      model: modelDef.model,
      modelVersion: modelDef.version,
      attempts: 0,
      maxAttempts: 3,
      scheduledFor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let persisted = await this.repo.saveExecution(execution);

    // 3. Transition to 'running'
    persisted = await this.transitionExecutionStatus(organizationId, executionId, "running");

    const provider = AIVisibilityProviderRegistry.getProvider(
      modelDef.provider.toLowerCase() === "google" ? "gemini" : "mock"
    );

    const startTime = Date.now();
    try {
      const result = await provider.executePrompt(resolvedPromptText, definition.locale);

      if (result.status === "failed") {
        throw new Error(result.error || "Model execution failed");
      }

      const latencyMs = result.latencyMs || (Date.now() - startTime);

      persisted.status = "succeeded";
      persisted.responseText = result.response;
      persisted.latencyMs = latencyMs;
      persisted.executedAt = result.executedAt;
      persisted.updatedAt = new Date().toISOString();

      await this.repo.saveExecution(persisted);

      // 4. Perform Position & Citation Analysis
      await this.analyzeExecutionPositions(organizationId, persisted, brand, definition.competitors);

      return persisted;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await this.transitionExecutionStatus(organizationId, executionId, "failed", errMsg);
      return persisted;
    }
  }

  /**
   * Compares the same resolved prompt against multiple AI models.
   */
  public async executeComparison(
    organizationId: string,
    promptDefinitionId: string,
    values: Record<string, string>,
    models: string[],
    actorId = "system"
  ): Promise<PromptExecution[]> {
    const executions: PromptExecution[] = [];

    for (const m of models) {
      const exec = await this.executePrompt(organizationId, promptDefinitionId, values, m, actorId);
      executions.push(exec);
    }

    return executions;
  }

  /**
   * Extracts brand and competitor ranking positions from AI response text semantically.
   */
  private async analyzeExecutionPositions(
    organizationId: string,
    execution: PromptExecution,
    brand: Brand,
    competitors: string[]
  ): Promise<void> {
    const text = execution.responseText || "";
    if (!text) return;

    // Instantiate Visibility Engine to reuse lexical and citation matchers
    const visEngine = new AIVisibilityAuditEngine();

    // Analyze target brand first
    const brandAliases = [brand.name, "رشا گستر", "رشا", "rasha"];
    const brandObservation = this.extractEntityPosition(text, brand.id, brand.name, brandAliases, execution.id, organizationId);
    await this.repo.savePosition(brandObservation);

    // Analyze competitors
    for (const compName of competitors) {
      const compAliases = [compName];
      // Simple alias mapping for standard competitors if named
      if (compName.toLowerCase() === "competitorx") {
        compAliases.push("سئوکار قدیمی");
      }
      const compObservation = this.extractEntityPosition(text, compName, compName, compAliases, execution.id, organizationId);
      await this.repo.savePosition(compObservation);
    }
  }

  /**
   * Semantic parsing of list rankings, table layouts, and prose recommendations
   */
  public extractEntityPosition(
    text: string,
    entityId: string,
    entityName: string,
    aliases: string[],
    executionId: string,
    organizationId: string
  ): PositionObservation {
    const lowerText = text.toLowerCase();
    const id = crypto.randomUUID();

    let presence: PositionPresence = "not_present";
    let numericPosition: number | undefined = undefined;
    let evidenceExcerpt = "";
    let evidenceStructure: EvidenceStructureType = "unknown";
    let confidence = 0.5;

    // Detect if mentioned in text
    let isMentioned = false;
    let matchedAlias = "";
    for (const alias of aliases) {
      if (lowerText.includes(alias.toLowerCase())) {
        isMentioned = true;
        matchedAlias = alias;
        break;
      }
    }

    if (isMentioned) {
      presence = "mentioned";
      evidenceExcerpt = text.substring(Math.max(0, lowerText.indexOf(matchedAlias.toLowerCase()) - 50), Math.min(text.length, lowerText.indexOf(matchedAlias.toLowerCase()) + matchedAlias.length + 50));
      evidenceStructure = "prose";
      confidence = 0.85;

      // 1. Numbered List Analysis (e.g. "1. Rasha Gostar" or "1- Rasha Gostar" or "1 - رشا گستر")
      const numberedRegex = /(?:^|\n)\s*(\d+)[\.\-\)]\s*([^?\n]+)/gi;
      let match;
      let listIndex = 1;
      let matchedInList = false;

      while ((match = numberedRegex.exec(text)) !== null) {
        const indexStr = match[1];
        const content = match[2];

        // Check if any alias exists in the list content
        const matchesAlias = aliases.some(alias => content.toLowerCase().includes(alias.toLowerCase()));
        if (matchesAlias) {
          numericPosition = parseInt(indexStr, 10);
          presence = "ranked";
          evidenceStructure = "numbered_list";
          evidenceExcerpt = match[0].trim();
          confidence = 0.98;
          matchedInList = true;
          break;
        }
      }

      // 2. Bullet List Analysis
      if (!matchedInList) {
        const bulletRegex = /(?:^|\n)\s*[\*\•\-]\s*([^?\n]+)/gi;
        let bulletIdx = 1;
        while ((match = bulletRegex.exec(text)) !== null) {
          const content = match[1];
          const matchesAlias = aliases.some(alias => content.toLowerCase().includes(alias.toLowerCase()));
          if (matchesAlias) {
            numericPosition = bulletIdx;
            presence = "ranked";
            evidenceStructure = "bullet_list";
            evidenceExcerpt = match[0].trim();
            confidence = 0.90;
            matchedInList = true;
            break;
          }
          bulletIdx++;
        }
      }

      // 3. Recommended / Preference Analysis
      if (!matchedInList) {
        const preferredWords = ["recommend", "highly recommend", "best choice", "preferred", "برتر", "بهترین", "توصیه"];
        const isRecommended = preferredWords.some(w => lowerText.includes(w));
        if (isRecommended) {
          presence = "recommended";
          confidence = 0.90;
        }
      }
    }

    return {
      id,
      organizationId,
      sourceExecutionId: executionId,
      subjectEntityId: entityName, // we store the friendly name of competitor or brand
      presence,
      numericPosition,
      evidenceExcerpt: evidenceExcerpt || "ذکری از نهاد یافت نشد",
      evidenceStructure,
      confidence,
      analyzerVersion: "1.0.0",
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Configures a scheduler definition for a Prompt Definition
   */
  public async schedulePrompt(
    organizationId: string,
    promptId: string,
    cronExpression: string,
    timezone = "UTC",
    actorId = "system"
  ): Promise<PromptSchedule> {
    const existing = await this.repo.findScheduleByPromptId(organizationId, promptId);

    if (existing) {
      existing.cronExpression = cronExpression;
      existing.timezone = timezone;
      existing.enabled = true;
      existing.scheduleVersion += 1;
      existing.updatedAt = new Date().toISOString();
      return await this.repo.saveSchedule(existing);
    }

    const schedule: PromptSchedule = {
      id: crypto.randomUUID(),
      organizationId,
      promptId,
      enabled: true,
      cronExpression,
      timezone,
      status: "IDLE",
      scheduleVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return await this.repo.saveSchedule(schedule);
  }

  /**
   * Disables a prompt schedule
   */
  public async unschedulePrompt(organizationId: string, promptId: string): Promise<boolean> {
    const existing = await this.repo.findScheduleByPromptId(organizationId, promptId);
    if (!existing) return false;

    existing.enabled = false;
    existing.updatedAt = new Date().toISOString();
    await this.repo.saveSchedule(existing);
    return true;
  }
}
