"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  Node,
  Edge,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { useTheme } from "@/components/ThemeProvider";
import { Search, Info, RefreshCw, Layers } from "lucide-react";

// --- Graph Interfaces ---
interface GraphNode {
  id: string;
  name: string;
  type: string;
  properties?: Record<string, unknown>;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  properties?: Record<string, unknown>;
}

interface GraphQueryResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// --- Custom Glassmorphic Node ---
interface CustomNodeData {
  label: string;
  type: string;
}

const CustomNodeComponent = React.memo(({ data }: { data: CustomNodeData }) => {
  const typeLower = data.type?.toLowerCase() || "";

  // Custom styled borders & glow shadows for different entity types
  const borderColors: Record<string, string> = {
    brand: "border-[#1F76F9] shadow-[#1F76F9]/10 text-white",
    competitor: "border-[#FF6F41] shadow-[#FF6F41]/10 text-white",
    product: "border-emerald-500/60 shadow-emerald-500/10 text-white",
    model: "border-purple-500/60 shadow-purple-500/10 text-white",
    concept: "border-cyan-500/60 shadow-cyan-500/10 text-white",
  };

  const borderColorClass = borderColors[typeLower] || "border-white/20 shadow-white/5";

  return (
    <div
      className={`px-4 py-2.5 rounded-xl border bg-black/40 backdrop-blur-xl text-xs font-semibold shadow-lg transition-all duration-300 hover:scale-105 min-w-[140px] text-center ${borderColorClass}`}
    >
      {/* Target handle at the top */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[#1F76F9] !w-2 !h-2 !border-none"
      />

      <div className="font-semibold truncate tracking-tight">{data.label}</div>
      <div className="text-[9px] uppercase tracking-widest text-white/50 mt-1 font-mono">
        {data.type}
      </div>

      {/* Source handle at the bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[#FF6F41] !w-2 !h-2 !border-none"
      />
    </div>
  );
});

CustomNodeComponent.displayName = "CustomNodeComponent";

// Register custom node type
const nodeTypes = {
  custom: CustomNodeComponent,
};

/**
 * Premium Knowledge Graph Explorer Component utilizing ReactFlow for real-time visualization of entity relationships.
 */
export const KnowledgeGraphExplorer: React.FC = () => {
  const { language } = useTheme();
  const isRtl = language === "fa";

  const [searchTerm, setSearchTerm] = useState("اپتیموس");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ReactFlow state management
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Default initial viewport zoom & offset
  const defaultViewport = { x: 0, y: 0, zoom: 1 };

  const fetchGraphData = useCallback(async (queryEntity: string) => {
    if (!queryEntity.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Execute the 1-hop subgraph POST route
      const response = await fetch("/api/v1/knowledge-graph/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Pass simulated headers for isolation checks
          "x-tenant-id": "demo-tenant-id",
          "x-user-id": "demo-user-id",
        },
        body: JSON.stringify({ entityName: queryEntity }),
      });

      if (!response.ok) {
        throw new Error(isRtl ? "خطا در برقراری ارتباط با پایگاه داده" : "Failed to fetch subgraph");
      }

      const resData: GraphQueryResponse = await response.json();

      if (!resData.nodes || resData.nodes.length === 0) {
        // Empty state trigger
        setNodes([]);
        setEdges([]);
        return;
      }

      // --- Map to ReactFlow Nodes & Edges via Circular Circle Layout ---
      const fetchedNodes: Node[] = [];
      const fetchedEdges: Edge[] = [];

      // 1. Central entity node (usually the first node)
      const centerNode = resData.nodes[0];
      const centerNodeId = centerNode.id;
      const centerX = 300;
      const centerY = 220;

      fetchedNodes.push({
        id: centerNodeId,
        type: "custom",
        position: { x: centerX, y: centerY },
        data: { label: centerNode.name, type: centerNode.type },
      });

      // 2. Neighbor nodes
      const neighbors = resData.nodes.slice(1);
      const neighborCount = neighbors.length;
      const radius = 180; // Distance from center node

      neighbors.forEach((neighbor, index) => {
        // Compute polar coordinate positions for circular distribution
        const angle = (2 * Math.PI * index) / (neighborCount || 1);
        const neighborX = centerX + radius * Math.cos(angle);
        const neighborY = centerY + radius * Math.sin(angle);

        fetchedNodes.push({
          id: neighbor.id,
          type: "custom",
          position: { x: neighborX, y: neighborY },
          data: { label: neighbor.name, type: neighbor.type },
        });
      });

      // 3. Map Edges
      resData.edges.forEach((edge) => {
        fetchedEdges.push({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.type,
          animated: true,
          style: { stroke: "#3b82f6", strokeWidth: 1.5, strokeOpacity: 0.4 },
          labelStyle: { fill: "#a1a1aa", fontSize: 9, fontWeight: 500 },
          labelBgPadding: [6, 4],
          labelBgBorderRadius: 6,
          labelBgStyle: { fill: "#121214", fillOpacity: 0.9, stroke: "#ffffff/10", strokeWidth: 0.5 },
        });
      });

      setNodes(fetchedNodes);
      setEdges(fetchedEdges);

    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [isRtl, setNodes, setEdges]);

  // Initial load deferred to avoid setting state synchronously during initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGraphData("اپتیموس");
    }, 100);
    return () => clearTimeout(timer);
  }, [fetchGraphData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGraphData(searchTerm);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Layers className="text-[#1F76F9]" size={20} />
            <span>{isRtl ? "کاوشگر گراف دانش" : "Knowledge Graph Explorer"}</span>
          </CardTitle>
          <CardDescription>
            {isRtl
              ? "موجودیت‌های استخراج‌شده و ارتباطات معنایی ۱-هاپ آن‌ها در شبکه روابط برند."
              : "Explore semantic entities and their mapped 1-hop relationships in our visual network."}
          </CardDescription>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                isRtl
                  ? "جستجوی موجودیت (مثال: اپتیموس، هوش مصنوعی، دیجی‌کالا)..."
                  : "Search entity (e.g. Optimus, AI)..."
              }
              className="w-full h-10 px-4 py-2 pr-10 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white focus:outline-none focus:border-[#1F76F9] focus:ring-1 focus:ring-[#1F76F9] transition-all"
              style={{ direction: isRtl ? "rtl" : "ltr" }}
            />
            <div
              className={`absolute top-1/2 -translate-y-1/2 text-white/40 ${
                isRtl ? "left-3" : "right-3"
              }`}
            >
              <Search size={16} />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 h-10 bg-[#1F76F9] hover:bg-[#1F76F9]/90 disabled:opacity-50 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#1F76F9]/20"
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={14} />
            ) : (
              <span>{isRtl ? "کاوش" : "Query"}</span>
            )}
          </button>
        </form>
      </CardHeader>

      <CardContent className="p-0 relative h-[500px] w-full bg-[#0c0d0e]/40 overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 z-10 backdrop-blur-sm">
            <RefreshCw className="animate-spin text-[#1F76F9] mb-3" size={28} />
            <span className="text-sm text-[var(--text-muted)]">
              {isRtl ? "درحال بازیابی شبکه روابط و ترسیم گراف..." : "Retrieving knowledge graph nodes..."}
            </span>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20 text-red-400 mb-3">
              <Info size={24} />
            </div>
            <p className="text-sm text-red-300 font-medium mb-1">{error}</p>
            <p className="text-xs text-[var(--text-muted)]">
              {isRtl ? "لطفاً مجدداً تلاش نمایید." : "Please check your network and search term."}
            </p>
          </div>
        ) : nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="p-3 bg-yellow-500/5 rounded-full border border-yellow-500/10 text-yellow-500/70 mb-3">
              <Info size={24} />
            </div>
            <p className="text-sm text-[var(--text-primary)] font-medium mb-1">
              {isRtl ? "هنوز داده‌ای برای این موجودیت ثبت نشده است" : "No relationships found for this entity"}
            </p>
            <p className="text-xs text-[var(--text-muted)] max-w-sm">
              {isRtl
                ? "ابتدا فایلی در سیستم بارگذاری کنید یا واژه جستجو را به گزینه‌ای دیگر تغییر دهید."
                : "Try uploading documents first or query a different entity to explore semantic links."}
            </p>
          </div>
        ) : null}

        {/* ReactFlow Visual Canvas */}
        {nodes.length > 0 && (
          <div className="w-full h-full" style={{ direction: "ltr" }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.5}
              maxZoom={2}
              defaultViewport={defaultViewport}
            >
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#3f3f46" />
              {/* Force Controls to Left side if in RTL view mode */}
              <Controls position={isRtl ? "bottom-left" : "bottom-right"} className="!bg-black/80 !border-white/10" />
              <MiniMap
                nodeColor={(node) => {
                  const type = (node.data?.type as string || "").toLowerCase();
                  if (type === "brand") return "#1F76F9";
                  if (type === "competitor") return "#FF6F41";
                  if (type === "product") return "#10b981";
                  return "#3f3f46";
                }}
                maskColor="rgba(0, 0, 0, 0.6)"
                style={{
                  background: "rgba(10, 10, 10, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  borderRadius: "8px",
                }}
                position={isRtl ? "top-left" : "top-right"}
              />
            </ReactFlow>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
