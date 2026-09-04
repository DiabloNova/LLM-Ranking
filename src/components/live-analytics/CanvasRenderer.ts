import { MetricSeries } from "./types";
import { GraphEngine, Point2D } from "./GraphEngine";

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private engine: GraphEngine;

  private padding = { top: 30, right: 35, bottom: 40, left: 55 };

  constructor(canvas: HTMLCanvasElement, engine: GraphEngine) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not obtain 2D canvas context");
    }
    this.ctx = context;
    this.engine = engine;
  }

  /**
   * Scale canvas for HiDPI displays to prevent blurriness
   */
  public resize(width: number, height: number, dpr: number): void {
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(dpr, dpr);
  }

  /**
   * Fill the background with deep corporate dark blue token
   */
  public drawBackground(width: number, height: number): void {
    this.ctx.save();
    this.ctx.fillStyle = "#0A1324"; // Strict dark enterprise theme background
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.restore();
  }

  /**
   * Render coordinate grid lines and axes with minimal opacity (10%-15%)
   */
  public renderGrid(
    width: number,
    height: number,
    minTime: number,
    maxTime: number,
    minValue: number,
    maxValue: number,
    isRtl: boolean
  ): void {
    const chartWidth = width - this.padding.left - this.padding.right;
    const chartHeight = height - this.padding.top - this.padding.bottom;

    this.ctx.save();
    // Minimalist grid lines (10% opacity)
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    this.ctx.lineWidth = 1;
    this.ctx.fillStyle = "#94A3B8"; // Subdued slate
    this.ctx.font = '10px "Yekan Bakh", Tahoma, system-ui';
    this.ctx.textAlign = isRtl ? "left" : "right";
    this.ctx.textBaseline = "middle";

    // 1. Draw Horizontal Grid Lines and Y-Axis Labels
    const horizontalLines = 4;
    for (let i = 0; i <= horizontalLines; i++) {
      const value = minValue + (maxValue - minValue) * (i / horizontalLines);
      const y = this.padding.top + chartHeight - (i / horizontalLines) * chartHeight;

      this.ctx.beginPath();
      this.ctx.moveTo(this.padding.left, y);
      this.ctx.lineTo(width - this.padding.right, y);
      this.ctx.stroke();

      const labelX = isRtl ? width - this.padding.right + 8 : this.padding.left - 8;
      this.ctx.fillText(Math.round(value).toString(), labelX, y);
    }

    // 2. Draw Vertical Grid Lines and X-Axis Time Labels
    const verticalLines = 5;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "top";

    for (let i = 0; i < verticalLines; i++) {
      const ratio = i / (verticalLines - 1);
      const timestamp = minTime + (maxTime - minTime) * ratio;
      const x = this.padding.left + ratio * chartWidth;

      this.ctx.beginPath();
      this.ctx.moveTo(x, this.padding.top);
      this.ctx.lineTo(x, this.padding.top + chartHeight);
      this.ctx.stroke();

      const date = new Date(timestamp);
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const seconds = date.getSeconds().toString().padStart(2, "0");
      const label = `${hours}:${minutes}:${seconds}`;

      this.ctx.fillText(label, x, this.padding.top + chartHeight + 8);
    }

    this.ctx.restore();
  }

  /**
   * Render vertical crosshairs snapping to coordinates on hover
   */
  public renderCrosshair(
    width: number,
    height: number,
    x: number
  ): void {
    if (x < this.padding.left || x > width - this.padding.right) return;

    this.ctx.save();
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([4, 4]); // Dash pattern

    this.ctx.beginPath();
    this.ctx.moveTo(x, this.padding.top);
    this.ctx.lineTo(x, height - this.padding.bottom);
    this.ctx.stroke();

    this.ctx.restore();
  }

  /**
   * Render metric series curves
   */
  public renderSeries(
    width: number,
    height: number,
    series: MetricSeries,
    minTime: number,
    maxTime: number,
    minValue: number,
    maxValue: number,
    hoveredSeriesId: string | null
  ): void {
    if (!series.visible || series.points.length < 2) return;

    const chartHeight = height - this.padding.top - this.padding.bottom;

    // Determine visual weights for active / dimmed curves
    const isAnyHovered = hoveredSeriesId !== null;
    const isThisHovered = hoveredSeriesId === series.id;

    let opacity = 1.0;
    let strokeWidth = 2.5;
    let shadowBlur = 10;

    if (isAnyHovered) {
      if (isThisHovered) {
        opacity = 1.0;
        strokeWidth = 3.5; // Elevate active curve stroke width
        shadowBlur = 18;   // Elevate glow
      } else {
        opacity = 0.2;     // Dim inactive curves smoothly to 20%
        strokeWidth = 1.5;
        shadowBlur = 0;
      }
    }

    // Convert all points to coordinates
    const pixelPoints: Point2D[] = series.points.map((pt) =>
      this.engine.mapToPixel(
        pt.timestamp,
        pt.value,
        minTime,
        maxTime,
        minValue,
        maxValue,
        width,
        height,
        this.padding
      )
    );

    this.ctx.save();

    // Set glow shadow styling
    this.ctx.shadowColor = series.color;
    this.ctx.shadowBlur = shadowBlur;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 2;

    // Set globally applied transparency
    this.ctx.globalAlpha = opacity;

    // 1. Draw spline curve
    this.ctx.beginPath();
    this.ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);

    for (let i = 0; i < pixelPoints.length - 1; i++) {
      const { cp1, cp2 } = this.engine.getSplineControlPoints(pixelPoints, i);
      this.ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, pixelPoints[i + 1].x, pixelPoints[i + 1].y);
    }

    this.ctx.strokeStyle = series.color;
    this.ctx.lineWidth = strokeWidth;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.stroke();

    // Disable shadow glow for fill drawing to prevent weird gradient glow behaviors
    this.ctx.shadowBlur = 0;

    // 2. Draw gradient fill underneath the curve
    this.ctx.beginPath();
    this.ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);

    for (let i = 0; i < pixelPoints.length - 1; i++) {
      const { cp1, cp2 } = this.engine.getSplineControlPoints(pixelPoints, i);
      this.ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, pixelPoints[i + 1].x, pixelPoints[i + 1].y);
    }

    this.ctx.lineTo(pixelPoints[pixelPoints.length - 1].x, this.padding.top + chartHeight);
    this.ctx.lineTo(pixelPoints[0].x, this.padding.top + chartHeight);
    this.ctx.closePath();

    const fillGradient = this.ctx.createLinearGradient(0, this.padding.top, 0, this.padding.top + chartHeight);
    fillGradient.addColorStop(0, `${series.color}33`); // 20% opacity at top
    fillGradient.addColorStop(1, `${series.color}00`); // 0% opacity at bottom

    this.ctx.fillStyle = fillGradient;
    this.ctx.fill();

    // 3. Draw pulse dot at the latest point
    const lastPoint = pixelPoints[pixelPoints.length - 1];
    this.ctx.beginPath();
    this.ctx.arc(lastPoint.x, lastPoint.y, isThisHovered ? 6 : 4, 0, Math.PI * 2);
    this.ctx.fillStyle = series.color;
    this.ctx.fill();
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    this.ctx.restore();
  }
}
