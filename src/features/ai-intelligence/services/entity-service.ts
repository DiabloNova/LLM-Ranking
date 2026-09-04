import { Entity, EntityRelationship, RelationshipType } from "../domain/types";
import { IEntityRepository } from "../repositories/interfaces";
import { EntityRepository } from "../repositories";

// --- Visual Projection Type Contracts ---
export interface VisualNode {
  id: string;
  type: string;
  label: string;
  relevantScores: {
    confidence: number;
    authority: number;
    completeness: number;
  };
  metadata: Record<string, unknown>;
}

export interface VisualEdge {
  id: string;
  source: string;
  target: string;
  relationshipType: string;
  direction: string;
  metadata: Record<string, unknown>;
}

export interface VisualProjection {
  nodes: VisualNode[];
  edges: VisualEdge[];
}

/**
 * Deterministic baseline calculation for Entity Authority.
 * Uses only existing, persisted signals in the domain model.
 */
export function calculateEntityAuthority(entity: Entity, relationshipCount = 0): number {
  let score = 0;
  // Baseline confidence contribution (up to 40%)
  score += (entity.confidence?.score ?? 1.0) * 40;

  // External presence contribution (up to 30%)
  if (entity.wikidataId && entity.wikidataId.trim().length > 0) score += 15;
  if (entity.wikipediaUrl && entity.wikipediaUrl.trim().length > 0) score += 15;

  // Relationship density contribution (up to 30%, caps at 10 relationships)
  const relWeight = Math.min(relationshipCount, 10) * 3;
  score += relWeight;

  return Math.min(Math.max(Math.round(score), 0), 100);
}

/**
 * Deterministic baseline calculation for Entity Completeness.
 * Uses only existing, persisted signals in the domain model.
 */
export function calculateEntityCompleteness(entity: Entity): number {
  let score = 40; // baseline for name and type being present
  if (entity.description && entity.description.trim().length > 0) {
    score += 20;
  }
  if (entity.wikidataId && entity.wikidataId.trim().length > 0) {
    score += 15;
  }
  if (entity.wikipediaUrl && entity.wikipediaUrl.trim().length > 0) {
    score += 15;
  }
  if (entity.aliases && entity.aliases.length > 0) {
    score += 10;
  }
  return Math.min(score, 100);
}

/**
 * Projection helper mapping a list of entities and relationships to the visual model projection contract.
 */
export function projectNeighborhoodForVisualization(
  nodes: Entity[],
  edges: EntityRelationship[]
): VisualProjection {
  return {
    nodes: nodes.map(n => ({
      id: n.id,
      type: n.type,
      label: n.name,
      relevantScores: {
        confidence: n.confidence?.score ?? 0.0,
        authority: n.authorityScore ?? 0,
        completeness: n.completenessScore ?? 0
      },
      metadata: {
        wikidataId: n.wikidataId,
        wikipediaUrl: n.wikipediaUrl,
        aliases: n.aliases,
        description: n.description,
        provenance: n.provenance,
        status: n.status,
        createdAt: n.audit?.createdAt,
        updatedAt: n.audit?.updatedAt
      }
    })),
    edges: edges.map(e => ({
      id: `${e.sourceEntityId}-${e.targetEntityId}-${e.relationshipType}`,
      source: e.sourceEntityId,
      target: e.targetEntityId,
      relationshipType: e.relationshipType,
      direction: e.direction || "directed",
      metadata: {
        confidenceScore: e.confidence?.score ?? 0.0,
        confidenceRating: e.confidence?.rating ?? "low",
        provenance: e.provenance,
        metadata: e.metadata,
        createdAt: e.audit?.createdAt,
        updatedAt: e.audit?.updatedAt
      }
    }))
  };
}

export class EntityService {
  private entityRepo: IEntityRepository;

  constructor(entityRepo?: IEntityRepository) {
    this.entityRepo = entityRepo || new EntityRepository();
  }

  /**
   * Look up a semantic entity by its unique ID inside a tenant boundary.
   * Attaches authority and completeness on read.
   */
  public async getEntityById(organizationId: string, id: string): Promise<Entity | null> {
    const ent = await this.entityRepo.findById(organizationId, id);
    if (!ent) return null;

    const allRels = await this.entityRepo.getRelationships(organizationId);
    const relCount = allRels.filter(r => r.sourceEntityId === ent.id || r.targetEntityId === ent.id).length;
    ent.authorityScore = calculateEntityAuthority(ent, relCount);
    ent.completenessScore = calculateEntityCompleteness(ent);
    return ent;
  }

