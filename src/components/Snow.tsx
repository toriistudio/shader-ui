"use client";

import { useCallback, useEffect, useRef, type ComponentProps } from "react";
import * as THREE from "three";

import useScene, { type SceneContext } from "@/hooks/useScene";
import fragmentShader from "@/shaders/snow/fragment.glsl";
import vertexShader from "@/shaders/snow/vertex.glsl";

export type SnowUniforms = {
  color: string;
  fallSpeed: number;
  windStrength: number;
  turbulence: number;
  flakeSize: number;
  twinkleStrength: number;
  flakeCount: number;
};

type SnowProps = SnowUniforms &
  Omit<ComponentProps<"div">, keyof SnowUniforms | "ref" | "width" | "height"> & {
    width?: string | number;
    height?: string | number;
    mouseWindInteraction?: boolean;
  };

const AREA_BOUNDS = {
  width: 36,
  height: 44,
  depth: 26,
};

type SnowUniformValues = {
  uTime: { value: number };
  uFallSpeed: { value: number };
  uWindStrength: { value: number };
  uTurbulence: { value: number };
  uSize: { value: number };
  uTwinkleStrength: { value: number };
  uColor: { value: THREE.Color };
  uArea: { value: THREE.Vector3 };
};

type SnowAssets = {
  points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  uniforms: SnowUniformValues;
};

type PointerState = {
  lastX: number;
  lastTime: number;
  timeoutId: number | null;
};

function createSnowGeometry(count: number) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const seeds = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const x = (Math.random() - 0.5) * AREA_BOUNDS.width;
    const y = (Math.random() - 0.5) * AREA_BOUNDS.height;
    const z = (Math.random() - 0.5) * AREA_BOUNDS.depth;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    speeds[i] = Math.random();
    sizes[i] = Math.random();
    seeds[i] = Math.random() * 100;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.computeBoundingSphere();

  return geometry;
}

function buildUniforms({
  color,
  fallSpeed,
  windStrength,
  turbulence,
  flakeSize,
  twinkleStrength,
}: SnowUniforms): SnowUniformValues {
  return {
    uTime: { value: 0 },
    uFallSpeed: { value: fallSpeed },
    uWindStrength: { value: windStrength },
    uTurbulence: { value: turbulence },
    uSize: { value: flakeSize },
    uTwinkleStrength: { value: twinkleStrength },
    uColor: { value: new THREE.Color(color) },
    uArea: {
      value: new THREE.Vector3(
        AREA_BOUNDS.width,
        AREA_BOUNDS.height,
        AREA_BOUNDS.depth
      ),
    },
  };
}

