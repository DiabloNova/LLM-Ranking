import {
  CreateBrandCommand,
  DiscoverEntityCommand,
  CaptureAIObservationCommand,
  CalculateVisibilityScoreCommand,
  GenerateRecommendationCommand,
  RegisterPromptCommand,
  LinkSemanticEntitiesCommand
} from "../commands";
import {
  GetBrandIntelligenceQuery,
  GetVisibilityReportQuery,
  GetEntityGraphQuery,
  GetCitationAnalysisQuery
} from "../queries";
import {
  BrandDTO,
  EntityDTO,
  AIObservationDTO,
  VisibilityScoreDTO,
  RecommendationDTO,
  PromptDTO,
  EntityRelationshipDTO,
  CitationDTO
} from "../dto";
import { DTOHandlers } from "../mappers";
import {
  IBrandRepository,
  IEntityRepository,
  IPromptRepository,
  IObservationRepository,
  IVisibilityScoreRepository,
  IRecommendationRepository
} from "../../repositories/interfaces";
import {
  BrandRepository,
  EntityRepository,
  PromptRepository,
  ObservationRepository,
  VisibilityScoreRepository,
  RecommendationRepository
} from "../../repositories";
import {
  EntityService,
  CitationService,
  VisibilityService,
  ObservationService
} from "../../services";
import { DomainEventFactory, eventBus } from "../../domain/events";
import { Brand, VisibilityScore, Recommendation } from "../../domain/types";

export class ApplicationCommandHandler {
  private brandRepo: IBrandRepository;
  private entityRepo: IEntityRepository;
  private promptRepo: IPromptRepository;
  private obsRepo: IObservationRepository;
  private visRepo: IVisibilityScoreRepository;
  private recRepo: IRecommendationRepository;

  private entityService: EntityService;
  private citationService: CitationService;
  private visibilityService: VisibilityService;
  private observationService: ObservationService;

  constructor(
    brandRepo?: IBrandRepository,
    entityRepo?: IEntityRepository,
    promptRepo?: IPromptRepository,
    obsRepo?: IObservationRepository,
    visRepo?: IVisibilityScoreRepository,
    recRepo?: IRecommendationRepository
  ) {
    this.brandRepo = brandRepo || new BrandRepository();
    this.entityRepo = entityRepo || new EntityRepository();
    this.promptRepo = promptRepo || new PromptRepository();
    this.obsRepo = obsRepo || new ObservationRepository();
    this.visRepo = visRepo || new VisibilityScoreRepository();
    this.recRepo = recRepo || new RecommendationRepository();

    this.entityService = new EntityService(this.entityRepo);
    this.citationService = new CitationService(this.obsRepo);
    this.visibilityService = new VisibilityService(this.visRepo);
    this.observationService = new ObservationService(this.obsRepo, this.promptRepo, this.recRepo);
  }

  /**
   * Handle: CreateBrandCommand
   */
  public async handleCreateBrand(command: CreateBrandCommand): Promise<BrandDTO> {
    const brand: Brand = {
      id: `brand-${Math.random().toString(36).substr(2, 9)}`,
      organizationId: command.organizationId,
      name: command.name,
      description: command.description,
      website: command.website,
      industry: command.industry,
      country: command.country,
      audit: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: command.actorId,
        updatedBy: command.actorId,
        version: 1
      }
    };

    const saved = await this.brandRepo.save(brand);

    // Event Dispatching (EDA)
    const brandCreatedEvent = DomainEventFactory.create(
      "aibi.brand.created",
      saved.id,
      command.organizationId,
      {
        brandId: saved.id,
        name: saved.name,
        website: saved.website,
        industry: saved.industry,
        country: saved.country,
        createdBy: command.actorId
      },
      command.actorId
    );
    await eventBus.publish(brandCreatedEvent);

