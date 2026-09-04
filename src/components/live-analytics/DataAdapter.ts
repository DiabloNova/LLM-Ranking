import { MetricSeries } from "./types";
import { noise1D } from "./animation";

export interface IDataAdapter {
  getSeries(): MetricSeries[];
  subscribe(callback: (series: MetricSeries[]) => void): () => void;
  unsubscribe(callback: (series: MetricSeries[]) => void): void;
  updateData(timestamp: number): void;
  destroy?(): void;
}

export class LiveDataAdapter implements IDataAdapter {
  private seriesList: MetricSeries[] = [];
  private callbacks: ((series: MetricSeries[]) => void)[] = [];
  private maxPoints = 50;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize 5 distinct metric series with approved enterprise palette and vertical separation
    this.seriesList = [
      {
        id: "visibility",
        name: "Brand Visibility",
        nameFa: "حضور برند",
        color: "#3B82F6", // Electric Blue
        points: [],
        visible: true,
        trend: 0,
        currentValue: 0,
      },
      {
        id: "authority",
        name: "Brand Authority",
        nameFa: "مرجعیت برند",
        color: "#06B6D4", // Cyan
        points: [],
        visible: true,
        trend: 0,
        currentValue: 0,
      },
      {
        id: "sentiment",
        name: "Sentiment Index",
        nameFa: "شاخص احساسات",
        color: "#8B5CF6", // Purple
        points: [],
        visible: true,
        trend: 0,
        currentValue: 0,
      },
      {
        id: "responseRate",
        name: "Response Rate",
        nameFa: "سرعت پاسخ‌دهی",
        color: "#10B981", // Emerald
        points: [],
        visible: true,
        trend: 0,
        currentValue: 0,
      },
      {
        id: "trustScore",
        name: "Trust Index",
        nameFa: "شاخص اعتماد",
        color: "#F59E0B", // Amber
        points: [],
        visible: true,
        trend: 0,
        currentValue: 0,
      }
    ];

    // Seed initial historical points so the graph starts with full line curves
    const now = Date.now();
    for (let i = this.maxPoints - 1; i >= 0; i--) {
      const time = now - i * 1000;
      this.generatePointsForTime(time);
    }

    // Start simulation ticks
    this.startStreaming();
  }

  private generatePointsForTime(time: number) {
    const seedBase = time / 10000;
    this.seriesList.forEach((series, index) => {
      // Deterministic noise based on time, with index offsetting for vertical separation
      const noiseVal = noise1D(seedBase + index * 100);

      // Vertical separation to prevent curves overlapping:
      // Series 1 (Visibility): 75 - 95
      // Series 2 (Authority): 60 - 80
      // Series 3 (Sentiment): 45 - 65
      // Series 4 (ResponseRate): 30 - 50
      // Series 5 (TrustScore): 15 - 35
      let value = 0;
      const baseMin = 75 - index * 14;
      value = baseMin + noiseVal * 15;

      const roundedVal = parseFloat(value.toFixed(1));
      const oldPoints = series.points;

      // Calculate trend compared to previous point
      let trend = 0;
      if (oldPoints.length > 0) {
        const prevVal = oldPoints[oldPoints.length - 1].value;
        if (prevVal > 0) {
          trend = parseFloat((((roundedVal - prevVal) / prevVal) * 100).toFixed(2));
        }
      }

      series.points.push({ timestamp: time, value: roundedVal });
      series.currentValue = roundedVal;
      series.trend = trend;

      if (series.points.length > this.maxPoints) {
        series.points.shift();
      }
    });
  }

  public getSeries(): MetricSeries[] {
    return this.seriesList;
  }

  public subscribe(callback: (series: MetricSeries[]) => void): () => void {
    this.callbacks.push(callback);
    // Emit initial data
    callback(this.seriesList);
    return () => this.unsubscribe(callback);
  }

  public unsubscribe(callback: (series: MetricSeries[]) => void): void {
    this.callbacks = this.callbacks.filter((cb) => cb !== callback);
  }

  public updateData(timestamp: number): void {
    this.generatePointsForTime(timestamp);
    this.notify();
  }

  private notify() {
    this.callbacks.forEach((cb) => cb([...this.seriesList]));
  }

  private startStreaming() {
    this.intervalId = setInterval(() => {
      this.updateData(Date.now());
    }, 1000);
  }

  public destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
