import { MetricSeries } from "./types";

export interface Point2D {
  x: number;
  y: number;
}

export class GraphEngine {
  private lastTime = 0;

  /**
   * Calculate delta-time (dt) based on current high-performance timestamp
   */
  public calculateDeltaTime(timestamp: number): number {
    if (this.lastTime === 0) {
      this.lastTime = timestamp;
      return 0;
    }
    const dt = (timestamp - this.lastTime) / 1000; // seconds
    this.lastTime = timestamp;

    // Smooth/cap dt to prevent massive jumps when tab is inactive
    return Math.min(dt, 0.1);
  }

  /**
   * Reset tracking of time (used when pausing/resuming or window refocus)
   */
  public resetTimeTracker(): void {
    this.lastTime = 0;
  }

  /**
   * Get min and max limits for both time and value dimensions
   */
  public getLimits(visibleSeries: MetricSeries[]) {
    let minTime = Infinity;
    let maxTime = -Infinity;
    let minValue = 0; // baseline at 0
    let maxValue = 100; // default ceiling

    let hasPoints = false;

    visibleSeries.forEach((series) => {
      series.points.forEach((pt) => {
        hasPoints = true;
        if (pt.timestamp < minTime) minTime = pt.timestamp;
        if (pt.timestamp > maxTime) maxTime = pt.timestamp;
        if (pt.value > maxValue) maxValue = pt.value;
        if (pt.value < minValue) minValue = pt.value;
      });
    });

    if (!hasPoints) {
      const now = Date.now();
      minTime = now - 50000;
      maxTime = now;
    }

    // Add 10% padding to maxValue for visual headroom
    maxValue = Math.min(100, maxValue * 1.1);

    return { minTime, maxTime, minValue, maxValue };
  }

  /**
   * Map point to pixel coordinate
   */
  public mapToPixel(
    timestamp: number,
    value: number,
    minTime: number,
    maxTime: number,
    minValue: number,
    maxValue: number,
    width: number,
    height: number,
    padding: { top: number; right: number; bottom: number; left: number }
  ): Point2D {
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const timeRange = maxTime - minTime || 1;
    const valueRange = maxValue - minValue || 1;

    // Linear mapping
    const x = padding.left + ((timestamp - minTime) / timeRange) * chartWidth;
    // Invert Y axis because Canvas coordinates start from top-left (0, 0)
    const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

    return { x, y };
  }

  /**
   * Get control points for spline rendering
   */
  public getSplineControlPoints(points: Point2D[], index: number, tension: number = 0.15): { cp1: Point2D; cp2: Point2D } {
    const p1 = points[index];
    const p2 = points[index + 1];

    // Handle edge cases where index-1 or index+2 don't exist
    const p0 = index > 0 ? points[index - 1] : p1;
    const p3 = index < points.length - 2 ? points[index + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;

    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    return {
      cp1: { x: cp1x, y: cp1y },
      cp2: { x: cp2x, y: cp2y },
    };
  }
}
