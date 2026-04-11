"use client";

import { useCallback, useMemo, useRef } from "react";
import * as THREE from "three";

import ShaderPass from "@/components/ShaderPass";
import fragmentShader from "@/shaders/dense-fluid/fragment.glsl";
import vertexShader from "@/shaders/dense-fluid/vertex.glsl";

const NUM_RIPPLES = 6;

type DenseFluidProps = {
  width?: string | number;
  height?: string | number;
  className?: string;
  timeScale?: number;
  ampDecay?: number;
  ripple?: boolean;
  color?: string;
};

export default function DenseFluid({
  width,
  height,
  className,
  timeScale = 0.15,
  ampDecay = 0.48,
  ripple = true,
  color,
}: DenseFluidProps) {
  const nextSlotRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
      uTimeScale: { value: timeScale },
      uAmpDecay: { value: ampDecay },
      uRippleOrigins: {
        value: Array.from(
          { length: NUM_RIPPLES },
          () => new THREE.Vector2(0, 0),
        ),
      },
      uRippleStarts: {
        value: new Array<number>(NUM_RIPPLES).fill(-1),
      },
      uColor: { value: new THREE.Color(0, 0, 0) },
      uHasColor: { value: 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  uniforms.uTimeScale.value = timeScale;
  uniforms.uAmpDecay.value = ampDecay;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!ripple) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;

      const slot = nextSlotRef.current;
      const origins = uniforms.uRippleOrigins.value as THREE.Vector2[];
      const starts = uniforms.uRippleStarts.value as number[];
      origins[slot].set(x, y);
      starts[slot] = uniforms.uTime.value;
      nextSlotRef.current = (slot + 1) % NUM_RIPPLES;
    },
    [ripple, uniforms],
  );

  const parsedColor = useMemo(
    () => (color ? new THREE.Color(color) : null),
    [color],
  );

  if (parsedColor) {
    (uniforms.uColor.value as THREE.Color).copy(parsedColor);
    uniforms.uHasColor.value = 1;
  } else {
    uniforms.uHasColor.value = 0;
  }

  return (
    <ShaderPass
      className={className}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={uniforms}
      clearColor={0x0a0a0a}
      timeUniform="uTime"
      resolutionUniform="uResolution"
      priority={1}
      width={width}
      height={height}
      onPointerDown={ripple ? handlePointerDown : undefined}
      style={ripple ? { cursor: "pointer" } : undefined}
    />
  );
}
