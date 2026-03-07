"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

const MIN_POINT_DISTANCE = 0.006;
const MAX_CAPTURED_POINTS = 512;
const MAX_OUTPUT_POINTS = 64;
const BRUSH_STEP_PX = 2;
const BRUSH_RADIUS_PX = 8;
const COMMIT_IDLE_MS = 2500;
const DITHER_CELL = 3;
const DITHER_HALO_FACTOR = 3.8;

// 4×4 Bayer matrix — thresholds in [0, 1)
const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => v / 16));

const bayerThreshold = (px: number, py: number): number => {
  const bx = ((Math.floor(px / DITHER_CELL) % 4) + 4) % 4;
  const by = ((Math.floor(py / DITHER_CELL) % 4) + 4) % 4;
  return BAYER_4X4[by][bx];
};

type PathPoint = { x: number; y: number };
type PixelPoint = { x: number; y: number };

type DitherStreamPathDrawerProps = {
  enabled: boolean;
  beamColor?: string;
  backgroundImageSrc?: string;
  onCommit: (points: Array<[number, number]>) => void;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const distance = (a: PathPoint, b: PathPoint) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const samplePath = (points: PathPoint[], count: number) => {
  if (points.length <= count) return points;

  const sampled: PathPoint[] = [];
  for (let index = 0; index < count; index += 1) {
    const t = index / Math.max(1, count - 1);
    const sourceIndex = Math.round(t * (points.length - 1));
    sampled.push(points[sourceIndex]);
  }
  return sampled;
};

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return { r: 170, g: 176, b: 240 };
  }
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};

const hash2 = (x: number, y: number) => {
  const n = x * 15731 + y * 789221 + 1376312589;
  const masked = n & 0x7fffffff;
  return (masked % 997) / 997;
};

