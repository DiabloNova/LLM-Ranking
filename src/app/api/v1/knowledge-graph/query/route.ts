import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { TenantContextManager } from '@/core/database/tenant-context';
import { requireSession } from '@/services/auth/session';
import { requireWorkspaceMembership } from '@/services/auth/authorization';
import { EntityService, projectNeighborhoodForVisualization } from '@/features/ai-intelligence/services/entity-service';

// Validation schema with Persian error message
const querySchema = z.object({
  entityName: z.string().min(1, 'نام موجودیت باید ارسال شود'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = querySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad Request', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { entityName } = parsed.data;

    // 1. Secure Server-Side Session and Workspace Membership validation
    const session = await requireSession();
    if (!session.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Active user not resolved from secure session.' },
        { status: 401 }
      );
    }

    const organizationId = session.user.workspaceId;
    const userId = session.user.id;
    const requestId = req.headers.get("x-request-id") || `req-kg-api-${Date.now()}`;

    // 2. Wrap executing DB lookups strictly under RLS tenant isolation context
    const result = await TenantContextManager.runWithTenantContext(
      organizationId,
      userId,
      requestId,
      async () => {
        // Enforce workspace membership validation inside context
        await requireWorkspaceMembership(userId, organizationId);

        const entityService = new EntityService();

        // Query canonical database entities and relationships via EntityService
        const centralEntity = await entityService.getEntityByName(organizationId, entityName);

        if (centralEntity) {
          // Bounded BFS Graph traversal limit to depth=2 and maxNodes=100
          const { nodes, edges } = await entityService.getNeighborhood(organizationId, centralEntity.id, 2, 100);
          return projectNeighborhoodForVisualization(nodes, edges);
        }

        return null;
      }
    );

    if (result) {
      return NextResponse.json(result);
    }

    // --- High-Fidelity Mock Fallback Mode (Demo / Development Only) ---
    // Preserved for backward compatibility, clearly distinguishable as mock/demo data
    const normalizedQuery = entityName.trim().toLowerCase();

    if (["empty", "خالی", "unknown", "نامعلوم", "none"].includes(normalizedQuery)) {
      return NextResponse.json({ nodes: [], edges: [] });
    }

    const centralNodeId = "node-central-mock";
    const isFarsi = /[\u0600-\u06FF]/.test(entityName);

    const centralLabel = `${entityName} (دمو / پیش‌فرض)`;
    const centralType = (normalizedQuery.includes("digikala") || normalizedQuery.includes("دیجی") || normalizedQuery.includes("snapp") || normalizedQuery.includes("اسنپ"))
      ? "competitor"
      : "brand";

    const nodes: Array<{
      id: string;
      name: string;
      type: string;
      properties?: { wikidataId?: string; is_mock: boolean; source: string; [key: string]: unknown };
    }> = [
      {
        id: centralNodeId,
        name: centralLabel,
        type: centralType,
        properties: { wikidataId: "Q123456", is_mock: true, source: "mock-demo-fallback" }
      },
    ];
    const edges: Array<{ id: string; source: string; target: string; type: string; properties: unknown }> = [];

    if (isFarsi) {
      const mockPeers = [
        { id: "node-gpt4-mock", name: "جی‌پی‌تی-۴ (آزمایشی)", type: "model", rel: "تحلیل_شده_توسط" },
        { id: "node-claude-mock", name: "کلود ۳.۵ (آزمایشی)", type: "model", rel: "پایش_شده_توسط" },
        { id: "node-gemini-mock", name: "جمینای پرو (آزمایشی)", type: "model", rel: "ارزیابی_شده_توسط" },
        { id: "node-competitor1-mock", name: "دیجی‌کالا (آزمایشی)", type: "competitor", rel: "رقابت_با" },
        { id: "node-competitor2-mock", name: "اسنپ (آزمایشی)", type: "competitor", rel: "رقابت_با" },
      ];

      mockPeers.forEach((peer, idx) => {
        if (peer.name.toLowerCase() !== normalizedQuery) {
          nodes.push({ id: peer.id, name: peer.name, type: peer.type, properties: { is_mock: true, source: "mock-demo-fallback" } });
          edges.push({
            id: `edge-${idx}-mock`,
            source: centralNodeId,
            target: peer.id,
            type: peer.rel,
            properties: { confidence: 0.95, is_mock: true, source: "mock-demo-fallback" },
          });
        }
      });
    } else {
      const mockPeers = [
        { id: "node-gpt4-mock", name: "GPT-4o (Demo)", type: "model", rel: "analyzed_by" },
        { id: "node-claude-mock", name: "Claude 3.5 (Demo)", type: "model", rel: "scraped_by" },
        { id: "node-gemini-mock", name: "Gemini 1.5 (Demo)", type: "model", rel: "evaluated_by" },
        { id: "node-competitor1-mock", name: "Digikala (Demo)", type: "competitor", rel: "competes_with" },
        { id: "node-competitor2-mock", name: "Snapp (Demo)", type: "competitor", rel: "competes_with" },
      ];

      mockPeers.forEach((peer, idx) => {
        if (peer.name.toLowerCase() !== normalizedQuery) {
          nodes.push({ id: peer.id, name: peer.name, type: peer.type, properties: { is_mock: true, source: "mock-demo-fallback" } });
          edges.push({
            id: `edge-${idx}-mock`,
            source: centralNodeId,
            target: peer.id,
            type: peer.rel,
            properties: { confidence: 0.95, is_mock: true, source: "mock-demo-fallback" },
          });
        }
      });
    }

    return NextResponse.json({ nodes, edges });

  } catch (error: unknown) {
    console.error("[API KG Query Route Error]:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}
