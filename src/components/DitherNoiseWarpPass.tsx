"use client";

import { useMemo } from "react";
import * as THREE from "three";

import ShaderPass from "@/components/ShaderPass";
import useMouse from "@/hooks/useMouse";
import fragmentShader from "@/shaders/dither-noise-warp/fragment.glsl";
import vertexShader from "@/shaders/dither-noise-warp/vertex.glsl";

export type NoiseWarpPassUniforms = {
  trackMouse: boolean;
  strength: number;
  radius: number;
};

type NoiseWarpPassProps = {
  inputTexture?: THREE.Texture | null;
  target?: THREE.WebGLRenderTarget | null;
  clear?: boolean;
  clearColor?: THREE.ColorRepresentation;
  enabled?: boolean;
  priority?: number;
  uniforms?: Partial<NoiseWarpPassUniforms>;
};

const DEFAULTS: NoiseWarpPassUniforms = {
  trackMouse: true,
  strength: 0.2,
  radius: 0.5,
};


export default function NoiseWarpPass({
  inputTexture = null,
  target = null,
  clear = false,
  clearColor = 0x000000,
  enabled = true,
  priority = 0,
  uniforms: uniformsOverride = {},
}: NoiseWarpPassProps) {
  const u = { ...DEFAULTS, ...uniformsOverride };
  const mousePos = useMouse({ enabled: u.trackMouse });

  const uniforms = useMemo<Record<string, THREE.IUniform>>(
    () => ({
      uTexture: { value: inputTexture },
      uTextureMatrix: { value: new THREE.Matrix4() },
      uTime: { value: 0 },
      uStrength: { value: u.strength },
      uRadius: { value: u.radius },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMousePos: { value: mousePos },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  uniforms.uTexture.value = inputTexture;
  uniforms.uMousePos.value = mousePos;
  uniforms.uStrength.value = u.strength;
  uniforms.uRadius.value = u.radius;

  return (
    <ShaderPass
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={uniforms}
      inputTexture={inputTexture}
      target={target}
      clear={clear}
      clearColor={clearColor}
      enabled={enabled}
      priority={priority}
      timeUniform="uTime"
      resolutionUniform="uResolution"
      blending={THREE.NoBlending}
    />
  );
}
