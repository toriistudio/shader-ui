"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import ShaderPass from "@/components/ShaderPass";
import fragmentShader from "@/shaders/dither-border-beam/fragment.glsl";
import vertexShader from "@/shaders/dither-border-beam/vertex.glsl";

export type BorderBeamPassUniforms = {
  /** Border thickness in UV space (Unicorn-ish: 0.02 for inner, 0.08 for outer) */
  thickness: number;
  /** Multiplier on the glow */
  intensity: number;
  /** RGB beam color */
  color: [number, number, number];
  /** Add tiny dithering noise */
  dither: boolean;
  /** Dither strength (default: 1/128) */
  ditherStrength: number;
  /** Apply tanh tonemap (matches Unicorn) */
  tonemap: boolean;
  /** Alpha multiplier (lets you control contribution later) */
  alpha: number;
};

type BorderBeamPassProps = {
  target?: THREE.WebGLRenderTarget | null;
  clear?: boolean;
  clearColor?: THREE.ColorRepresentation;
  enabled?: boolean;
  priority?: number;
  uniforms?: Partial<BorderBeamPassUniforms>;
};

const DEFAULTS: BorderBeamPassUniforms = {
  thickness: 0.02,
  intensity: 1.0,
  color: [0.2705882353, 0.6039215686, 1.0],
  dither: true,
  ditherStrength: 1 / 128,
  tonemap: true,
  alpha: 1.0,
};


export default function BorderBeamPass({
  target = null,
  clear = true,
  clearColor = 0x000000,
  enabled = true,
  priority = 0,
  uniforms: uniformsOverride = {},
}: BorderBeamPassProps) {
  const u = { ...DEFAULTS, ...uniformsOverride };

  const uniforms = useMemo<Record<string, THREE.IUniform>>(
    () => ({
      uThickness: { value: u.thickness },
      uIntensity: { value: u.intensity },
      uColor: { value: new THREE.Color(u.color[0], u.color[1], u.color[2]) },
      uAlpha: { value: u.alpha },
      uUseDither: { value: u.dither ? 1 : 0 },
      uDitherStrength: { value: u.ditherStrength },
      uUseTonemap: { value: u.tonemap ? 1 : 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Keep uniforms in sync when props change (without recreating material)
  uniforms.uThickness.value = u.thickness;
  uniforms.uIntensity.value = u.intensity;
  (uniforms.uColor.value as THREE.Color).setRGB(
    u.color[0],
    u.color[1],
    u.color[2],
  );
  uniforms.uAlpha.value = u.alpha;
  uniforms.uUseDither.value = u.dither ? 1 : 0;
  uniforms.uDitherStrength.value = u.ditherStrength;
  uniforms.uUseTonemap.value = u.tonemap ? 1 : 0;

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
      // Generator pass: no input texture used.
      blending={THREE.NoBlending}
    />
  );
}
