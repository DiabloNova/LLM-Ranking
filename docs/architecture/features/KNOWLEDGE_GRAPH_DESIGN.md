# Semantic Knowledge Graph Architecture Design

This document details the abstract contracts and models designed to map, claimed, and travers brand concept networks inside external AI platforms.

---

## 1. Graph Model Definitions

- **GraphNode**: Mapped concept representing brands, competitors, key executives, or products. Anchored by a unique name and optional Wikidata `wikidataId`.
- **GraphEdge**: Mapped semantic relationship containing predicates like `owns`, `creates`, `competes_with`, `related_to`, or `mentioned_with`, paired with confidence weights.

---

## 2. Relational vs. Graph Database Strategy

To handle high-volume transactional updates alongside complex graph queries:

1. **Transactional Metadata (Relational PostgreSQL)**:
   - Stored in PostgreSQL `entities` and `entity_relationships` tables for strict foreign key integrity, ACID transactions, and tenant Row-Level Security.
2. **Analytical Traversals (Graph Neo4j / AWS Neptune)**:
   - Syncs entity states to Neo4j.
   - Leverages cypher queries through the abstract `IGraphQueryInterface` to find competitive paths, map citation circles, and compute semantic overlaps.

```typescript
// Future Neo4j Query Implementation Example:
export class Neo4jGraphQuery implements IGraphQueryInterface {
  public async findCompetitivePaths(organizationId: string, brandId: string): Promise<EntityGraph> {
    const result = await this.neo4jSession.run(
      `MATCH (b:Brand {id: $brandId, organizationId: $orgId})-[r:competes_with*1..2]-(c:Brand)
       RETURN b, r, c`,
      { brandId, orgId: organizationId }
    );
    // Parse cypher records into GraphNode & GraphEdge entities
  }
}
```
This dual-database approach ensures absolute transaction reliability alongside rapid Graph queries!
