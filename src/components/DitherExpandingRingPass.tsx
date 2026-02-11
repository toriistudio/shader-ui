"use client";

import { useMemo } from "react";
import * as THREE from "three";
import ShaderPass from "@/components/ShaderPass";
import fragmentShader from "@/shaders/dither-expanding-ring/fragment.glsl";
import vertexShader from "@/shaders/dither-expanding-ring/vertex.glsl";

type ExpandingRingPassProps = {
  target?: THREE.WebGLRenderTarget | null;
  clear?: boolean;
  clearColor?: THREE.ColorRepresentation;
  enabled?: boolean;
  priority?: number;
  uniforms?: Partial<ExpandingRingPassUniforms>;
};

export type ExpandingRingPassUniforms = {
  /** RGB ring color */
  color: [number, number, number];
  /** Center position in UV space */
  position: [number, number];
  /** Ring cycles per second */
  speed: number;
  /** Alpha multiplier */
  alpha: number;
};

const DEFAULTS: ExpandingRingPassUniforms = {
  color: [0.0, 0.50588235, 0.96862745],
  position: [0.5, 0.5],
  speed: 0.2,
  alpha: 1.0,
};


export default function ExpandingRingPass({
  target = null,
  clear = false,
  clearColor = 0x000000,
  enabled = true,
  priority = 0,
  uniforms: uniformsOverride = {},
}: ExpandingRingPassProps) {
  const u = { ...DEFAULTS, ...uniformsOverride };

  const uniforms = useMemo<Record<string, THREE.IUniform>>(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPos: { value: new THREE.Vector2(u.position[0], u.position[1]) },
      uColor: { value: new THREE.Color(u.color[0], u.color[1], u.color[2]) },
      uSpeed: { value: u.speed },
      uAlpha: { value: u.alpha },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  (uniforms.uPos.value as THREE.Vector2).set(u.position[0], u.position[1]);
  (uniforms.uColor.value as THREE.Color).setRGB(
    u.color[0],
    u.color[1],
    u.color[2],
  );
  uniforms.uSpeed.value = u.speed;
  uniforms.uAlpha.value = u.alpha;

  return (
    <ShaderPass
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={uniforms}
      target={target}
      clear={clear}
      clearColor={clearColor}
      enabled={enabled}
      priority={priority}
      transparent
      timeUniform="uTime"
      resolutionUniform="uResolution"
    />
  );
}
