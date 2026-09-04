/**
 * Phase 7C.1 — AI Visibility Intelligence Engine
 * Knowledge Graph Contract Specifications
 * Prepares the platform for future Neo4j or graph database integration.
 */

export interface GraphNode {
  id: string; // Unique entity identifier
  label: string; // Node name (e.g. "Acme SaaS")
  type: string; // Node type classification (e.g. "Brand", "Competitor", "Product")
  properties: Record<string, unknown>; // Rich metadata like wikidataId
}

export interface GraphEdge {
  id: string; // Unique link identifier
  sourceId: string; // Origin node ID
  targetId: string; // Destination node ID
  type: string; // Semantic predicate link relation (e.g. "competes_with")
  properties: Record<string, unknown>; // Confidence scores, audit metadata
}

export interface EntityGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface IRelationshipResolver {
  /**
   * Resolves direct semantic connections mapping between two entity concept IDs
   */
  resolvePath(organizationId: string, sourceId: string, targetId: string): Promise<GraphEdge[]>;
}

export interface IGraphQueryInterface {
  /**
   * Retrieves a tenant's sub-graph centering around a specific focal brand
   */
  getTenantSubGraph(organizationId: string, focalBrandId: string): Promise<EntityGraph>;

  /**
   * Performs graph traversal searches mapping competitive nodes within N-degrees
   */
  findCompetitivePaths(
    organizationId: string,
    brandId: string,
    degreesOfSeparation?: number
  ): Promise<EntityGraph>;
}
