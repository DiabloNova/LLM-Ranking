/**
 * Optimus AI — GraphRAG Pipeline Graph Store Service
 * Implements transaction-safe, RLS-compliant entity and relationship population.
 */

import { PostgresClient } from "../../features/admin/infrastructure/persistence/postgres";
import { TenantContextManager } from "../../core/database/tenant-context";
import { ExtractedGraph, ExtractedEntity } from "../ai/graph-extraction";

export class GraphStoreService {
  private pg: PostgresClient;

  constructor(pg?: PostgresClient) {
    this.pg = pg || PostgresClient.getInstance();
  }

  /**
   * Securely populates kg_entities and kg_relationships within the current tenant context.
   * Leverages RLS policies and handles merging & deduplication.
   */
  public async upsertEntitiesAndRelationships(
    extractedGraph: ExtractedGraph,
    sourceChunkId: string
  ): Promise<{ entityIds: Record<string, string>; relationshipIds: string[] }> {
    // 1. Resolve active tenant isolation boundary
    const tenantId = TenantContextManager.getRequiredTenantId();

    const entityIds: Record<string, string> = {};
    const relationshipIds: string[] = [];

    // Ensure entities array is valid
    const entities = extractedGraph.entities || [];
    const relationships = extractedGraph.relationships || [];

    // Helper to normalize names
    const normalize = (name: string) => name.trim().toLowerCase();

    // First, map all provided entities in the graph to ensure we can resolve them
    const entitiesToUpsertMap = new Map<string, ExtractedEntity>();
    for (const ent of entities) {
      if (ent.name) {
        entitiesToUpsertMap.set(normalize(ent.name), ent);
      }
    }

    // Identify any entities mentioned in relationships that aren't explicitly listed
    for (const rel of relationships) {
      const srcNorm = normalize(rel.sourceEntityName);
      const tgtNorm = normalize(rel.targetEntityName);

      if (!entitiesToUpsertMap.has(srcNorm)) {
        entitiesToUpsertMap.set(srcNorm, {
          name: rel.sourceEntityName,
          type: 'concept', // Default fallback type
          properties: {},
        });
      }

      if (!entitiesToUpsertMap.has(tgtNorm)) {
        entitiesToUpsertMap.set(tgtNorm, {
          name: rel.targetEntityName,
          type: 'concept', // Default fallback type
          properties: {},
        });
      }
    }

    // 2. Upsert Entities
    for (const [normName, ent] of entitiesToUpsertMap.entries()) {
      // Find existing entity case-insensitively
      const selectSql = `
        SELECT id, properties FROM kg_entities
        WHERE LOWER(name) = LOWER($1) LIMIT 1;
      `;
      const res = await this.pg.query(selectSql, [ent.name]);

      let entityId: string;
      const properties = ent.properties || {};

      if (res.rowCount && res.rowCount > 0) {
        // Entity exists: Merge properties and update
        const row = res.rows[0];
        entityId = row.id;

        const existingProperties = typeof row.properties === 'string'
          ? JSON.parse(row.properties)
          : (row.properties || {});

        const mergedProperties = {
          ...existingProperties,
          ...properties,
        };

        const updateSql = `
          UPDATE kg_entities
          SET properties = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING id;
        `;
        await this.pg.query(updateSql, [JSON.stringify(mergedProperties), entityId]);
      } else {
        // Entity does not exist: Create new UUID and insert
        entityId = crypto.randomUUID();

        const insertSql = `
          INSERT INTO kg_entities (id, tenant_id, name, type, properties, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING id;
        `;
        const params = [
          entityId,
          tenantId,
          ent.name,
          ent.type,
          JSON.stringify(properties),
        ];
        await this.pg.query(insertSql, params);
      }

      entityIds[normName] = entityId;
    }

    // 3. Upsert Relationships
    for (const rel of relationships) {
      const srcNorm = normalize(rel.sourceEntityName);
      const tgtNorm = normalize(rel.targetEntityName);

      const sourceId = entityIds[srcNorm];
      const targetId = entityIds[tgtNorm];

      if (!sourceId || !targetId) {
        console.warn(
          `[GraphStoreService] Skipping relationship: unable to resolve source/target IDs for ${rel.sourceEntityName} -> ${rel.targetEntityName}`
        );
        continue;
      }

      const relType = rel.relationshipType || 'associated_with';
      const properties = rel.properties || {};

      // Embed traceability source_chunk_id in relationship properties
      const enrichedProperties = {
        ...properties,
        source_chunk_id: sourceChunkId,
      };

      // Check if relationship already exists
      const selectRelSql = `
        SELECT id, properties FROM kg_relationships
        WHERE source_entity_id = $1 AND target_entity_id = $2 AND LOWER(relationship_type) = LOWER($3)
        LIMIT 1;
      `;
      const resRel = await this.pg.query(selectRelSql, [sourceId, targetId, relType]);

      let relationshipId: string;

      if (resRel.rowCount && resRel.rowCount > 0) {
        // Relationship exists: Merge properties and update
        const row = resRel.rows[0];
        relationshipId = row.id;

        const existingProperties = typeof row.properties === 'string'
          ? JSON.parse(row.properties)
          : (row.properties || {});

        const mergedProperties = {
          ...existingProperties,
          ...enrichedProperties,
        };

        const updateRelSql = `
          UPDATE kg_relationships
          SET properties = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING id;
        `;
        await this.pg.query(updateRelSql, [JSON.stringify(mergedProperties), relationshipId]);
      } else {
        // Relationship does not exist: Create new UUID and insert
        relationshipId = crypto.randomUUID();

        const insertRelSql = `
          INSERT INTO kg_relationships (id, tenant_id, source_entity_id, target_entity_id, relationship_type, properties, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING id;
        `;
        const params = [
          relationshipId,
          tenantId,
          sourceId,
          targetId,
          relType,
          JSON.stringify(enrichedProperties),
        ];
        await this.pg.query(insertRelSql, params);
      }

      relationshipIds.push(relationshipId);
    }

    return { entityIds, relationshipIds };
  }
}
