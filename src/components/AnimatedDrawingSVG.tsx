"use client";

import clsx from "clsx";
import { useEffect, useLayoutEffect, useRef, type ComponentProps } from "react";

type AnimatedDrawingSVGProps = {
  svgMarkup: string;
  animated?: boolean;
  size?: number | string;
  onAnimated?: () => void;
  delay?: number;
} & Omit<ComponentProps<"div">, "children">;

type SVGDrawingElement = SVGGeometryElement & Element;
const PATH_SELECTOR = "path, line, polyline, polygon, circle, ellipse";

export default function AnimatedDrawingSVG({
  svgMarkup,
  animated = true,
  size,
  onAnimated,
  delay,
  className,
  style,
  ...divProps
}: AnimatedDrawingSVGProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationsRef = useRef<Animation[]>([]);
  const parserRef = useRef<DOMParser | null>(null);
  const onAnimatedRef = useRef(onAnimated);
  const animationRunIdRef = useRef(0);
  const onAnimationCompleteRef = useRef(false);
  const timeoutRef = useRef<number[]>([]);
  const monitorRafRef = useRef<number | null>(null);
  const sanitizedMarkup = (svgMarkup ?? "").toString().trim();
  const normalizedDelay =
    typeof delay === "number" && delay > 0 ? delay : 0;

  useEffect(() => {
    onAnimatedRef.current = onAnimated;
  }, [onAnimated]);

  useEffect(() => {
    return () => {
      animationsRef.current.forEach((animation) => animation.cancel());
      animationsRef.current = [];
      timeoutRef.current.forEach((id) => window.clearTimeout(id));
      timeoutRef.current = [];
      if (monitorRafRef.current !== null) {
        cancelAnimationFrame(monitorRafRef.current);
        monitorRafRef.current = null;
      }
    };
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;
    let delayId: number | null = null;
    let started = false;

    if (normalizedDelay > 0) {
      container.style.visibility = "hidden";
    } else {
      container.style.removeProperty("visibility");
    }

    animationRunIdRef.current += 1;
    const currentRunId = animationRunIdRef.current;
    onAnimationCompleteRef.current = false;
    timeoutRef.current.forEach((id) => window.clearTimeout(id));
    timeoutRef.current = [];

    const markComplete = () => {
      if (
        animationRunIdRef.current === currentRunId &&
        !onAnimationCompleteRef.current
      ) {
        onAnimationCompleteRef.current = true;
        onAnimatedRef.current?.();
      }
    };

    animationsRef.current.forEach((animation) => animation.cancel());
    animationsRef.current = [];
    if (monitorRafRef.current !== null) {
      cancelAnimationFrame(monitorRafRef.current);
      monitorRafRef.current = null;
    }

    if (!sanitizedMarkup) {
      container.replaceChildren();
      markComplete();
      return;
    }

    const parser = parserRef.current ?? new DOMParser();
    parserRef.current = parser;

    let parsed: Document;
    try {
      parsed = parser.parseFromString(sanitizedMarkup, "image/svg+xml");
    } catch {
      return;
    }

    if (parsed.querySelector("parsererror")) {
      return;
    }

    const parsedSvg = parsed.querySelector("svg");
    if (!parsedSvg) {
      container.replaceChildren();
      onAnimatedRef.current?.();
      return;
    }

    const svgElement = document.importNode(parsedSvg, true) as SVGSVGElement;
    svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet");
    if (size !== undefined) {
      svgElement.removeAttribute("width");
      svgElement.removeAttribute("height");
      const sizeValue =
        typeof size === "number" ? `${Math.max(0, size)}px` : `${size}`;
      svgElement.style.width = sizeValue;
      svgElement.style.height = "auto";
    } else {
      svgElement.style.width = "100%";
      svgElement.style.height = "100%";
      svgElement.style.maxWidth = "100%";
      svgElement.style.maxHeight = "100%";
    }
    svgElement.style.display = "block";

    container.replaceChildren(svgElement);

    const runAnimations = () => {
      const drawTargets = Array.from(
        svgElement.querySelectorAll<SVGDrawingElement>(PATH_SELECTOR)
      );
      const scheduleFallback = (delay: number) => {
        const fallbackId = window.setTimeout(markComplete, delay);
        timeoutRef.current.push(fallbackId);
      };

      if (!drawTargets.length) {
        if (!animated) {
          markComplete();
        } else {
          Promise.resolve().then(() => {
            markComplete();
          });
        }
        return;
      }

      let maxDuration = 0;

      const resolveTimingValue = (
        value: number | string | CSSNumericValue | undefined,
        fallback: number
      ) => {
        if (typeof value === "number") {
          return value;
        }
        if (typeof value === "string") {
          const parsed = Number.parseFloat(value);
          return Number.isFinite(parsed) ? parsed : fallback;
        }
        if (typeof value === "object" && value !== null) {
          const parsed = Number.parseFloat(value.toString());
          return Number.isFinite(parsed) ? parsed : fallback;
        }
        return fallback;
      };

      drawTargets.forEach((element, index) => {
        const length =
          typeof element.getTotalLength === "function"
            ? element.getTotalLength()
            : null;

        if (!length || Number.isNaN(length)) {
          element.style.removeProperty("stroke-dasharray");
          element.style.removeProperty("stroke-dashoffset");
          return;
        }

        const dashValue = `${length}`;
        element.style.strokeDasharray = dashValue;
        element.style.strokeDashoffset = animated ? dashValue : "0";
        if (!element.style.strokeLinecap) {
          element.style.strokeLinecap = "round";
        }

        if (!animated) {
          return;
        }

        const animation = element.animate(
          [{ strokeDashoffset: dashValue }, { strokeDashoffset: "0" }],
          {
            duration: Math.min(6500, Math.max(1200, length * 12)),
            delay: index * 120,
            easing: "ease-in-out",
            fill: "forwards",
          }
        );
        const timing = animation.effect?.getTiming();
        const baseDuration = Math.min(6500, Math.max(1200, length * 12));
        const total =
          resolveTimingValue(timing?.delay, index * 120) +
          resolveTimingValue(timing?.duration, baseDuration);
        if (total > maxDuration) {
          maxDuration = total;
        }
        animationsRef.current.push(animation);
      });

      if (!animated) {
        markComplete();
        return;
      }

      const startMonitor = () => {
        const monitor = () => {
          if (animationRunIdRef.current !== currentRunId) {
            return;
          }
          const allFinished = animationsRef.current.every((animation) => {
            const state = animation.playState;
            return state === "finished" || state === "idle";
          });
          if (allFinished) {
            if (monitorRafRef.current !== null) {
              cancelAnimationFrame(monitorRafRef.current);
              monitorRafRef.current = null;
            }
            markComplete();
            return;
          }
          monitorRafRef.current = requestAnimationFrame(monitor);
        };
        if (monitorRafRef.current !== null) {
          cancelAnimationFrame(monitorRafRef.current);
        }
        monitorRafRef.current = requestAnimationFrame(monitor);
      };
      startMonitor();

      if (animated && maxDuration > 0) {
        scheduleFallback(maxDuration + 50);
      }
    };

    const triggerStart = () => {
      if (started) return;
      started = true;
      container.style.removeProperty("visibility");
      rafId = requestAnimationFrame(runAnimations);
    };

    if (normalizedDelay > 0) {
      delayId = window.setTimeout(triggerStart, normalizedDelay);
    } else {
      triggerStart();
    }

    return () => {
      if (delayId !== null) {
        window.clearTimeout(delayId);
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [sanitizedMarkup, animated, size, normalizedDelay]);

  return (
    <div
      ref={containerRef}
      className={clsx(
        "flex items-center justify-center [&_svg]:block",
        className
      )}
      style={{
        ...style,
      }}
      {...divProps}
    />
  );
}
