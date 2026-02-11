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

    const moveTarget: HTMLElement | Window = element ?? window;
    moveTarget.addEventListener("mousemove", handleMouseMove);
    moveTarget.addEventListener("mouseleave", handleMouseLeave);
    if (element) {
      element.addEventListener("mouseenter", updateRect);
    }
    if (hasWindow) {
      window.addEventListener("resize", handleResize);
    }

    return () => {
      moveTarget.removeEventListener("mousemove", handleMouseMove);
      moveTarget.removeEventListener("mouseleave", handleMouseLeave);
      if (element) {
        element.removeEventListener("mouseenter", updateRect);
      }
      if (hasWindow) {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, [center?.x, center?.y, enabled, elementRef, mouse]);

  return mouse;
}
