"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import opentype, { Font, PathCommand } from "opentype.js";
import waltographUrl from "../assets/fonts/waltographUI.ttf";

type Pt = { x: number; y: number };
type Polyline = Pt[];
type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

type Stroke = {
  id: string;
  points: Polyline;
  length: number;
  startMs: number;
  durationMs: number;
  pauseBeforeMs: number;
  wordBoundary: boolean;
  kind: "main" | "secondary";
  wordIndex: number;
  baselineDrift: Pt;
  offsets: { start: Pt; mid: Pt; end: Pt };
  poolingStrength: number;
  overshootPx: number;
  endDirection: Pt;
  flourish?: { points: Polyline; length: number };
};

type StrokePlan = { strokes: Stroke[]; totalMs: number };

type Contour = {
  id: string;
  points: Polyline;
  length: number;
  bounds: Bounds;
  boundsArea: number;
  glyphIndex: number;
  wordIndex: number;
  signedArea: number;
  isHole: boolean;
  isSecondary: boolean;
  isPunctuation: boolean;
};

function dist(a: Pt, b: Pt) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function polylineLength(points: Polyline) {
  let L = 0;
  for (let i = 1; i < points.length; i++) L += dist(points[i - 1], points[i]);
  return L;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToSeed(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function randomBetween(rng: () => number, min: number, max: number) {
  return min + (max - min) * rng();
}

function randomOffset(rng: () => number, magnitude: number): Pt {
  return {
    x: randomBetween(rng, -magnitude, magnitude),
    y: randomBetween(rng, -magnitude, magnitude),
  };
}

function easeInOut(t: number) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function sampleCubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, steps: number): Polyline {
  const pts: Polyline = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const x =
      mt * mt * mt * p0.x +
      3 * mt * mt * t * p1.x +
      3 * mt * t * t * p2.x +
      t * t * t * p3.x;
    const y =
      mt * mt * mt * p0.y +
      3 * mt * mt * t * p1.y +
      3 * mt * t * t * p2.y +
      t * t * t * p3.y;
    pts.push({ x, y });
  }
  return pts;
}

function sampleQuadratic(p0: Pt, p1: Pt, p2: Pt, steps: number): Polyline {
  const pts: Polyline = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x;
    const y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y;
    pts.push({ x, y });
  }
  return pts;
}

function pathToPolylines(
  commands: PathCommand[],
  samplesPerCurve = 16
): Polyline[] {
  const polylines: Polyline[] = [];
  let current: Polyline = [];
  let pen: Pt = { x: 0, y: 0 };
  let start: Pt = { x: 0, y: 0 };

  const pushCurrent = () => {
    if (current.length > 1) polylines.push(current);
    current = [];
  };

  for (const cmd of commands) {
    if (cmd.type === "M") {
      pushCurrent();
      pen = { x: cmd.x, y: cmd.y };
      start = { ...pen };
      current.push({ ...pen });
    } else if (cmd.type === "L") {
      pen = { x: cmd.x, y: cmd.y };
      current.push({ ...pen });
    } else if (cmd.type === "C") {
      const p0 = pen;
      const p1 = { x: cmd.x1, y: cmd.y1 };
      const p2 = { x: cmd.x2, y: cmd.y2 };
      const p3 = { x: cmd.x, y: cmd.y };
      const pts = sampleCubic(p0, p1, p2, p3, samplesPerCurve);
      current.push(...pts.slice(1));
      pen = p3;
    } else if (cmd.type === "Q") {
      const p0 = pen;
      const p1 = { x: cmd.x1, y: cmd.y1 };
      const p2 = { x: cmd.x, y: cmd.y };
      const pts = sampleQuadratic(p0, p1, p2, samplesPerCurve);
      current.push(...pts.slice(1));
      pen = p2;
    } else if (cmd.type === "Z") {
      current.push({ ...start });
      pushCurrent();
    }
  }

  pushCurrent();
  return polylines;
}

