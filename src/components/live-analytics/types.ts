export interface MetricPoint {
  timestamp: number;
  value: number;
}

export interface MetricSeries {
  id: string;
  name: string;
  nameFa?: string;
  color: string;
  points: MetricPoint[];
  visible: boolean;
  trend: number; // e.g. +2.4 or -1.2 % variance
  currentValue: number;
}

export interface GraphDimensions {
  width: number;
  height: number;
  dpr: number;
}

export interface TooltipState {
  active: boolean;
  x: number;
  y: number;
  label: string;
  values: {
    id: string;
    name: string;
    nameFa?: string;
    value: number;
    color: string;
    trend: number;
  }[];
}

export interface LegendItem {
  id: string;
  name: string;
  nameFa?: string;
  color: string;
  visible: boolean;
  value: number;
}
