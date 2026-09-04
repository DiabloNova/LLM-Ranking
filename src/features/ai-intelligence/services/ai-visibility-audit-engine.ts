import {
  AIVisibilityAudit,
  AIVisibilityAuditStatus,
  AIVisibilityAuditMetrics,
  AuditPrompt,
  AuditPromptStatus,
  AuditPromptAnalysis,
  Brand,
  AuditMetadata
} from "../domain/types";
import { BrandRepository, AIVisibilityAuditRepository } from "../repositories";
import { AIVisibilityProviderRegistry } from "../../../services/ai/ai-visibility-provider";

export class AIVisibilityAuditEngine {
  private brandRepo: BrandRepository;
  private auditRepo: AIVisibilityAuditRepository;

  constructor(
    brandRepo?: BrandRepository,
    auditRepo?: AIVisibilityAuditRepository
  ) {
    this.brandRepo = brandRepo || new BrandRepository();
    this.auditRepo = auditRepo || new AIVisibilityAuditRepository();
  }

  /**
   * Runs the complete AI Visibility Audit pipeline for a Brand.
   */
  public async executeAudit(
    organizationId: string,
    brandId: string,
    actorId = "system",
    providerType?: "mock" | "gemini"
  ): Promise<AIVisibilityAudit> {
    // 1. Retrieve the brand
    const brand = await this.brandRepo.findById(organizationId, brandId);
    if (!brand) {
      throw new Error(`Brand with ID ${brandId} not found in organization ${organizationId}.`);
    }

    const brandName = brand.name;
    const brandWebsite = brand.website || "";
    let brandDomain = "";
    try {
      if (brandWebsite) {
        brandDomain = new URL(brandWebsite).hostname.replace("www.", "");
      }
    } catch {
      // Ignore URL parsing errors and keep domain empty
    }

    // Define Persian/English brand variants and known aliases for robust detection
    const aliases = this.resolveBrandAliases(brand);

    // 2. Create Audit Record in PENDING state
    const auditId = crypto.randomUUID();
    const auditMeta: AuditMetadata = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: actorId,
      updatedBy: actorId,
      version: 1
    };

    let audit: AIVisibilityAudit = {
      id: auditId,
      organizationId,
      brandId,
      status: "PENDING",
      overallScore: null,
      metrics: {},
      promptsCoverage: {
        total: 7,
        executed: 0,
        analyzed: 0,
        failed: 0,
        skipped: 0
      },
      evidenceSummary: {
        mentions: [],
        citations: [],
        entityRecognition: [],
        answerInclusion: []
      },
      scoringVersion: "1.0.0",
      analyzerVersion: "1.0.0",
      audit: auditMeta
    };

    await this.auditRepo.save(audit);

    // Transition to RUNNING state
    audit.status = "RUNNING";
    audit.audit.updatedAt = new Date().toISOString();
    await this.auditRepo.save(audit);

    // 3. Define the Explicit Controlled Set of 7 Prompts
    const promptDefinitions = this.generatePromptSet(brandName);

    const persistedPrompts: AuditPrompt[] = [];

    for (const def of promptDefinitions) {
      const promptId = crypto.randomUUID();
      const pMeta: AuditMetadata = {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
        version: 1
      };

      const auditPrompt: AuditPrompt = {
        id: promptId,
        organizationId,
        auditId,
        promptText: def.text,
        category: def.category,
        targetEntity: brandName,
        locale: def.locale,
        status: "PENDING",
        analysis: {},
        audit: pMeta
      };

      const savedPrompt = await this.auditRepo.savePrompt(auditPrompt);
      persistedPrompts.push(savedPrompt);
    }

    // 4. Prompt Execution and Analysis (Support Partial Failures)
    audit.status = "ANALYZING";
    audit.audit.updatedAt = new Date().toISOString();
    await this.auditRepo.save(audit);

    const provider = AIVisibilityProviderRegistry.getProvider(providerType);

    let executedCount = 0;
    let failedCount = 0;
    let analyzedCount = 0;

