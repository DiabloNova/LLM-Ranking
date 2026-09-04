/**
 * Test suite for Graph Extraction Service
 */

import { extractGraphEntities } from "../../../src/services/ai/graph-extraction";

export async function testGraphExtraction() {
  console.log("▶ Running Graph Extraction Service Tests...");

  // Test with 'optimus' text
  const text1 = "سیستم هوشمند اپتیموس ای آی (Optimus AI) از هوش مصنوعی گوگل استفاده می‌کند.";
  const graph1 = await extractGraphEntities(text1);

  if (!graph1.entities || graph1.entities.length === 0) {
    throw new Error("Graph Extraction Test Failed: No entities extracted.");
  }

  const optimusEntity = graph1.entities.find(e => e.name.toLowerCase().includes("optimus"));
  if (!optimusEntity || optimusEntity.type !== "brand") {
    throw new Error(`Graph Extraction Test Failed: Expected 'Optimus AI' brand entity, got: ${JSON.stringify(optimusEntity)}`);
  }

  const geminiEntity = graph1.entities.find(e => e.name.toLowerCase().includes("gemini"));
  if (!geminiEntity || geminiEntity.type !== "product") {
    throw new Error(`Graph Extraction Test Failed: Expected 'Gemini' product entity, got: ${JSON.stringify(geminiEntity)}`);
  }

  if (!graph1.relationships || graph1.relationships.length === 0) {
    throw new Error("Graph Extraction Test Failed: No relationships extracted.");
  }

  const relationship = graph1.relationships[0];
  if (relationship.sourceEntityName !== "Optimus AI" || relationship.targetEntityName !== "Gemini") {
    throw new Error(`Graph Extraction Test Failed: Expected relationship Optimus AI -> Gemini, got: ${JSON.stringify(relationship)}`);
  }

  // Test with 'apple' text
  const text2 = "شرکت اپل گوشی آیفون را معرفی کرد.";
  const graph2 = await extractGraphEntities(text2);
  const appleEntity = graph2.entities.find(e => e.name.toLowerCase() === "apple");
  if (!appleEntity) {
    throw new Error("Graph Extraction Test Failed: Expected 'Apple' entity.");
  }

  console.log("✅ Graph Extraction Service Tests Passed Successfully!");
}

// If run directly
if (require.main === module) {
  testGraphExtraction().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