    return DTOHandlers.brandToDTO(saved);
  }

  /**
   * Handle: DiscoverEntityCommand
   */
  public async handleDiscoverEntity(command: DiscoverEntityCommand): Promise<EntityDTO> {
    const entity = await this.entityService.createEntity(
      command.organizationId,
      command.brandId,
      command.name,
      command.type,
      command.wikidataId,
      command.wikipediaUrl,
      command.confidenceScore,
      command.actorId
    );

    // Event Dispatching (EDA)
    const entityDiscoveredEvent = DomainEventFactory.create(
      "aibi.entity.discovered",
      entity.id,
      command.organizationId,
      {
        entityId: entity.id,
        brandId: entity.brandId,
        name: entity.name,
        type: entity.type,
        wikidataId: entity.wikidataId,
        confidenceScore: entity.confidence.score
      },
      command.actorId
    );
    await eventBus.publish(entityDiscoveredEvent);

    return DTOHandlers.entityToDTO(entity);
  }

  /**
   * Handle: CaptureAIObservationCommand
   */
  public async handleCaptureAIObservation(command: CaptureAIObservationCommand): Promise<AIObservationDTO> {
    const aggregate = await this.observationService.processObservation(
      command.organizationId,
      command.promptId,
      command.engineId,
      command.responseText,
      command.rawVisibilityScore,
      command.sentimentScore,
      command.confidenceScore,
      command.actorId
    );

    // Event Dispatching (EDA)
    const event = DomainEventFactory.create(
      "aibi.observation.captured",
      aggregate.observation.id,
      command.organizationId,
      {
        observationId: aggregate.observation.id,
        promptId: aggregate.observation.promptId,
        engineId: aggregate.observation.engineId,
        visibilityScore: aggregate.observation.visibilityScore,
        sentimentLabel: aggregate.observation.sentiment.label,
        sentimentScore: aggregate.observation.sentiment.score,
        mentionsCount: aggregate.getMentionsCount(),
        citationsCount: aggregate.getCitationsCount()
      },
      command.actorId
    );
    await eventBus.publish(event);

    return DTOHandlers.observationToDTO(aggregate.observation);
  }

  /**
   * Handle: CalculateVisibilityScoreCommand
   */
  public async handleCalculateVisibilityScore(command: CalculateVisibilityScoreCommand): Promise<VisibilityScoreDTO> {
    const score: VisibilityScore = {
      id: `vis-${Math.random().toString(36).substr(2, 9)}`,
      organizationId: command.organizationId,
      brandId: command.brandId,
      engineId: command.engineId,
      overallScore: command.overallScore,
      mentionScore: command.mentionScore,
      citationScore: command.citationScore,
      authorityScore: command.authorityScore,
      sentimentScore: command.sentimentScore,
      positionScore: command.positionScore,
      date: new Date(),
      audit: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: command.actorId,
        updatedBy: command.actorId,
        version: 1
      }
    };

    const saved = await this.visRepo.save(score);

    // Event Dispatching
    const event = DomainEventFactory.create(
      "aibi.visibility.score.calculated",
      saved.id,
      command.organizationId,
      {
        scoreId: saved.id,
        brandId: saved.brandId,
        engineId: saved.engineId,
        overallScore: saved.overallScore,
        mentionScore: saved.mentionScore,
        citationScore: saved.citationScore,
        sentimentScore: saved.sentimentScore
      },
      command.actorId
    );
    await eventBus.publish(event);

    return DTOHandlers.visibilityScoreToDTO(saved);
  }

  /**
   * Handle: GenerateRecommendationCommand
   */
  public async handleGenerateRecommendation(command: GenerateRecommendationCommand): Promise<RecommendationDTO> {
    const rec: Recommendation = {
      id: `rec-${Math.random().toString(36).substr(2, 9)}`,
      organizationId: command.organizationId,
      brandId: command.brandId,
      category: command.category,
      priority: command.priority,
      impactScore: command.impactScore,
      description: command.description,
      status: "pending",
      audit: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: command.actorId,
        updatedBy: command.actorId,
        version: 1
      }
    };

    const saved = await this.recRepo.save(rec);

    // Event Dispatching
    const event = DomainEventFactory.create(
      "aibi.recommendation.generated",
      saved.id,
      command.organizationId,
      {
        recommendationId: saved.id,
        brandId: saved.brandId,
        category: saved.category,
        priority: saved.priority,
        impactScore: saved.impactScore,
        description: saved.description
      },
      command.actorId
    );
    await eventBus.publish(event);

    return DTOHandlers.recommendationToDTO(saved);
  }

  /**
   * Handle: RegisterPromptCommand
   */
  public async handleRegisterPrompt(command: RegisterPromptCommand): Promise<PromptDTO> {
    const prompt = await this.observationService.registerPrompt(
      command.organizationId,
      command.brandId,
      command.text,
      command.category,
      command.intent,
      command.language,
      command.priority,
      command.actorId
    );

    return DTOHandlers.promptToDTO(prompt);
  }

  /**
   * Handle: LinkSemanticEntitiesCommand
   */
  public async handleLinkSemanticEntities(command: LinkSemanticEntitiesCommand): Promise<EntityRelationshipDTO> {
    const rel = await this.entityService.addRelationship(
      command.organizationId,
      command.sourceEntityId,
      command.targetEntityId,
      command.relationshipType,
      command.confidenceScore,
      command.actorId
    );

    return DTOHandlers.relationshipToDTO(rel);
  }
}

