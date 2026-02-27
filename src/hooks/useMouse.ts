"use client";

import { RefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type UseMouseOptions = {
  elementRef?: RefObject<HTMLElement>;
  enabled: boolean;
  center?: { x: number; y: number };
};

export default function useMouse({
  elementRef,
  enabled,
  center,
}: UseMouseOptions) {
  const mouse = useMemo(
    () => new THREE.Vector2(center?.x ?? 0.5, center?.y ?? 0.5),
    [center?.x, center?.y],
  );
  const rectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    const element = elementRef?.current ?? null;
    const hasWindow = typeof window !== "undefined";
    const fallbackRect = () => ({
      left: 0,
      top: 0,
      width: hasWindow ? window.innerWidth : 0,
      height: hasWindow ? window.innerHeight : 0,
    });

    if (!element && !hasWindow) return;

    if (!enabled) {
      mouse.set(center?.x ?? 0.5, center?.y ?? 0.5);
      return;
    }

    const updateRect = () => {
      if (element) {
        rectRef.current = element.getBoundingClientRect();
        return;
      }
      const rect = fallbackRect();
      rectRef.current = rect as DOMRect;
    };

    updateRect();

    const handleMouseMove = (event: MouseEvent) => {
      const rect = rectRef.current;
      if (!rect || rect.width === 0 || rect.height === 0) {
        return;
      }
      const mouseX = (event.clientX - rect.left) / rect.width;
      const mouseY = 1 - (event.clientY - rect.top) / rect.height;

      mouse.set(
        Math.min(1, Math.max(0, mouseX)),
        Math.min(1, Math.max(0, mouseY)),
      );
    };

    const handleResize = () => {
      updateRect();
    };

    const handleMouseLeave = () => {
      mouse.set(center?.x ?? 0.5, center?.y ?? 0.5);
    };

    if (element) {
      element.addEventListener("mousemove", handleMouseMove);
      element.addEventListener("mouseleave", handleMouseLeave);
      element.addEventListener("mouseenter", updateRect);
    } else if (hasWindow) {
      window.addEventListener("mousemove", handleMouseMove);
    }
    if (hasWindow) {
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (element) {
        element.removeEventListener("mousemove", handleMouseMove);
        element.removeEventListener("mouseleave", handleMouseLeave);
        element.removeEventListener("mouseenter", updateRect);
      } else if (hasWindow) {
        window.removeEventListener("mousemove", handleMouseMove);
      }
      if (hasWindow) {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, [center?.x, center?.y, enabled, elementRef, mouse]);

  return mouse;
}