function polygonSignedArea(points: Polyline) {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

function polylineBounds(points: Polyline): Bounds {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  if (!points.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return { minX, minY, maxX, maxY };
}

function getEndDirection(points: Polyline): Pt {
  for (let i = points.length - 1; i > 0; i--) {
    const curr = points[i];
    const prev = points[i - 1];
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const mag = Math.hypot(dx, dy);
    if (mag > 0) return { x: dx / mag, y: dy / mag };
  }
  return { x: 1, y: 0 };
}

function drawPolylineStamped(
  ctx: CanvasRenderingContext2D,
  pts: Polyline,
  visibleLen: number,
  totalLen: number,
  strokeWidth: number,
  strokeColor: string,
  baselineOffset: Pt,
  offsets: { start: Pt; mid: Pt; end: Pt },
  poolingStrength: number
) {
  if (pts.length < 2 || visibleLen <= 0 || totalLen <= 0) return;

  const maxDistance = Math.min(visibleLen, totalLen);
  if (maxDistance <= 0) return;

  const spacing = Math.max(0.5, strokeWidth * 0.3);
  let nextStamp = 0;
  let segmentIndex = 1;
  let segmentStartLen = 0;
  let segmentLength = dist(pts[0], pts[1]);
  const lastIndex = pts.length - 1;

  const advanceSegment = () => {
    while (segmentLength === 0 && segmentIndex < lastIndex) {
      segmentIndex++;
      segmentLength = dist(pts[segmentIndex - 1], pts[segmentIndex]);
    }
  };
  advanceSegment();

  const stampAt = (distance: number) => {
    const targetDistance = Math.min(distance, maxDistance);
    while (
      segmentIndex < pts.length &&
      targetDistance > segmentStartLen + segmentLength &&
      segmentIndex < lastIndex
    ) {
      segmentStartLen += segmentLength;
      segmentIndex++;
      segmentLength = dist(pts[segmentIndex - 1], pts[segmentIndex]);
      advanceSegment();
    }

    const clampedSegmentLen = segmentLength || 1;
    const segmentDistance = Math.max(0, targetDistance - segmentStartLen);
    const t = segmentLength === 0 ? 0 : segmentDistance / clampedSegmentLen;
    const a = pts[segmentIndex - 1];
    const b = pts[segmentIndex];
    const point = {
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t),
    };
    const localProgress =
      maxDistance > 0 ? Math.min(1, targetDistance / maxDistance) : 1;
    const delta =
      localProgress < 0.5
        ? {
            x: lerp(offsets.start.x, offsets.mid.x, localProgress * 2),
            y: lerp(offsets.start.y, offsets.mid.y, localProgress * 2),
          }
        : {
            x: lerp(offsets.mid.x, offsets.end.x, (localProgress - 0.5) * 2),
            y: lerp(offsets.mid.y, offsets.end.y, (localProgress - 0.5) * 2),
          };
    point.x += baselineOffset.x + delta.x;
    point.y += baselineOffset.y + delta.y;

    const pressure = Math.max(0, Math.sin(Math.PI * localProgress));
    const poolingFactor =
      localProgress >= 0.7 ? Math.pow((localProgress - 0.7) / 0.3, 1.1) : 0;
    const radius = Math.max(
      0.1,
      strokeWidth *
        (0.35 + 0.65 * pressure) *
        (1 + poolingStrength * poolingFactor)
    );

    ctx.moveTo(point.x + radius, point.y);
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  };

  ctx.save();
  ctx.fillStyle = strokeColor;
  ctx.beginPath();
  while (nextStamp <= maxDistance) {
    stampAt(nextStamp);
    nextStamp += spacing;
  }
  if (nextStamp - spacing < maxDistance) {
    stampAt(maxDistance);
  }
  ctx.fill();
  ctx.restore();
}

function drawOvershootTail(
  ctx: CanvasRenderingContext2D,
  basePoint: Pt,
  direction: Pt,
  overshootPx: number,
  strokeWidth: number,
  strokeColor: string
) {
  if (overshootPx <= 0) return;
  const dirMag = Math.hypot(direction.x, direction.y) || 1;
  const dir = { x: direction.x / dirMag, y: direction.y / dirMag };
  const spacing = Math.max(1, strokeWidth * 0.4);

  ctx.save();
  ctx.fillStyle = strokeColor;
  ctx.beginPath();
  for (let traveled = 0; traveled <= overshootPx; traveled += spacing) {
    const progress = Math.min(1, traveled / Math.max(overshootPx, 0.0001));
    const radius = Math.max(0.1, strokeWidth * (0.25 + 0.35 * (1 - progress)));
    const x = basePoint.x + dir.x * traveled;
    const y = basePoint.y + dir.y * traveled;
    ctx.moveTo(x + radius, y);
    ctx.arc(x, y, radius, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();
}

function createFlourishPath(
  endPoint: Pt,
  direction: Pt,
  rng: () => number
): { points: Polyline; length: number } | null {
  const dirMag = Math.hypot(direction.x, direction.y);
  if (!dirMag) return null;
  const dir = { x: direction.x / dirMag, y: direction.y / dirMag };
  const normal = { x: -dir.y, y: dir.x };
  const flourishLen = randomBetween(rng, 6, 14);
  const curl = randomBetween(rng, -0.6, 0.6);

  const control = {
    x:
      endPoint.x +
      dir.x * (flourishLen * 0.5) +
      normal.x * flourishLen * 0.3 * curl,
    y:
      endPoint.y +
      dir.y * (flourishLen * 0.5) +
      normal.y * flourishLen * 0.3 * curl,
  };
  const finalPoint = {
    x: endPoint.x + dir.x * flourishLen + normal.x * flourishLen * 0.15 * curl,
    y: endPoint.y + dir.y * flourishLen + normal.y * flourishLen * 0.15 * curl,
  };

  const flourishPoints = sampleQuadratic(endPoint, control, finalPoint, 12);
  const length = polylineLength(flourishPoints);
  if (length <= 0) return null;
  return { points: flourishPoints, length };
}

const ZERO_OFFSETS: { start: Pt; mid: Pt; end: Pt } = {
  start: { x: 0, y: 0 },
  mid: { x: 0, y: 0 },
  end: { x: 0, y: 0 },
};

function resolveCurveSamples(controlValue: number) {
  return Math.max(2, Math.round(controlValue * controlValue * 0.75));
}

type PreparedPath = {
  contours: Contour[];
  polylines: Polyline[];
  totalLen: number;
  bounds: Bounds;
};

function computeBounds(polylines: Polyline[]): Bounds {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const line of polylines) {
    for (const p of line) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }
  if (
    minX === Infinity ||
    minY === Infinity ||
    maxX === -Infinity ||
    maxY === -Infinity
  ) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  return { minX, minY, maxX, maxY };
}

function prepareText(
  font: Font,
  text: string,
  fontSize: number,
  samplesPerCurve: number
): PreparedPath {
  const glyphs = font.stringToGlyphs(text);
  const characters = Array.from(text);
  const contours: Contour[] = [];

  let totalLen = 0;
  let penX = 0;
  const scale = fontSize / font.unitsPerEm;
  let currentWordIndex = 0;
  let hasGlyphInCurrentWord = false;

  const lengthThreshold = Math.max(fontSize * 0.65, 20);
  const areaThreshold = Math.max(fontSize * fontSize * 0.02, 40);
  const punctuationRegex = /[!?,.;:'"()]/;

  for (let i = 0; i < glyphs.length; i++) {
    const glyph = glyphs[i];
    const char = characters[i] ?? "";
    const isWhitespaceChar = /\s/.test(char);
    const isPunctuationGlyph = punctuationRegex.test(char);

    if (isWhitespaceChar) {
      if (hasGlyphInCurrentWord) {
        currentWordIndex++;
        hasGlyphInCurrentWord = false;
      }
      const advanceWidth =
        glyph.advanceWidth && glyph.advanceWidth > 0
          ? glyph.advanceWidth
          : font.unitsPerEm;
      penX += advanceWidth * scale;
      continue;
    }

    hasGlyphInCurrentWord = true;
    const commands = glyph.getPath(penX, 0, fontSize).commands;
    const glyphLines = pathToPolylines(commands, samplesPerCurve);

    for (
      let contourIndex = 0;
      contourIndex < glyphLines.length;
      contourIndex++
    ) {
      const pl = glyphLines[contourIndex];
      if (pl.length < 2) continue;
      const length = polylineLength(pl);
      if (length <= 0) continue;

      const bounds = polylineBounds(pl);
      const boundsArea =
        (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY);
      const signedArea = polygonSignedArea(pl);
      const isHole = signedArea < 0;
      const isSecondary =
        isPunctuationGlyph ||
        length < lengthThreshold ||
        boundsArea < areaThreshold;

      contours.push({
        id: `word${currentWordIndex}-glyph${i}-contour${contourIndex}`,
        points: pl,
        length,
        bounds,
        boundsArea,
        glyphIndex: i,
        wordIndex: currentWordIndex,
        signedArea,
        isHole,
        isSecondary,
        isPunctuation: isPunctuationGlyph,
      });

      totalLen += length;
    }

    const advanceWidth =
      glyph.advanceWidth && glyph.advanceWidth > 0
        ? glyph.advanceWidth
        : font.unitsPerEm;
    penX += advanceWidth * scale;

    if (i < glyphs.length - 1) {
      const kern = font.getKerningValue(glyph, glyphs[i + 1]);
      penX += kern * scale;
    }
  }

  const polylines = contours.map((c) => c.points);
  const bounds = computeBounds(polylines);
  return { contours, polylines, totalLen, bounds };
}

function createStrokePlan(
  contours: Contour[],
  totalLen: number,
  durationMs: number,
  text: string,
  imperfectionsEnabled: boolean
): StrokePlan {
  if (!contours.length || totalLen <= 0) {
    return { strokes: [], totalMs: 0 };
  }

  const seed = hashStringToSeed(text);
  const rng = mulberry32(seed || 1);
  const effectiveDuration = durationMs > 0 ? durationMs : Math.max(totalLen, 1);
  const baseSpeed = totalLen / Math.max(effectiveDuration, 1);

  const wordGroups = new Map<
    number,
    {
      primaries: Contour[];
      secondaries: Contour[];
      baselineDrift: Pt;
    }
  >();

  for (const contour of contours) {
    const existing = wordGroups.get(contour.wordIndex) ?? {
      primaries: [],
      secondaries: [],
      baselineDrift: { x: 0, y: 0 },
    };
    if (!wordGroups.has(contour.wordIndex)) {
      existing.baselineDrift = imperfectionsEnabled
        ? {
            x: randomBetween(rng, -1, 1),
            y: randomBetween(rng, -1, 1),
          }
        : { x: 0, y: 0 };
    }
    if (contour.isSecondary) existing.secondaries.push(contour);
    else existing.primaries.push(contour);
    wordGroups.set(contour.wordIndex, existing);
  }

  const sortContours = (items: Contour[]) =>
    items.sort((a, b) => {
      if (a.glyphIndex !== b.glyphIndex) {
        return a.glyphIndex - b.glyphIndex;
      }
      if (a.isHole !== b.isHole) {
        return Number(a.isHole) - Number(b.isHole);
      }
      return b.boundsArea - a.boundsArea;
    });

  const wordIndices = Array.from(wordGroups.keys()).sort((a, b) => a - b);

  const strokes: Stroke[] = [];
  let cursor = 0;
  let lastWordIndex: number | null = null;
  const scheduleContour = (
    contour: Contour,
    kind: "main" | "secondary",
    baselineDrift: Pt,
    isLastInWord: boolean
  ) => {
    const length = contour.length;
    const durationMultiplier = lerp(0.8, 1.2, rng());
    const baseDuration =
      baseSpeed > 0 ? length / baseSpeed : length / Math.max(totalLen, 1);
    const durationMsForStroke = Math.max(baseDuration * durationMultiplier, 24);
    const isNewWord =
      lastWordIndex === null || contour.wordIndex !== lastWordIndex;
    let pauseBeforeMs = 0;
    if (strokes.length > 0) {
      if (isNewWord) {
        pauseBeforeMs = randomBetween(rng, 120, 250);
      } else if (contour.isPunctuation) {
        pauseBeforeMs = randomBetween(rng, 60, 140);
      } else {
        pauseBeforeMs = randomBetween(rng, 10, 60);
        if (kind === "secondary") {
          pauseBeforeMs += randomBetween(rng, 40, 110);
        }
      }
    }

    cursor += pauseBeforeMs;
    const startMs = cursor;
    cursor += durationMsForStroke;

    const offsets = imperfectionsEnabled
      ? {
          start: randomOffset(rng, 0.8),
          mid: randomOffset(rng, 0.6),
          end: randomOffset(rng, 0.8),
        }
      : ZERO_OFFSETS;
    const poolingStrength = imperfectionsEnabled
      ? randomBetween(rng, 0.05, 0.32)
      : 0;
    const overshootPx = imperfectionsEnabled
      ? kind === "secondary"
        ? randomBetween(rng, 1.5, 4)
        : randomBetween(rng, 2, 6)
      : 0;
    const endDirection = getEndDirection(contour.points);

    let flourish: { points: Polyline; length: number } | undefined;
    if (
      imperfectionsEnabled &&
      isLastInWord &&
      kind === "main" &&
      rng() < 0.35
    ) {
      const flourishPath = createFlourishPath(
        contour.points[contour.points.length - 1],
        endDirection,
        rng
      );
      if (flourishPath) {
        flourish = flourishPath;
      }
    }

    strokes.push({
      id: contour.id,
      points: contour.points,
      length,
      startMs,
      durationMs: durationMsForStroke,
      pauseBeforeMs,
      wordBoundary: isNewWord,
      kind,
      wordIndex: contour.wordIndex,
      baselineDrift,
      offsets,
      poolingStrength,
      overshootPx,
      endDirection,
      flourish,
    });
    lastWordIndex = contour.wordIndex;
  };

  for (const wordIndex of wordIndices) {
    const group = wordGroups.get(wordIndex);
    if (!group) continue;
    const orderedPrimaries = sortContours(group.primaries).map((contour) => ({
      contour,
      kind: "main" as const,
    }));
    const orderedSecondaries = sortContours(group.secondaries).map(
      (contour) => ({
        contour,
        kind: "secondary" as const,
      })
    );
    const orderedContours = [...orderedPrimaries, ...orderedSecondaries];
    orderedContours.forEach(({ contour, kind }, idx) => {
      const isLastInWord = idx === orderedContours.length - 1;
      scheduleContour(contour, kind, group.baselineDrift, isLastInWord);
    });
  }

  const totalMs = cursor;
  return { strokes, totalMs };
}

type WandyHandProps = {
  text: string;
  fontUrl?: string;
  fontSize?: number;
  durationMs?: number;
  strokeWidth?: number;
  penOpacity?: number;
  strokeColor?: string;
  lineCap?: string;
  lineJoin?: string;
  samplesPerCurve?: number;
  strokeMode?: string;
  canvasPadding?: number;
  backgroundColor?: string;
  imperfectionsEnabled?: boolean;
  size?: number | string;
  animate?: boolean;
  onDrawn?: () => void;
};

export const WANDY_HAND_DEFAULTS = {
  fontSize: 160,
  durationMs: 2200,
  strokeWidth: 3.2,
  penOpacity: 1,
  strokeColor: "#fff",
  lineCap: "round",
  lineJoin: "round",
  samplesPerCurve: 5,
  strokeMode: "outline",
  canvasPadding: 8,
  backgroundColor: "transparent",
  imperfectionsEnabled: false,
  animate: true,
} as const;

export default function WandyHand({
  text = "",
  fontUrl,
  fontSize,
  durationMs = WANDY_HAND_DEFAULTS.durationMs,
  strokeWidth = WANDY_HAND_DEFAULTS.strokeWidth,
  penOpacity = WANDY_HAND_DEFAULTS.penOpacity,
  strokeColor = WANDY_HAND_DEFAULTS.strokeColor,
  lineCap = WANDY_HAND_DEFAULTS.lineCap,
  lineJoin = WANDY_HAND_DEFAULTS.lineJoin,
  samplesPerCurve = WANDY_HAND_DEFAULTS.samplesPerCurve,
  strokeMode = WANDY_HAND_DEFAULTS.strokeMode,
  canvasPadding = WANDY_HAND_DEFAULTS.canvasPadding,
  backgroundColor = WANDY_HAND_DEFAULTS.backgroundColor,
  imperfectionsEnabled = WANDY_HAND_DEFAULTS.imperfectionsEnabled,
  size,
  animate = WANDY_HAND_DEFAULTS.animate,
  onDrawn,
}: WandyHandProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [font, setFont] = useState<Font | null>(null);
  const resolvedFontUrl = fontUrl ?? waltographUrl;
  const onDrawnRef = useRef(onDrawn);
  const drawRunRef = useRef(0);
  const drawNotifiedRef = useRef(false);
  const resolvedFontSize =
    typeof fontSize === "number" && fontSize > 0 ? fontSize : 160;
  const sizeValue =
    size !== undefined
      ? typeof size === "number"
        ? `${Math.max(0, size)}px`
        : `${size}`
      : null;

  const LINE_CAP_MAP: Record<string, CanvasLineCap> = {
    round: "round",
    butt: "butt",
    square: "square",
  };

  const LINE_JOIN_MAP: Record<string, CanvasLineJoin> = {
    round: "round",
    miter: "miter",
    bevel: "bevel",
  };

  const STROKE_MODE_MAP: Record<string, "outline" | "full"> = {
    outline: "outline",
    "outline reveal": "outline",
    "full stroke": "full",
    full: "full",
  };

  const normalizeLineCap = (value?: string | null): CanvasLineCap => {
    if (!value) return "round";
    const lower = value.toLowerCase();
    return LINE_CAP_MAP[lower] ?? "round";
  };

  const normalizeLineJoin = (value?: string | null): CanvasLineJoin => {
    if (!value) return "round";
    const lower = value.toLowerCase();
    return LINE_JOIN_MAP[lower] ?? "round";
  };

  const normalizeStrokeMode = (value?: string | null): "outline" | "full" => {
    if (!value) return "outline";
    const lower = value.toLowerCase();
    return STROKE_MODE_MAP[lower] ?? "outline";
  };

  const resolvedLineCap = normalizeLineCap(lineCap);
  const resolvedLineJoin = normalizeLineJoin(lineJoin);
  const resolvedStrokeMode = normalizeStrokeMode(strokeMode);
  const resolvedSamplesPerCurve = resolveCurveSamples(samplesPerCurve);

  useEffect(() => {
    onDrawnRef.current = onDrawn;
  }, [onDrawn]);

  useEffect(() => {
    let cancelled = false;
    const loadFont = async () => {
      try {
        const response = await fetch(resolvedFontUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to load font (${response.status} ${response.statusText})`
          );
        }
        const contentType = response.headers.get("content-type") ?? "";
        if (
          contentType &&
          !contentType.includes("font") &&
          !contentType.includes("application/octet-stream") &&
          !resolvedFontUrl.startsWith("data:")
        ) {
          throw new Error(
            `Unexpected font content-type "${contentType}" for ${resolvedFontUrl}`
          );
        }
        const buffer = await response.arrayBuffer();
        const loaded = opentype.parse(buffer);
        if (!cancelled) setFont(loaded);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setFont(null);
        }
      }
    };

    loadFont();
    return () => {
      cancelled = true;
    };
  }, [resolvedFontUrl]);

  const prepared = useMemo(() => {
    if (!font) return null;
    const safeText = typeof text === "string" ? text : "";
    const safe = safeText.trim().length ? safeText : " ";
    return prepareText(font, safe, resolvedFontSize, resolvedSamplesPerCurve);
  }, [font, text, resolvedFontSize, resolvedSamplesPerCurve]);

  const aspectRatio = useMemo(() => {
    if (!prepared) return null;
    const width = prepared.bounds.maxX - prepared.bounds.minX;
    const height = prepared.bounds.maxY - prepared.bounds.minY;
    return width > 0 && height > 0 ? width / height : null;
  }, [prepared]);

  const strokePlan = useMemo(() => {
    if (!prepared) return null;
    const safeText = typeof text === "string" ? text : "";
    const safe = safeText.trim().length ? safeText : " ";
    return createStrokePlan(
      prepared.contours,
      prepared.totalLen,
      durationMs,
      safe,
      imperfectionsEnabled
    );
  }, [prepared, durationMs, text, imperfectionsEnabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !prepared || !strokePlan) return;

    drawRunRef.current += 1;
    drawNotifiedRef.current = false;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const safeCanvas = canvas;
    const safeCtx = ctx;
    const { polylines, bounds } = prepared;
    const { strokes, totalMs } = strokePlan;
    const textW = bounds.maxX - bounds.minX;
    const textH = bounds.maxY - bounds.minY;
    const targetAspect = textW > 0 && textH > 0 ? textW / textH : null;

    function resize() {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const host = safeCanvas.parentElement ?? safeCanvas;
      const rect = host.getBoundingClientRect();
      let nextWidth = rect.width;
      let nextHeight = rect.height;

      if (targetAspect) {
        const rectAspect = rect.width / Math.max(rect.height, 1);
        if (rectAspect > targetAspect) {
          nextWidth = rect.height * targetAspect;
          nextHeight = rect.height;
        } else {
          nextWidth = rect.width;
          nextHeight = rect.width / targetAspect;
        }
      }

      safeCanvas.style.width = `${Math.max(1, nextWidth)}px`;
      safeCanvas.style.height = `${Math.max(1, nextHeight)}px`;
      safeCanvas.width = Math.floor(Math.max(1, nextWidth) * dpr);
      safeCanvas.height = Math.floor(Math.max(1, nextHeight) * dpr);
      safeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!animate) {
        renderFrame(Number.POSITIVE_INFINITY, 1);
        rafRef.current = null;
        return;
      }
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(draw);
      }
    }

    resize();
    window.addEventListener("resize", resize);

    const start = performance.now();
    const totalTimeline = totalMs > 0 ? totalMs : Math.max(durationMs, 1);

    function renderFrame(timelineElapsed: number, timelineProgress: number) {
      safeCtx.clearRect(0, 0, safeCanvas.width, safeCanvas.height);

      safeCtx.lineCap = resolvedLineCap;
      safeCtx.lineJoin = resolvedLineJoin;
      safeCtx.lineWidth = strokeWidth;
      safeCtx.globalAlpha = penOpacity;
      safeCtx.strokeStyle = strokeColor;

      const pad = canvasPadding;
      const viewW = safeCanvas.clientWidth;
      const viewH = safeCanvas.clientHeight;

      const scaleToFit = Math.min(
        (viewW - pad * 2) / (textW || 1),
        (viewH - pad * 2) / (textH || 1)
      );
      const scale = sizeValue === null ? scaleToFit : Math.min(1, scaleToFit);

      const cx = viewW / 2;
      const cy = viewH / 2;

      safeCtx.save();
      safeCtx.translate(cx, cy);
      safeCtx.scale(scale, scale);
      safeCtx.translate(-(bounds.minX + textW / 2), -(bounds.minY + textH / 2));

      const filledContours: Polyline[] = [];

      for (const stroke of strokes) {
        if (!stroke.points.length || stroke.length <= 0) continue;
        const strokeStart = stroke.startMs;
        const strokeEnd = stroke.startMs + stroke.durationMs;

        if (timelineElapsed >= strokeEnd) {
          drawPolylineStamped(
            safeCtx,
            stroke.points,
            stroke.length,
            stroke.length,
            strokeWidth,
            strokeColor,
            stroke.baselineDrift,
            stroke.offsets,
            stroke.poolingStrength
          );
          if (resolvedStrokeMode === "full") {
            filledContours.push(stroke.points);
          }
          const lastPoint = stroke.points[stroke.points.length - 1];
          const tipPoint = {
            x: lastPoint.x + stroke.baselineDrift.x + stroke.offsets.end.x,
            y: lastPoint.y + stroke.baselineDrift.y + stroke.offsets.end.y,
          };
          drawOvershootTail(
            safeCtx,
            tipPoint,
            stroke.endDirection,
            stroke.overshootPx,
            strokeWidth,
            strokeColor
          );
          if (stroke.flourish) {
            drawPolylineStamped(
              safeCtx,
              stroke.flourish.points,
              stroke.flourish.length,
              stroke.flourish.length,
              strokeWidth * 0.9,
              strokeColor,
              stroke.baselineDrift,
              ZERO_OFFSETS,
              stroke.poolingStrength * 0.5
            );
          }
          continue;
        }

        if (timelineElapsed >= strokeStart) {
          const localElapsed = timelineElapsed - strokeStart;
          const localTLinear = Math.min(
            1,
            localElapsed / Math.max(stroke.durationMs, 1)
          );
          const easedT = easeInOut(localTLinear);
          const partialLen = stroke.length * easedT;
          drawPolylineStamped(
            safeCtx,
            stroke.points,
            partialLen,
            stroke.length,
            strokeWidth,
            strokeColor,
            stroke.baselineDrift,
            stroke.offsets,
            stroke.poolingStrength
          );
        }
        break;
      }

      if (resolvedStrokeMode === "full") {
        const contoursToFill =
          timelineProgress >= 1 ? polylines : filledContours;
        if (contoursToFill.length) {
          safeCtx.save();
          safeCtx.fillStyle = strokeColor;
          safeCtx.beginPath();
          for (const pl of contoursToFill) {
            if (!pl.length) continue;
            safeCtx.moveTo(pl[0].x, pl[0].y);
            for (let i = 1; i < pl.length; i++) {
              safeCtx.lineTo(pl[i].x, pl[i].y);
            }
            safeCtx.closePath();
          }
          safeCtx.fill("evenodd");
          safeCtx.restore();
        }
      }

      safeCtx.restore();
      if (timelineProgress >= 1 && !drawNotifiedRef.current) {
        drawNotifiedRef.current = true;
        onDrawnRef.current?.();
      }
    }

    function draw(now: number) {
      const elapsedRaw = now - start;
      const timelineElapsed = Math.min(elapsedRaw, totalTimeline);
      const timelineProgress =
        totalTimeline > 0 ? timelineElapsed / totalTimeline : 1;

      renderFrame(timelineElapsed, timelineProgress);

      if (timelineProgress < 1) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        rafRef.current = null;
      }
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (animate) {
      rafRef.current = requestAnimationFrame(draw);
    } else {
      renderFrame(Number.POSITIVE_INFINITY, 1);
      rafRef.current = null;
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [
    prepared,
    strokePlan,
    durationMs,
    strokeWidth,
    strokeColor,
    canvasPadding,
    resolvedLineCap,
    resolvedLineJoin,
    penOpacity,
    resolvedStrokeMode,
    sizeValue,
    animate,
  ]);

  return (
    <div
      className="flex w-full flex-col text-white"
      style={{
        background: backgroundColor,
        ...(sizeValue ? { width: sizeValue } : null),
        ...(aspectRatio ? { aspectRatio } : null),
      }}
    >
      <div className="relative flex flex-1 items-center justify-center">
        <canvas ref={canvasRef} style={{ display: "block" }} />
      </div>
    </div>
  );
}