export default function Snow({
  className,
  style,
  width,
  height,
  color,
  fallSpeed,
  windStrength,
  turbulence,
  flakeSize,
  twinkleStrength,
  flakeCount,
  mouseWindInteraction = false,
  ...divProps
}: SnowProps) {
  const snowRef = useRef<SnowAssets | null>(null);
  const uniformsRef = useRef<SnowUniforms>({
    color,
    fallSpeed,
    windStrength,
    turbulence,
    flakeSize,
    twinkleStrength,
    flakeCount,
  });
  uniformsRef.current = {
    color,
    fallSpeed,
    windStrength,
    turbulence,
    flakeSize,
    twinkleStrength,
    flakeCount,
  };
  const pointerWindOffsetRef = useRef(0);
  const pointerWindTargetRef = useRef(0);
  const pointerStateRef = useRef<PointerState>({
    lastX: 0,
    lastTime: 0,
    timeoutId: null,
  });
  const pointerActiveRef = useRef(false);
  const baseWindRef = useRef(windStrength);

  useEffect(() => {
    baseWindRef.current = windStrength;
  }, [windStrength]);

  const handleCreate = useCallback(({ scene }: SceneContext) => {
    const uniforms = buildUniforms(uniformsRef.current);
    const geometry = createSnowGeometry(
      Math.max(1, Math.floor(uniformsRef.current.flakeCount))
    );
    const material = new THREE.ShaderMaterial({
      fragmentShader,
      vertexShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);

    snowRef.current = { points, geometry, material, uniforms };

    return () => {
      scene.remove(points);
      geometry.dispose();
      material.dispose();
      snowRef.current = null;
    };
  }, []);

  const handleRender = useCallback(
    (_context: SceneContext, delta: number, elapsedTime: number) => {
      const assets = snowRef.current;
      if (!assets) return;

      assets.uniforms.uTime.value = elapsedTime;
      const currentOffset = pointerWindOffsetRef.current;
      const targetOffset = pointerWindTargetRef.current;
      const nextOffset = THREE.MathUtils.damp(
        currentOffset,
        targetOffset,
        3.5,
        delta
      );

      if (Math.abs(nextOffset - currentOffset) > 0.00005) {
        pointerWindOffsetRef.current = nextOffset;
        assets.uniforms.uWindStrength.value =
          baseWindRef.current + nextOffset;
      }
    },
    []
  );

  const { containerRef } = useScene({
    camera: {
      position: [0, 0, 18],
    },
    onCreate: handleCreate,
    onRender: handleRender,
  });

  useEffect(() => {
    const assets = snowRef.current;
    if (!assets) return;
    assets.uniforms.uColor.value.set(color);
  }, [color]);

  useEffect(() => {
    const assets = snowRef.current;
    if (!assets) return;
    assets.uniforms.uFallSpeed.value = fallSpeed;
  }, [fallSpeed]);

  useEffect(() => {
    const assets = snowRef.current;
    if (!assets) return;
    assets.uniforms.uWindStrength.value =
      windStrength + pointerWindOffsetRef.current;
  }, [windStrength]);

  useEffect(() => {
    const assets = snowRef.current;
    if (!assets) return;
    assets.uniforms.uTurbulence.value = turbulence;
  }, [turbulence]);

  useEffect(() => {
    const assets = snowRef.current;
    if (!assets) return;
    assets.uniforms.uSize.value = flakeSize;
  }, [flakeSize]);

  useEffect(() => {
    const assets = snowRef.current;
    if (!assets) return;
    assets.uniforms.uTwinkleStrength.value = twinkleStrength;
  }, [twinkleStrength]);

  useEffect(() => {
    const assets = snowRef.current;
    if (!assets) return;

    const geometry = createSnowGeometry(Math.max(1, Math.floor(flakeCount)));
    assets.points.geometry.dispose();
    assets.points.geometry = geometry;
    assets.geometry = geometry;
  }, [flakeCount]);

  useEffect(() => {
    const pointerState = pointerStateRef.current;
    const clearTimeoutIfNeeded = () => {
      if (pointerState.timeoutId !== null) {
        window.clearTimeout(pointerState.timeoutId);
        pointerState.timeoutId = null;
      }
    };

    if (!mouseWindInteraction) {
      clearTimeoutIfNeeded();
      pointerWindOffsetRef.current = 0;
      pointerWindTargetRef.current = 0;
      pointerState.lastTime = 0;
      pointerActiveRef.current = false;
      const assets = snowRef.current;
      if (assets) {
        assets.uniforms.uWindStrength.value = windStrength;
      }
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const scheduleReset = () => {
      clearTimeoutIfNeeded();
      pointerState.timeoutId = window.setTimeout(() => {
        pointerWindTargetRef.current = 0;
        pointerState.timeoutId = null;
      }, 220);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const isMouse = event.pointerType === "mouse";
      if (!isMouse && !pointerActiveRef.current) return;
      const now = performance.now();
      if (pointerState.lastTime === 0) {
        pointerState.lastX = event.clientX;
        pointerState.lastTime = now;
        return;
      }

      const dx = event.clientX - pointerState.lastX;
      const dt = Math.max(1, now - pointerState.lastTime);
      const velocity = dx / dt; // px per ms
      const offset = THREE.MathUtils.clamp(velocity * 0.9, -1.6, 1.6);

      pointerWindTargetRef.current = offset;
      pointerState.lastX = event.clientX;
      pointerState.lastTime = now;
      scheduleReset();
    };

    const handlePointerDown = (event: PointerEvent) => {
      pointerActiveRef.current = true;
      pointerState.lastX = event.clientX;
      pointerState.lastTime = performance.now();
      scheduleReset();
    };

    const handlePointerUp = () => {
      pointerActiveRef.current = false;
      pointerState.lastTime = 0;
      pointerWindTargetRef.current = 0;
      scheduleReset();
    };

    const handlePointerLeave = () => {
      pointerActiveRef.current = false;
      pointerState.lastTime = 0;
      pointerWindTargetRef.current = 0;
      clearTimeoutIfNeeded();
    };

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointerup", handlePointerUp);
    container.addEventListener("pointercancel", handlePointerUp);
    container.addEventListener("pointerout", handlePointerLeave);
    container.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointerup", handlePointerUp);
      container.removeEventListener("pointercancel", handlePointerUp);
      container.removeEventListener("pointerout", handlePointerLeave);
      container.removeEventListener("pointerleave", handlePointerLeave);
      pointerState.lastTime = 0;
      pointerWindOffsetRef.current = 0;
      pointerWindTargetRef.current = 0;
      pointerActiveRef.current = false;
      clearTimeoutIfNeeded();
      const assets = snowRef.current;
      if (assets) {
        assets.uniforms.uWindStrength.value = windStrength;
      }
    };
  }, [containerRef, mouseWindInteraction, windStrength]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: width ?? "100%",
        height: height ?? "100%",
        ...style,
      }}
      {...divProps}
    />
  );
}
