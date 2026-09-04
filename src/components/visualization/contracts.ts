/**
 * Core Data Contracts and Type Adapters for the Seorchable Interactive Visualization System.
 * Separates data definition/domain modeling from raw presentation and rendering details.
 */

// -------------------------------------------------------------------------
// 1. General Visualization Registries & Core Contract
// -------------------------------------------------------------------------

export type VisualizationType =
  | "chart"
  | "graph"
  | "table"
  | "radar"
  | "timeline"
  | "heatmap"
  | "scorecard"
  | "knowledge-graph"
  | "simulator";

export interface BaseVisualizationConfig {
  id: string;
  titleEn: string;
  titleFa: string;
  descriptionEn?: string;
  descriptionFa?: string;
  type: VisualizationType;
}

// -------------------------------------------------------------------------
// 2. Chart Component Interfaces (Line, Bar, Area, Scatter, Donut/Pie)
// -------------------------------------------------------------------------

export interface ChartDataPoint {
  label: string; // e.g., Date or Category name
  [seriesKey: string]: number | string; // Numeric value per series
}

export interface ChartSeries {
  key: string;
  nameEn: string;
  nameFa: string;
  color?: string; // Optional custom stroke/fill hex or CSS variable
}

export interface ChartDataset {
  series: ChartSeries[];
  data: ChartDataPoint[];
  xAxisKey: string;
  yAxisLabelEn?: string;
  yAxisLabelFa?: string;
  valueSuffix?: string;
}

// -------------------------------------------------------------------------
// 3. Network & Knowledge Graph Interfaces
// -------------------------------------------------------------------------

export type NodeCategory =
  | "brand"
  | "organization"
  | "person"
  | "product"
  | "topic"
  | "location"
  | "website"
  | "publication"
  | "ai_system"
  | "entity";

export interface GraphNode {
  id: string;
  labelEn: string;
  labelFa: string;
  category: NodeCategory;
  importance: number; // 0.1 to 1.0 used to scale node visual sizes
  detailsEn?: string;
  detailsFa?: string;
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  labelEn?: string;
  labelFa?: string;
  strength?: number; // Visual weight of line connector (e.g. 1 to 5)
}

export interface NetworkGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// -------------------------------------------------------------------------
// 4. Radar Visualization Interfaces
// -------------------------------------------------------------------------

export interface RadarDimension {
  key: string;
  labelEn: string;
  labelFa: string;
}

export interface RadarDataPoint {
  dimensionKey: string;
  [seriesKey: string]: number | string; // Numeric score (e.g., 0 to 100)
}

export interface RadarDataset {
  dimensions: RadarDimension[];
  series: ChartSeries[];
  data: RadarDataPoint[];
}

// -------------------------------------------------------------------------
// 5. Timeline Visualization Interfaces
// -------------------------------------------------------------------------

export type TimelineEventStatus = "success" | "warning" | "error" | "info" | "neutral";

export interface TimelineEvent {
  id: string;
  timestamp: string; // e.g., Date string "2026-08-01"
  titleEn: string;
  titleFa: string;
  descriptionEn: string;
  descriptionFa: string;
  categoryEn: string;
  categoryFa: string;
  status: TimelineEventStatus;
  metadata?: Record<string, string | number | boolean>;
}

export interface TimelineDataset {
  events: TimelineEvent[];
}

// -------------------------------------------------------------------------
// 6. Heatmap Visualization Interfaces
// -------------------------------------------------------------------------

export interface HeatmapCell {
  xLabel: string;
  yLabel: string;
  value: number; // Quantitative metric value (e.g. 0.0 to 1.0 or count)
  displayValue?: string; // Optional custom label format
}

export interface HeatmapDataset {
  xLabelsEn: string[];
  xLabelsFa: string[];
  yLabelsEn: string[];
  yLabelsFa: string[];
  cells: HeatmapCell[];
  minVal: number;
  maxVal: number;
  colorGradients: string[]; // Gradient steps for visual rendering interpolation
}

// -------------------------------------------------------------------------
// 7. Scorecard Visualization Interfaces
// -------------------------------------------------------------------------

export type ScorecardTrend = "up" | "down" | "neutral" | "none";
export type ScorecardStatus = "positive" | "negative" | "warning" | "neutral";

export interface ScorecardMetric {
  id: string;
  labelEn: string;
  labelFa: string;
  value: string | number;
  unitEn?: string;
  unitFa?: string;
  delta?: string | number; // e.g., +12%
  trend: ScorecardTrend;
  status: ScorecardStatus;
  comparisonLabelEn?: string;
  comparisonLabelFa?: string;
  sparklineData?: number[]; // Mini trend chart points
}

// -------------------------------------------------------------------------
// 8. Scenario Simulator Interfaces
// -------------------------------------------------------------------------

export interface SimulatorInputParameter {
  key: string;
  labelEn: string;
  labelFa: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
}

export interface SimulatorOutputMetrics {
  visibilityScore: number; // 0 to 100 calculated deterministically
  brandAuthority: number; // 0 to 100
  citationIndex: number; // 0 to 100
  recommendations: {
    titleEn: string;
    titleFa: string;
    impact: "high" | "medium" | "low";
  }[];
}

// Pure mathematical simulator contract to calculate output deterministically based on input weights
export type SimulationModelFunction = (inputs: Record<string, number>) => SimulatorOutputMetrics;

export interface SimulatorConfig {
  id: string;
  titleEn: string;
  titleFa: string;
  inputs: SimulatorInputParameter[];
  calculate: SimulationModelFunction;
}

// -------------------------------------------------------------------------
// 9. Core Visualization Adapters
// -------------------------------------------------------------------------

/**
 * Normalizes raw API response objects to clean, type-safe visualization-ready datasets.
 */
export const VisualizationAdapters = {
  /**
   * Adapts typical audit database arrays into a timeseries chart dataset.
   */
  adaptAuditTrend(audits: { created_at: string; visibility_score: number | null }[]): ChartDataset {
    const sortedAudits = [...audits].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const data: ChartDataPoint[] = sortedAudits.map((audit) => {
      const d = new Date(audit.created_at);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return {
        label: dateStr,
        score: audit.visibility_score ?? 0,
      };
    });

    return {
      xAxisKey: "label",
      series: [
        {
          key: "score",
          nameEn: "Visibility Score",
          nameFa: "شاخص رویت‌پذیری",
          color: "#1F76F9",
        },
      ],
      data,
    };
  },
};