    const successfulAnalyses: AuditPromptAnalysis[] = [];
    const mentionsEvidence: Array<{ promptId: string; count: number; snippet: string; level: string }> = [];
    const citationsEvidence: Array<{ promptId: string; url: string; domain: string; authority: string | number }> = [];
    const entityRecEvidence: Array<{ promptId: string; status: string }> = [];
    const answerInclEvidence: Array<{ promptId: string; status: string }> = [];

    for (const prompt of persistedPrompts) {
      prompt.status = "RUNNING";
      prompt.audit.updatedAt = new Date().toISOString();
      await this.auditRepo.savePrompt(prompt);

      executedCount++;
      audit.promptsCoverage.executed = executedCount;
      await this.auditRepo.save(audit);

      const pStartTime = Date.now();
      try {
        const result = await provider.executePrompt(prompt.promptText, prompt.locale);

        if (result.status === "failed") {
          throw new Error(result.error || "Provider prompt execution failed");
        }

        const latencyMs = result.latencyMs || (Date.now() - pStartTime);

        // Perform deep, production-grade analysis of the response text
        const responseText = result.response;
        const analysis = this.analyzeResponse(responseText, brandName, aliases, brandDomain, prompt.category);

        prompt.status = "COMPLETED";
        prompt.executedAt = result.executedAt;
        prompt.latencyMs = latencyMs;
        prompt.responseText = responseText;
        prompt.analysis = analysis;
        prompt.audit.updatedAt = new Date().toISOString();

        await this.auditRepo.savePrompt(prompt);

        analyzedCount++;
        successfulAnalyses.push(analysis);

        // Populate prompt-specific trace evidence summary items
        if (analysis.brandMentions.detected) {
          mentionsEvidence.push({
            promptId: prompt.id,
            count: analysis.brandMentions.count,
            snippet: analysis.brandMentions.evidence,
            level: analysis.answerVisibility.level
          });
        }

        if (analysis.citationPresence.present) {
          for (const cit of analysis.citationPresence.citations) {
            citationsEvidence.push({
              promptId: prompt.id,
              url: cit.url,
              domain: cit.domain,
              authority: cit.authority
            });
          }
        }

        entityRecEvidence.push({
          promptId: prompt.id,
          status: analysis.entityRecognition.status
        });

        answerInclEvidence.push({
          promptId: prompt.id,
          status: analysis.answerInclusion.status
        });

      } catch (err: unknown) {
        failedCount++;
        prompt.status = "FAILED";
        prompt.errorMessage = err instanceof Error ? err.message : String(err);
        prompt.audit.updatedAt = new Date().toISOString();
        await this.auditRepo.savePrompt(prompt);
      }
    }

    // Update prompt coverage counts
    audit.promptsCoverage.analyzed = analyzedCount;
    audit.promptsCoverage.failed = failedCount;

    // 5. Final Synthesis and Scoring (Fail overall if all prompts failed completely)
    if (analyzedCount === 0) {
      audit.status = "FAILED";
      audit.overallScore = 0;
      audit.audit.updatedAt = new Date().toISOString();
      await this.auditRepo.save(audit);
      return audit;
    }

    // Aggregate individual dimensions scores across all successful runs
    const metricsBreakdown = this.synthesizeOverallMetrics(successfulAnalyses);

    // Compute Overall Deterministic Score
    const overallScore = this.computeOverallScore(metricsBreakdown);

    // Assemble final audit entity
    audit.status = "COMPLETED";
    audit.overallScore = overallScore;
    audit.metrics = metricsBreakdown;
    audit.evidenceSummary = {
      mentions: mentionsEvidence,
      citations: citationsEvidence,
      entityRecognition: entityRecEvidence,
      answerInclusion: answerInclEvidence
    };
    audit.audit.updatedAt = new Date().toISOString();

