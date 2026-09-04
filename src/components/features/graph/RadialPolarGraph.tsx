"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

interface RadialPolarGraphProps {
  className?: string;
}

export function RadialPolarGraph({ className = "w-full h-full" }: RadialPolarGraphProps) {
  const { language } = useTheme();
  const isFa = language === "fa";
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredSector, setHoveredSector] = useState<number | null>(null);
  const [hoveredPointer, setHoveredPointer] = useState<string | null>(null);

  // Mouse hover state tracking
  const mouseRef = useRef({ x: 0, y: 0, isOver: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      const parent = containerRef.current;
      if (parent && canvas) {
        // High DPI canvas rendering
        const dpr = window.devicePixelRatio || 1;
        canvas.width = parent.clientWidth * dpr;
        canvas.height = parent.clientHeight * dpr;
        canvas.style.width = `${parent.clientWidth}px`;
        canvas.style.height = `${parent.clientHeight}px`;
        ctx.scale(dpr, dpr);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Mouse interactive events
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseRef.current.x = x;
      mouseRef.current.y = y;
      mouseRef.current.isOver = true;

      // Determine hovered sector based on angle
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 30 && dist < rect.width * 0.45) {
        // Calculate angle in radians and normalize to [0, 2PI] starting from top (-PI/2)
        let angle = Math.atan2(dy, dx) + Math.PI / 2;
        if (angle < 0) angle += Math.PI * 2;
        // Divide into 12 sectors
        const sector = Math.floor((angle / (Math.PI * 2)) * 12) + 1;
        setHoveredSector(sector > 12 ? 1 : sector);
      } else {
        setHoveredSector(null);
      }

      // Detect hover on interactive diamond pointers
      // Let's check proximity to the 3 main diamonds
      const R = Math.min(rect.width, rect.height) * 0.41;
      const pointers = [
        { id: "p1", angle: -Math.PI / 2 + (10 * Math.PI / 6), r: R * 0.4 }, // blue pointer 1
        { id: "p2", angle: -Math.PI / 2 + (7.8 * Math.PI / 6), r: R * 0.42 }, // red pointer 2
        { id: "p3", angle: -Math.PI / 2 + (6.5 * Math.PI / 6), r: R * 0.45 }, // red pointer 3
      ];

      let matchedPointer: string | null = null;
      for (const p of pointers) {
        const px = cx + p.r * Math.cos(p.angle);
        const py = cy + p.r * Math.sin(p.angle);
        const pDist = Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
        if (pDist < 14) {
          matchedPointer = p.id;
          break;
        }
      }
      setHoveredPointer(matchedPointer);
    };

    const handleMouseLeave = () => {
      mouseRef.current.isOver = false;
      setHoveredSector(null);
      setHoveredPointer(null);
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    // Animation variables
    let phase = 0;
    const animate = () => {
      phase += 0.015;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const R = Math.min(width, height) * 0.41; // Outer radius of radar

      // 1. Draw glowing background sector wedges
      if (hoveredSector !== null) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        const startAngle = -Math.PI / 2 + ((hoveredSector - 1) * Math.PI / 6);
        const endAngle = -Math.PI / 2 + (hoveredSector * Math.PI / 6);
        ctx.arc(cx, cy, R, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = "rgba(56, 189, 248, 0.04)";
        ctx.fill();
        ctx.restore();
      }

      // 2. Draw Concentric Gray Circles (Radar Tracks)
      ctx.save();
      ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
      ctx.lineWidth = 1;
      const trackRadii = [R * 0.2, R * 0.4, R * 0.6, R * 0.8, R];
      trackRadii.forEach((r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Subtle dashed middle rings
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 3. Draw Radial Spokes (12 Divisions)
      ctx.save();
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 12; i++) {
        const angle = -Math.PI / 2 + (i * Math.PI / 6);
        const isSpokeHovered = hoveredSector !== null && (hoveredSector - 1 === i || (hoveredSector === 12 && i === 11));

        ctx.strokeStyle = isSpokeHovered ? "rgba(56, 189, 248, 0.4)" : "rgba(148, 163, 184, 0.12)";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
        ctx.stroke();

        // Dashed extensions on outer tracks
        ctx.save();
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
        ctx.beginPath();
        ctx.moveTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
        ctx.lineTo(cx + (R + 15) * Math.cos(angle), cy + (R + 15) * Math.sin(angle));
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      // 4. Draw Outer RIM Arcs (Blue, Red, Teal tracks based on the PNG image)
      ctx.save();
      ctx.lineWidth = 4;
      ctx.lineCap = "round";

      // Blue outer RIM arc (spanning sectors 10 to 3)
      const blueStart = -Math.PI / 2 + (10 * Math.PI / 6);
      const blueEnd = -Math.PI / 2 + (15 * Math.PI / 6);
      ctx.strokeStyle = "rgb(23, 73, 137)"; // Deep stylish blue
      ctx.beginPath();
      ctx.arc(cx, cy, R + 3, blueStart, blueEnd);
      ctx.stroke();

      // Teal/Green RIM arc (spanning sectors 3 to 5)
      const tealStart = -Math.PI / 2 + (15 * Math.PI / 6);
      const tealEnd = -Math.PI / 2 + (17.2 * Math.PI / 6);
      ctx.strokeStyle = "rgb(105, 172, 161)"; // Light teal
      ctx.beginPath();
      ctx.arc(cx, cy, R + 3, tealStart, tealEnd);
      ctx.stroke();

      // Red RIM arc (spanning sectors 6.8 to 8.5)
      const redStart = -Math.PI / 2 + (18.8 * Math.PI / 6);
      const redEnd = -Math.PI / 2 + (20.5 * Math.PI / 6);
      ctx.strokeStyle = "rgb(197, 63, 71)"; // Deep warm red
      ctx.beginPath();
      ctx.arc(cx, cy, R + 3, redStart, redEnd);
      ctx.stroke();

      // Background pink arcs
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(197, 63, 71, 0.25)";
      ctx.beginPath();
      ctx.arc(cx, cy, R + 10, redStart - 0.2, redEnd + 0.3);
      ctx.stroke();

      ctx.restore();

      // 5. Draw Clock Numbers 1 to 12
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let i = 1; i <= 12; i++) {
        // Calculate coordinate outside of RIM
        const angle = -Math.PI / 2 + (i * Math.PI / 6);
        const numR = R + 22;
        const nx = cx + numR * Math.cos(angle);
        const ny = cy + numR * Math.sin(angle);

        const isHovered = hoveredSector === i;
        ctx.fillStyle = isHovered ? "#38bdf8" : "rgba(255, 255, 255, 0.5)";
        ctx.font = isHovered ? "bold 13px system-ui, -apple-system, sans-serif" : "bold 11px system-ui, -apple-system, sans-serif";
        ctx.fillText(i.toString(), nx, ny);
      }
      ctx.restore();

      // 6. Draw the Central Dense Core Dot
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = "rgba(56, 189, 248, 0.5)";
      ctx.fillStyle = "rgb(15, 23, 42)";
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fill();

      // Core border outline
      ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner center-most black pin-head
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 7. Draw Organic Closed Loop 1 (Teal Wave / Semantic Signal)
      ctx.save();
      ctx.beginPath();
      const tealPointsCount = 200;
      for (let i = 0; i <= tealPointsCount; i++) {
        const theta = (i / tealPointsCount) * Math.PI * 2;
        // Mathematical formula to generate the smooth wavy lobe structure resembling the teal contour in the image
        const rFactor = 0.5 +
          0.12 * Math.sin(3 * theta + phase) +
          0.15 * Math.sin(5 * theta - phase * 0.4) +
          0.05 * Math.cos(9 * theta);

        const currentR = R * rFactor;
        const wx = cx + currentR * Math.cos(theta);
        const wy = cy + currentR * Math.sin(theta);

        if (i === 0) {
          ctx.moveTo(wx, wy);
        } else {
          ctx.lineTo(wx, wy);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.65)";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Gentle teal gradient fill
      const tealGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, R);
      tealGrad.addColorStop(0, "rgba(56, 189, 248, 0.01)");
      tealGrad.addColorStop(1, "rgba(56, 189, 248, 0.04)");
      ctx.fillStyle = tealGrad;
      ctx.fill();
      ctx.restore();

      // 8. Draw Organic Closed Loop 2 (Red Wave / Competitor Signal)
      ctx.save();
      ctx.beginPath();
      const redPointsCount = 200;
      for (let i = 0; i <= redPointsCount; i++) {
        const theta = (i / redPointsCount) * Math.PI * 2;
        // Different harmonic formulas to create the asymmetrical overlapping loops in the lower left
        const rFactor = 0.45 +
          0.14 * Math.cos(2 * theta - phase * 0.8) +
          0.08 * Math.sin(4 * theta + phase * 0.5) +
          0.04 * Math.sin(7 * theta);

        const currentR = R * rFactor;
        const wx = cx + currentR * Math.cos(theta);
        const wy = cy + currentR * Math.sin(theta);

        if (i === 0) {
          ctx.moveTo(wx, wy);
        } else {
          ctx.lineTo(wx, wy);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = "rgba(197, 63, 71, 0.6)";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      const redGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, R);
      redGrad.addColorStop(0, "rgba(197, 63, 71, 0.0)");
      redGrad.addColorStop(1, "rgba(197, 63, 71, 0.04)");
      ctx.fillStyle = redGrad;
      ctx.fill();
      ctx.restore();

      // 9. Draw the Pointer Vectors (Matching blue and red diamond vector arrows in the PNG)
      ctx.save();

      // Helper function to draw a diamond pointer vector
      const drawVectorPointer = (
        id: string,
        angle: number,
        startR: number,
        endR: number,
        color: string,
        isHovered: boolean
      ) => {
        const sx = cx + startR * Math.cos(angle);
        const sy = cy + startR * Math.sin(angle);
        const ex = cx + endR * Math.cos(angle);
        const ey = cy + endR * Math.sin(angle);

        // Line
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = color;
        ctx.lineWidth = isHovered ? 2.5 : 1.5;
        ctx.stroke();

        // Draw diamond head
        ctx.save();
        ctx.translate(ex, ey);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-6, -4);
        ctx.lineTo(-12, 0);
        ctx.lineTo(-6, 4);
        ctx.closePath();
        ctx.fillStyle = isHovered ? "#ffffff" : color;
        ctx.shadowBlur = isHovered ? 12 : 0;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.restore();
      };

      // Pointer 1: Blue Vector pointing inwards from 10 o'clock
      const angle1 = -Math.PI / 2 + (10 * Math.PI / 6);
      const isP1Hovered = hoveredPointer === "p1";
      drawVectorPointer("p1", angle1, R, R * 0.4, "rgb(56, 189, 248)", isP1Hovered);

      // Pointer 2: Red Vector pointing inwards from 7.8 o'clock
      const angle2 = -Math.PI / 2 + (7.8 * Math.PI / 6);
      const isP2Hovered = hoveredPointer === "p2";
      drawVectorPointer("p2", angle2, R, R * 0.42, "rgb(197, 63, 71)", isP2Hovered);

      // Pointer 3: Red Vector pointing inwards from 6.5 o'clock
      const angle3 = -Math.PI / 2 + (6.5 * Math.PI / 6);
      const isP3Hovered = hoveredPointer === "p3";
      drawVectorPointer("p3", angle3, R, R * 0.45, "rgb(197, 63, 71)", isP3Hovered);

      // Pointer 4: Dark vertical line pointing upwards from 6 o'clock (spans core to rim)
      ctx.beginPath();
      ctx.moveTo(cx, cy + 26);
      ctx.lineTo(cx, cy + R);
      ctx.strokeStyle = "rgb(23, 73, 137)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Top vertical vector cap arrow at 6 o'clock (near core)
      ctx.save();
      ctx.translate(cx, cy + 30);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-4, 8);
      ctx.lineTo(4, 8);
      ctx.closePath();
      ctx.fillStyle = "rgb(23, 73, 137)";
      ctx.fill();
      ctx.restore();

      ctx.restore();

      // 10. Floating Interactive Tooltips when hovering pointers
      if (hoveredPointer) {
        ctx.save();
        const tooltipX = mouseRef.current.x;
        const tooltipY = mouseRef.current.y - 18;

        const textFa =
          hoveredPointer === "p1"
            ? "پایش سیگنال سهم صدای برند"
            : hoveredPointer === "p2"
            ? "ریسک کاذب و توهم هوش مصنوعی"
            : "استناد معنایی به رقبای کلیدی";

        const textEn =
          hoveredPointer === "p1"
            ? "Brand Share of Voice Tracking"
            : hoveredPointer === "p2"
            ? "AI Hallucination & Factuality Risk"
            : "Semantic Citation Outflow";

        const label = isFa ? textFa : textEn;

        ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
        const textWidth = ctx.measureText(label).width;

        // Tooltip box
        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(tooltipX - textWidth / 2 - 8, tooltipY - 12, textWidth + 16, 22, 6);
        ctx.fill();
        ctx.stroke();

        // Tooltip text
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, tooltipX, tooltipY - 1);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
      if (canvas) {
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [isFa, hoveredSector, hoveredPointer]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="block w-full h-full cursor-pointer" />
    </div>
  );
}