export default function DitherStreamPathDrawer({
  enabled,
  beamColor = "#aab0f0",
  backgroundImageSrc,
  onCommit,
}: DitherStreamPathDrawerProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const commitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointsRef = useRef<PathPoint[]>([]);
  const lastPixelPointRef = useRef<PixelPoint | null>(null);
  const [cursor, setCursor] = useState<PathPoint | null>(null);

  const updatePoints = useCallback((nextPoints: PathPoint[]) => {
    pointsRef.current = nextPoints;
  }, []);

  const getRelativePoint = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return null;

      const x = clamp01((event.clientX - rect.left) / rect.width);
      const y = clamp01(1 - (event.clientY - rect.top) / rect.height);
      return {
        normalized: { x, y },
        pixels: {
          x: x * rect.width,
          y: (1 - y) * rect.height,
        },
      };
    },
    [],
  );

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const stampBrush = useCallback(
    (ctx: CanvasRenderingContext2D, point: PixelPoint, strength = 1) => {
      const color = hexToRgb(beamColor);
      const haloRadius = BRUSH_RADIUS_PX * DITHER_HALO_FACTOR;

      // Faint ambient glow underneath the dither
      const glow = ctx.createRadialGradient(
        point.x,
        point.y,
        0,
        point.x,
        point.y,
        haloRadius,
      );
      glow.addColorStop(
        0,
        `rgba(${color.r}, ${color.g}, ${color.b}, ${0.09 * strength})`,
      );
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(point.x, point.y, haloRadius, 0, Math.PI * 2);
      ctx.fill();

      // Bayer ordered-dither halo — coarse pixel blocks with dithered falloff
      const step = DITHER_CELL;
      const startX = Math.floor((point.x - haloRadius) / step) * step;
      const endX = Math.ceil((point.x + haloRadius) / step) * step;
      const startY = Math.floor((point.y - haloRadius) / step) * step;
      const endY = Math.ceil((point.y + haloRadius) / step) * step;

      for (let py = startY; py <= endY; py += step) {
        for (let px = startX; px <= endX; px += step) {
          const radial = Math.hypot(
            px + step * 0.5 - point.x,
            py + step * 0.5 - point.y,
          );
          if (radial > haloRadius) continue;

          const normalizedDist = radial / haloRadius;
          const density = 1 - normalizedDist;
          if (bayerThreshold(px, py) >= density) continue;

          const alpha = density * 0.9 * strength;
          const isHot =
            normalizedDist < 0.28 &&
            hash2(Math.floor(px) + 11, Math.floor(py) - 7) > 0.68;
          ctx.fillStyle = isHot
            ? `rgba(255,255,255,${alpha})`
            : `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
          ctx.fillRect(px, py, step, step);
        }
      }

      // Bright core dot on top
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.88 * strength})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, BRUSH_RADIUS_PX * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.92 * strength})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, BRUSH_RADIUS_PX * 0.28, 0, Math.PI * 2);
      ctx.fill();
    },
    [beamColor],
  );

  const drawSegment = useCallback(
    (from: PixelPoint, to: PixelPoint) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distancePx = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.ceil(distancePx / BRUSH_STEP_PX));
      for (let index = 0; index <= steps; index += 1) {
        const t = index / steps;
        stampBrush(
          ctx,
          { x: from.x + dx * t, y: from.y + dy * t },
          drawingRef.current ? 1 : 0.92,
        );
      }
    },
    [stampBrush],
  );

  const finalizePath = useCallback(() => {
    if (commitTimeoutRef.current) {
      clearTimeout(commitTimeoutRef.current);
      commitTimeoutRef.current = null;
    }

    const capturedPoints = pointsRef.current;
    if (capturedPoints.length < 2) {
      updatePoints([]);
      return;
    }

    const sampled = samplePath(capturedPoints, MAX_OUTPUT_POINTS);
    onCommit(sampled.map((point) => [point.x, point.y]));
    updatePoints([]);
  }, [onCommit, updatePoints]);

  const queueCommit = useCallback(() => {
    if (commitTimeoutRef.current) {
      clearTimeout(commitTimeoutRef.current);
    }
    commitTimeoutRef.current = setTimeout(() => {
      finalizePath();
    }, COMMIT_IDLE_MS);
  }, [finalizePath]);

  const addPoint = useCallback(
    (point: PathPoint) => {
      const previousPoints = pointsRef.current;
      if (!previousPoints.length) {
        updatePoints([point]);
        return;
      }

      const lastPoint = previousPoints[previousPoints.length - 1];
      if (
        previousPoints.length < MAX_CAPTURED_POINTS &&
        distance(lastPoint, point) >= MIN_POINT_DISTANCE
      ) {
        updatePoints([...previousPoints, point]);
      }
    },
    [updatePoints],
  );

  useEffect(() => {
    if (enabled) return;
    drawingRef.current = false;
    pointerIdRef.current = null;
    if (commitTimeoutRef.current) {
      clearTimeout(commitTimeoutRef.current);
      commitTimeoutRef.current = null;
    }
    pointsRef.current = [];
    lastPixelPointRef.current = null;
    setCursor(null);
    clearCanvas();
  }, [clearCanvas, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    const container = overlayRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr =
        typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, rect.width, rect.height);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-20 cursor-crosshair touch-none"
      style={{
        background: backgroundImageSrc
          ? undefined
          : "radial-gradient(circle at center, rgba(102,110,164,0.10), rgba(7,9,17,0.72))",
        border: "1px dashed rgba(188,196,246,0.35)",
      }}
      onPointerDown={(event) => {
        const point = getRelativePoint(event);
        if (!point) return;

        drawingRef.current = true;
        pointerIdRef.current = event.pointerId;
        setCursor(point.normalized);
        const existingPoints = pointsRef.current;
        if (existingPoints.length === 0) {
          updatePoints([point.normalized]);
        } else {
          updatePoints([...existingPoints, point.normalized]);
        }
        lastPixelPointRef.current = point.pixels;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx) {
          stampBrush(ctx, point.pixels);
        }
        queueCommit();
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const point = getRelativePoint(event);
        if (!point) return;

        setCursor(point.normalized);
        if (!drawingRef.current) return;
        addPoint(point.normalized);

        const lastPoint = lastPixelPointRef.current;
        if (lastPoint) {
          drawSegment(lastPoint, point.pixels);
        }
        lastPixelPointRef.current = point.pixels;
        queueCommit();
      }}
      onPointerUp={(event) => {
        if (pointerIdRef.current === event.pointerId) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        drawingRef.current = false;
        pointerIdRef.current = null;
        lastPixelPointRef.current = null;
      }}
      onPointerCancel={(event) => {
        if (pointerIdRef.current === event.pointerId) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        drawingRef.current = false;
        pointerIdRef.current = null;
        lastPixelPointRef.current = null;
        if (commitTimeoutRef.current) {
          clearTimeout(commitTimeoutRef.current);
          commitTimeoutRef.current = null;
        }
        updatePoints([]);
        clearCanvas();
      }}
    >
      {backgroundImageSrc && (
        <>
          <img
            src={backgroundImageSrc}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            alt=""
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 bg-black/50" />
        </>
      )}
      <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-white/30 bg-black/40 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-white/80">
        Click and drag to draw your beam path
      </div>
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0"
      />
      {cursor && (
        <div
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-white/15"
          style={{
            left: `${cursor.x * 100}%`,
            top: `${(1 - cursor.y) * 100}%`,
          }}
        />
      )}
    </div>
  );
}