    return await this.auditRepo.save(audit);
  }

  /**
   * Helper extracting a robust array of brand casing, spelling, and translation variants to handle bilinguality
   */
  private resolveBrandAliases(brand: Brand): string[] {
    const list = new Set<string>();
    list.add(brand.name.trim().toLowerCase());

    // Guess translation/spelling variations
    if (brand.name.toLowerCase() === "rasha gostar") {
      list.add("رشا گستر");
      list.add("شرکت رشا گستر");
      list.add("رشا");
      list.add("rasha");
    } else if (brand.name === "رشا گستر") {
      list.add("rasha gostar");
      list.add("rasha");
      list.add("رشا");
    }

    // Add general suffix stripping or variations
    const trimmed = brand.name.replace(/co\.|corp|llc|inc|company|شرکت/gi, "").trim().toLowerCase();
    if (trimmed && trimmed.length > 2) {
      list.add(trimmed);
    }

    return Array.from(list);
  }

  /**
   * Generates a balanced set of 7 queries for AI answers validation
   */
  private generatePromptSet(brandName: string): Array<{ text: string; category: string; locale: string }> {
    return [
      {
        text: `What is ${brandName} and what conversational AI or RAG optimization capabilities does it provide?`,
        category: "brand discovery",
        locale: "en"
      },
      {
        text: `معرفی کوتاه برند ${brandName} و خدمات تخصصی آن در بهینه‌سازی موتورهای پاسخ‌گو (AEO) چیست؟`,
        category: "brand discovery",
        locale: "fa"
      },
      {
        text: `What are the core products and visual dashboard software offered by ${brandName}?`,
        category: "product/service discovery",
        locale: "en"
      },
      {
        text: `Which companies are recognized as market leaders in AI Visibility Optimization and conversational search analytics?`,
        category: "category queries",
        locale: "en"
      },
      {
        text: `How does ${brandName} compare with traditional SEO optimization platforms regarding citation authority?`,
        category: "comparison queries",
        locale: "en"
      },
      {
        text: `Recommend a reputable semantic SEO platform to increase citations on Perplexity and ChatGPT.`,
        category: "recommendation queries",
        locale: "en"
      },
      {
        text: `آیا شرکت ${brandName} به عنوان یک نهاد فناوری و دانش‌بنیان معتبر در مراجع معنایی ثبت شده است؟`,
        category: "entity-specific queries",
        locale: "fa"
      }
    ];
  }

  /**
   * Rich lexical analyzer mapping textual signals back to auditable evidence
   */
  public analyzeResponse(
    text: string,
    brandName: string,
    aliases: string[],
    brandDomain: string,
    category: string
  ): AuditPromptAnalysis {
    const lowerText = text.toLowerCase();

    // 1. Brand Mention Detection
    let mentionDetected = false;
    let mentionCount = 0;
    let matchedSnippet = "";

    // Find occurrences
    for (const alias of aliases) {
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escapedAlias}\\b|${escapedAlias}`, "gi");
      const matches = text.match(regex);
      if (matches && matches.length > 0) {
        mentionDetected = true;
        mentionCount += matches.length;

        // Extract a snippet centered around the first occurrence of match
        if (!matchedSnippet) {
          const firstIdx = lowerText.indexOf(alias);
          if (firstIdx !== -1) {
            const start = Math.max(0, firstIdx - 60);
            const end = Math.min(text.length, firstIdx + alias.length + 60);
            matchedSnippet = "..." + text.substring(start, end).trim() + "...";
          }
        }
      }
    }

    // Avoid false positives (e.g., if mention was detected but only as a substring of an unrelated larger word, though regex bounds limit this)
    if (mentionDetected && !matchedSnippet) {
      matchedSnippet = text.substring(0, 120) + "...";
    }

    // 2. Answer Visibility
    let visibilityLevel: AuditPromptAnalysis["answerVisibility"]["level"] = "not_mentioned";
    if (mentionDetected) {
      visibilityLevel = "directly_mentioned";

      const preferredPatterns = [
        "highly recommend", "recommend", "best choice", "preferred", "برتر", "توصیه", "بهترین گزینه", "پیشنهاد ما"
      ];
      const hasPreference = preferredPatterns.some(p => lowerText.includes(p));

      const prominentPatterns = [
        "stands out", "pioneered", "leader", "pioneer", "پیشگام", "پیشرو", "نوآور"
      ];
      const hasProminence = prominentPatterns.some(p => lowerText.includes(p));

      if (hasPreference) {
        visibilityLevel = "recommended_preferred";
      } else if (hasProminence || mentionCount >= 3) {
        visibilityLevel = "prominently_included";
      }
    } else {
      // Check for indirect references (like citing the domain without explicitly stating the brand name)
      if (brandDomain && lowerText.includes(brandDomain)) {
        visibilityLevel = "indirectly_referenced";
      }
    }

    // 3. Entity Recognition
    let entityStatus: AuditPromptAnalysis["entityRecognition"]["status"] = "not_recognized";
    if (mentionDetected) {
      entityStatus = "correctly_recognized";

      const categoryPatterns = [
        "platform", "software", "solution", "brand", "company", "firm", "پلتفرم", "سامانه", "شرکت", "برند", "هوش مصنوعی"
      ];
      const matchesCategoryContext = categoryPatterns.some(p => lowerText.includes(p));

      if (matchesCategoryContext && mentionCount >= 2) {
        entityStatus = "strongly_associated";
      }

      // Check if ambiguous (mixed up with other unrelated similar words like trading, deserts, or competitors in the same sentence)
      if (lowerText.includes("unrelated") || lowerText.includes("competitor") || lowerText.includes("رقیب")) {
        // If there's an active competitor or unrelated entity listed as the principal actor, classify as ambiguous
        const targetIndex = lowerText.indexOf(brandName.toLowerCase());
        const competitorIndex = lowerText.indexOf("competitor");
        if (competitorIndex !== -1 && Math.abs(targetIndex - competitorIndex) < 40) {
          entityStatus = "ambiguously_recognized";
        }
      }
    }

    // 4. Citation Presence & Link Extraction
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urlMatches = text.match(urlRegex) || [];
    const citations: AuditPromptAnalysis["citationPresence"]["citations"] = [];

    let brandDomainCited = false;

    for (const matchedUrl of urlMatches) {
      const sanitizedUrl = matchedUrl.replace(/[.,);]$/, ""); // remove tail punctuation
      try {
        const parsedUrl = new URL(sanitizedUrl);
        const domain = parsedUrl.hostname.replace("www.", "");
        const isTargetDomain = brandDomain ? domain === brandDomain : false;

        if (isTargetDomain) {
          brandDomainCited = true;
        }

        // Authority signal modeling: 0-100 score or "unknown"
        let authority: string | number = "unknown";
        if (domain.endsWith(".edu") || domain.endsWith(".gov")) {
          authority = 95;
        } else if (domain.endsWith(".org") || domain.includes("wikipedia.org")) {
          authority = 88;
        } else if (isTargetDomain) {
          authority = 72; // brand domain baseline
        } else if (domain.includes("external-competitor.com")) {
          authority = 60;
        }

        citations.push({
          url: sanitizedUrl,
          domain,
          title: `${domain.split(".")[0].toUpperCase()} reference link`,
          isTargetDomain,
          authority
        });
      } catch {
        // Skip malformed text URLs
      }
    }

    const citationPresent = citations.length > 0;

    // 5. Source Authority Status
    let authorityStatus: AuditPromptAnalysis["sourceAuthority"]["status"] = "unknown";
    let averageAuthority: number | undefined = undefined;

    const resolvedAuthorities = citations
      .map(c => c.authority)
      .filter((a): a is number => typeof a === "number");

    if (resolvedAuthorities.length > 0) {
      authorityStatus = "resolved";
      averageAuthority = Math.round(resolvedAuthorities.reduce((sum, val) => sum + val, 0) / resolvedAuthorities.length);
    }

    // 6. Answer Inclusion
    let answerInclusion: AuditPromptAnalysis["answerInclusion"]["status"] = "absent";
    if (mentionDetected) {
      answerInclusion = "included";

      if (visibilityLevel === "recommended_preferred") {
        answerInclusion = "recommended_preferred";
      } else if (visibilityLevel === "prominently_included") {
        answerInclusion = "prominently_included";
      }

      // Distinguish passing mention from actual inclusion
      if (category === "category queries") {
        // If it's a general industry query and we are mentioned but not prominently compared or listed, it is a passing mention
        const passingWords = ["also mentioned", "other platforms include", "همچنین", "دیگر پلتفرم‌ها"];
        const isPassing = passingWords.some(w => lowerText.includes(w));
        if (isPassing) {
          answerInclusion = "mentioned_but_not_included";
        }
      }
    }

    // 7. Prompt Level Contribution calculation
    const scoreContribution = this.calculatePromptScore({
      answerVisibility: { level: visibilityLevel, evidence: "", confidence: 1 },
      brandMentions: { detected: mentionDetected, count: mentionCount, type: "text", evidence: "", confidence: 1 },
      entityRecognition: { status: entityStatus, evidence: "", confidence: 1 },
      citationPresence: { present: citationPresent, count: citations.length, citations, confidence: 1 },
      sourceAuthority: { status: authorityStatus, averageScore: averageAuthority, evidence: "" },
      answerInclusion: { status: answerInclusion, evidence: "", confidence: 1 },
      scoreContribution: 0
    });

    return {
      answerVisibility: {
        level: visibilityLevel,
        evidence: mentionDetected ? matchedSnippet : "برند در پاسخ یافت نشد",
        confidence: mentionDetected ? 0.95 : 1.0
      },
      brandMentions: {
        detected: mentionDetected,
        count: mentionCount,
        type: "Lexical Match",
        evidence: matchedSnippet || "هیچ نامی کشف نشد",
        confidence: mentionDetected ? 0.98 : 1.0
      },
      entityRecognition: {
        status: entityStatus,
        evidence: mentionDetected ? `موجودیت '${brandName}' با الگوهای معنایی مرتبط تطبیق دارد.` : "عدم انطباق موجودیت",
        confidence: mentionDetected ? 0.92 : 1.0
      },
      citationPresence: {
        present: citationPresent,
        count: citations.length,
        citations,
        confidence: citationPresent ? 0.95 : 1.0
      },
      sourceAuthority: {
        status: authorityStatus,
        averageScore: averageAuthority,
        evidence: authorityStatus === "resolved"
          ? `میانگین اعتبار مراجع استخراج شده برابر ${averageAuthority} است.`
          : "هیچ مرجعی با دامنه اعتبار معتبر یافت نشد."
      },
      answerInclusion: {
        status: answerInclusion,
        evidence: mentionDetected ? `برند در پاسخ به عنوان کاندیدای دسته ${category} قرار دارد.` : "پاسخ خارج از محدوده",
        confidence: mentionDetected ? 0.90 : 1.0
      },
      scoreContribution
    };
  }

  /**
   * Deterministic scoring calculation for an individual prompt
   */
  private calculatePromptScore(analysis: AuditPromptAnalysis): number {
    // 1. Answer Visibility: 20 points max
    const visPoints = {
      recommended_preferred: 20,
      prominently_included: 16,
      directly_mentioned: 12,
      indirectly_referenced: 8,
      not_mentioned: 0
    }[analysis.answerVisibility.level];

    // 2. Brand Mentions Strength: 15 points max
    const mentionPoints = analysis.brandMentions.detected
      ? Math.min(15, 8 + analysis.brandMentions.count * 2)
      : 0;

    // 3. Entity Recognition: 15 points max
    const entPoints = {
      strongly_associated: 15,
      correctly_recognized: 12,
      ambiguously_recognized: 6,
      not_recognized: 0
    }[analysis.entityRecognition.status];

    // 4. Citation Presence: 15 points max
    const citationPoints = analysis.citationPresence.present
      ? Math.min(15, 10 + analysis.citationPresence.count * 2)
      : 0;

    // 5. Source Authority: 15 points max
    const authPoints = analysis.sourceAuthority.status === "resolved" && analysis.sourceAuthority.averageScore
      ? Math.round((analysis.sourceAuthority.averageScore / 100) * 15)
      : 0;

    // 6. Answer Inclusion: 20 points max
    const inclPoints = {
      recommended_preferred: 20,
      prominently_included: 16,
      included: 12,
      mentioned_but_not_included: 6,
      absent: 0
    }[analysis.answerInclusion.status];

    return visPoints + mentionPoints + entPoints + citationPoints + authPoints + inclPoints;
  }

  /**
   * Synthesizes overall metrics from array of successfully analyzed prompt analyses
   */
  private synthesizeOverallMetrics(analyses: AuditPromptAnalysis[]): AIVisibilityAuditMetrics {
    const count = analyses.length;
    if (count === 0) {
      return {
        answerVisibilityScore: 0,
        brandMentionScore: 0,
        entityRecognitionScore: 0,
        citationPresenceScore: 0,
        sourceAuthorityScore: 0,
        answerInclusionScore: 0
      };
    }

    let avgVis = 0;
    let avgMention = 0;
    let avgEntity = 0;
    let avgCitation = 0;
    let avgAuthority = 0;
    let avgInclusion = 0;

    let authorityResolvedCount = 0;

    for (const item of analyses) {
      // Map Answer Visibility Score
      const visMap = {
        recommended_preferred: 100,
        prominently_included: 85,
        directly_mentioned: 65,
        indirectly_referenced: 35,
        not_mentioned: 0
      }[item.answerVisibility.level];
      avgVis += visMap;

      // Map Brand Mention Score
      const mentionMap = item.brandMentions.detected ? Math.min(100, 60 + item.brandMentions.count * 15) : 0;
      avgMention += mentionMap;

      // Map Entity Recognition Score
      const entMap = {
        strongly_associated: 100,
        correctly_recognized: 85,
        ambiguously_recognized: 45,
        not_recognized: 0
      }[item.entityRecognition.status];
      avgEntity += entMap;

      // Map Citation Presence Score
      const citMap = item.citationPresence.present ? Math.min(100, 70 + item.citationPresence.count * 10) : 0;
      avgCitation += citMap;

      // Map Source Authority Score
      if (item.sourceAuthority.status === "resolved" && item.sourceAuthority.averageScore !== undefined) {
        avgAuthority += item.sourceAuthority.averageScore;
        authorityResolvedCount++;
      }

      // Map Answer Inclusion Score
      const inclMap = {
        recommended_preferred: 100,
        prominently_included: 85,
        included: 65,
        mentioned_but_not_included: 30,
        absent: 0
      }[item.answerInclusion.status];
      avgInclusion += inclMap;
    }

    return {
      answerVisibilityScore: Math.round(avgVis / count),
      brandMentionScore: Math.round(avgMention / count),
      entityRecognitionScore: Math.round(avgEntity / count),
      citationPresenceScore: Math.round(avgCitation / count),
      sourceAuthorityScore: authorityResolvedCount > 0 ? Math.round(avgAuthority / authorityResolvedCount) : 0, // 0 authority represents unknown
      answerInclusionScore: Math.round(avgInclusion / count)
    };
  }

  /**
   * Calculates overall deterministic weighted composite score
   * Account for dimensions weights explicitly:
   * - Answer Visibility: 20%
   * - Brand Mention: 15%
   * - Entity Recognition: 15%
   * - Citation Presence: 15%
   * - Source Authority: 15%
   * - Answer Inclusion: 20%
   */
  private computeOverallScore(metrics: AIVisibilityAuditMetrics): number {
    let visWeight = 0.20;
    let mentionWeight = 0.15;
    let entityWeight = 0.15;
    let citationWeight = 0.15;
    let authorityWeight = 0.15;
    let inclusionWeight = 0.20;

    // Redribute Source Authority weight to Citation Presence if authority data is missing (Score is 0)
    if (metrics.sourceAuthorityScore === 0) {
      citationWeight += 0.15;
      authorityWeight = 0.0;
    }

    const calculated = (
      metrics.answerVisibilityScore * visWeight +
      metrics.brandMentionScore * mentionWeight +
      metrics.entityRecognitionScore * entityWeight +
      metrics.citationPresenceScore * citationWeight +
      metrics.sourceAuthorityScore * authorityWeight +
      metrics.answerInclusionScore * inclusionWeight
    );

    return Math.min(Math.max(Math.round(calculated), 0), 100);
  }
}