  /**
   * Look up a semantic entity by its name case-insensitively inside a tenant boundary.
   */
  public async getEntityByName(organizationId: string, name: string): Promise<Entity | null> {
    const ent = await this.entityRepo.findByName(organizationId, name);
    if (!ent) return null;

    const allRels = await this.entityRepo.getRelationships(organizationId);
    const relCount = allRels.filter(r => r.sourceEntityId === ent.id || r.targetEntityId === ent.id).length;
    ent.authorityScore = calculateEntityAuthority(ent, relCount);
    ent.completenessScore = calculateEntityCompleteness(ent);
    return ent;
  }

  /**
   * Retrieve all semantic entities associated with a specific brand inside a tenant boundary
   */
  public async getEntitiesByBrand(organizationId: string, brandId: string): Promise<Entity[]> {
    const result = await this.entityRepo.findByBrandId(organizationId, brandId);
    const allRels = await this.entityRepo.getRelationships(organizationId);

    return result.data.map(ent => {
      const relCount = allRels.filter(r => r.sourceEntityId === ent.id || r.targetEntityId === ent.id).length;
      ent.authorityScore = calculateEntityAuthority(ent, relCount);
      ent.completenessScore = calculateEntityCompleteness(ent);
      return ent;
    });
  }

  /**
   * Register a new semantic brand entity inside a tenant boundary.
   * Full backward compatibility with added optional support for extended properties.
   */
  public async createEntity(
    organizationId: string,
    brandId: string,
    name: string,
    type: string,
    wikidataId?: string,
    wikipediaUrl?: string,
    confidenceScore = 1.0,
    actorId = "system",
    aliases?: string[],
    description?: string,
    provenance?: Record<string, unknown>,
    authorityScore?: number,
    completenessScore?: number,
    status?: string
  ): Promise<Entity> {
    const scoreVal = Math.min(Math.max(confidenceScore, 0), 1);
    const entity: Entity = {
      id: `entity-${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      brandId,
      name,
      type,
      wikidataId,
      wikipediaUrl,
      confidence: {
        score: scoreVal,
        rating: scoreVal >= 0.8 ? "high" : scoreVal >= 0.5 ? "medium" : "low"
      },
      aliases,
      description,
      provenance,
      authorityScore,
      completenessScore,
      status: status || "active",
      audit: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
        version: 1
      }
    };

    // Calculate dynamic properties if not explicitly provided
    if (entity.authorityScore === undefined) {
      entity.authorityScore = calculateEntityAuthority(entity, 0);
    }
    if (entity.completenessScore === undefined) {
      entity.completenessScore = calculateEntityCompleteness(entity);
    }

    return this.entityRepo.save(entity);
  }

  /**
   * Establish a semantic relation mapping between two concepts/brands inside a tenant boundary.
   * Full backward compatibility with added optional support for extended properties.
   */
  public async addRelationship(
    organizationId: string,
    sourceEntityId: string,
    targetEntityId: string,
    relationshipType: RelationshipType,
    confidenceScore = 1.0,
    actorId = "system",
    direction?: string,
    provenance?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<EntityRelationship> {
    // Validate existence of source and target entities inside tenant boundaries
    const source = await this.entityRepo.findById(organizationId, sourceEntityId);
    const target = await this.entityRepo.findById(organizationId, targetEntityId);

    if (!source || !target) {
      throw new Error("Invalid relationship mapping: Source or Target entity does not exist in your organization");
    }

    const scoreVal = Math.min(Math.max(confidenceScore, 0), 1);
    const relationship: EntityRelationship = {
      organizationId,
      sourceEntityId,
      targetEntityId,
      relationshipType,
      confidence: {
        score: scoreVal,
        rating: scoreVal >= 0.8 ? "high" : scoreVal >= 0.5 ? "medium" : "low"
      },
      direction: direction || "directed",
      provenance,
      metadata,
      audit: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
        version: 1
      }
    };

    return this.entityRepo.saveRelationship(relationship);
  }

  /**
   * List all semantic entity relationships within a tenant boundary
   */
  public async getRelationships(organizationId: string): Promise<EntityRelationship[]> {
    return this.entityRepo.getRelationships(organizationId);
  }

  /**
   * Adjust semantic linking confidence rating inside a tenant boundary
   */
  public async updateConfidenceScore(
    organizationId: string,
    entityId: string,
    newScore: number,
    actorId = "system"
  ): Promise<Entity> {
    const entity = await this.entityRepo.findById(organizationId, entityId);
    if (!entity) {
      throw new Error(`Entity with ID ${entityId} not found in your organization`);
    }

    const scoreVal = Math.min(Math.max(newScore, 0), 1);
    const updated: Entity = {
      ...entity,
      confidence: {
        score: scoreVal,
        rating: scoreVal >= 0.8 ? "high" : scoreVal >= 0.5 ? "medium" : "low"
      },
      audit: {
        ...entity.audit,
        updatedAt: new Date().toISOString(),
        updatedBy: actorId,
        version: entity.audit.version + 1
      }
    };

    // Update dynamic scores on write
    const allRels = await this.entityRepo.getRelationships(organizationId);
    const relCount = allRels.filter(r => r.sourceEntityId === updated.id || r.targetEntityId === updated.id).length;
    updated.authorityScore = calculateEntityAuthority(updated, relCount);
    updated.completenessScore = calculateEntityCompleteness(updated);

    return this.entityRepo.save(updated);
  }

  /**
   * Bounded graph neighborhood traversal for an entity inside tenant isolation boundary (BFS).
   * Fully bounded depth (1-5) and maxNodes (1-500).
   */
  public async getNeighborhood(
    organizationId: string,
    entityId: string,
    depth = 2,
    maxNodes = 100
  ): Promise<{ nodes: Entity[]; edges: EntityRelationship[] }> {
    const depthBounded = Math.min(Math.max(depth, 1), 5);
    const maxNodesBounded = Math.min(Math.max(maxNodes, 1), 500);

    const startEntity = await this.entityRepo.findById(organizationId, entityId);
    if (!startEntity) {
      return { nodes: [], edges: [] };
    }

    const allRels = await this.entityRepo.getRelationships(organizationId);

    // Build Adjacency Matrix
    const adj = new Map<string, Array<{ rel: EntityRelationship; targetId: string }>>();
    for (const r of allRels) {
      if (!adj.has(r.sourceEntityId)) adj.set(r.sourceEntityId, []);
      if (!adj.has(r.targetEntityId)) adj.set(r.targetEntityId, []);

      adj.get(r.sourceEntityId)!.push({ rel: r, targetId: r.targetEntityId });
      adj.get(r.targetEntityId)!.push({ rel: r, targetId: r.sourceEntityId });
    }

    const visitedNodes = new Set<string>();
    const traversedEdges = new Set<string>();
    const queue: Array<{ id: string; currentDepth: number }> = [];

    queue.push({ id: entityId, currentDepth: 0 });
    visitedNodes.add(entityId);

    const resultEdges: EntityRelationship[] = [];

    while (queue.length > 0 && visitedNodes.size < maxNodesBounded) {
      const { id, currentDepth } = queue.shift()!;

      if (currentDepth >= depthBounded) {
        continue;
      }

      const neighbors = adj.get(id) || [];
      for (const edgeInfo of neighbors) {
        if (visitedNodes.size >= maxNodesBounded) break;

        const { rel, targetId } = edgeInfo;
        const edgeKey = `${rel.sourceEntityId}-${rel.targetEntityId}-${rel.relationshipType}`;

        if (!traversedEdges.has(edgeKey)) {
          traversedEdges.add(edgeKey);
          resultEdges.push(rel);
        }

        if (!visitedNodes.has(targetId)) {
          visitedNodes.add(targetId);
          queue.push({ id: targetId, currentDepth: currentDepth + 1 });
        }
      }
    }

    // Load actual Entity objects for visited IDs and calculate dynamic scores
    const resultNodes: Entity[] = [];
    for (const nodeId of visitedNodes) {
      const ent = await this.entityRepo.findById(organizationId, nodeId);
      if (ent) {
        const relCount = allRels.filter(r => r.sourceEntityId === ent.id || r.targetEntityId === ent.id).length;
        ent.authorityScore = calculateEntityAuthority(ent, relCount);
        ent.completenessScore = calculateEntityCompleteness(ent);
        resultNodes.push(ent);
      }
    }

    return { nodes: resultNodes, edges: resultEdges };
  }
}