export class ApplicationQueryHandler {
  private brandRepo: IBrandRepository;
  private entityRepo: IEntityRepository;
  private obsRepo: IObservationRepository;
  private visRepo: IVisibilityScoreRepository;

  private entityService: EntityService;
  private citationService: CitationService;
  private visibilityService: VisibilityService;

  constructor(
    brandRepo?: IBrandRepository,
    entityRepo?: IEntityRepository,
    obsRepo?: IObservationRepository,
    visRepo?: IVisibilityScoreRepository
  ) {
    this.brandRepo = brandRepo || new BrandRepository();
    this.entityRepo = entityRepo || new EntityRepository();
    this.obsRepo = obsRepo || new ObservationRepository();
    this.visRepo = visRepo || new VisibilityScoreRepository();

    this.entityService = new EntityService(this.entityRepo);
    this.citationService = new CitationService(this.obsRepo);
    this.visibilityService = new VisibilityService(this.visRepo);
  }

  /**
   * Handle: GetBrandIntelligenceQuery
   */
  public async handleGetBrandIntelligence(query: GetBrandIntelligenceQuery) {
    const brand = await this.brandRepo.findById(query.organizationId, query.brandId);
    if (!brand) {
      throw new Error(`Brand ${query.brandId} not found in your organization`);
    }

    const payload = await this.visibilityService.prepareDashboardData(query.organizationId, query.brandId);

    return {
      brand: DTOHandlers.brandToDTO(brand),
      analytics: payload
    };
  }

  /**
   * Handle: GetVisibilityReportQuery
   */
  public async handleGetVisibilityReport(query: GetVisibilityReportQuery): Promise<VisibilityScoreDTO[]> {
    const scores = await this.visibilityService.calculateVisibilityMetrics(query.organizationId, query.brandId);
    return scores.map(s => DTOHandlers.visibilityScoreToDTO(s));
  }

  /**
   * Handle: GetEntityGraphQuery
   */
  public async handleGetEntityGraph(query: GetEntityGraphQuery) {
    const entities = await this.entityService.getEntitiesByBrand(query.organizationId, query.brandId);
    const relationships = await this.entityService.getRelationships(query.organizationId);

    return {
      nodes: entities.map(e => DTOHandlers.entityToDTO(e)),
      edges: relationships.map(r => DTOHandlers.relationshipToDTO(r))
    };
  }

  /**
   * Handle: GetCitationAnalysisQuery
   */
  public async handleGetCitationAnalysis(query: GetCitationAnalysisQuery): Promise<CitationDTO[]> {
    const citations = await this.citationService.analyzeCitations(query.organizationId, query.observationId);
    return citations.map(c => DTOHandlers.citationToDTO(c));
  }
}
