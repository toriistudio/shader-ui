"use client";

import { useMemo } from "react";
import * as THREE from "three";

import ShaderPass from "@/components/ShaderPass";
import createFallbackTexture from "@/utils/createFallbackTexture";
import fragmentShader from "@/shaders/dither-godray-dither/fragment.glsl";
import vertexShader from "@/shaders/dither-godray-dither/vertex.glsl";

type DitherStreamDitherPassProps = {
  inputTexture?: THREE.Texture | null;
  target?: THREE.WebGLRenderTarget | null;
  clear?: boolean;
  enabled?: boolean;
  priority?: number;
};

export default function DitherStreamDitherPass({
  inputTexture = null,
  target = null,
  clear = true,
  enabled = true,
  priority = 0,
}: DitherStreamDitherPassProps) {
  const fallbackTexture = useMemo(() => createFallbackTexture(), []);

  const uniforms = useMemo<Record<string, THREE.IUniform>>(
    () => ({
      uTexture: { value: inputTexture ?? fallbackTexture },
      uResolution: { value: new THREE.Vector2(1, 1) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  uniforms.uTexture.value = inputTexture ?? fallbackTexture;

  return (
    <ShaderPass
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={uniforms}
      inputTexture={inputTexture ?? fallbackTexture}
      target={target}
      clear={clear}
      enabled={enabled}
      priority={priority}
      resolutionUniform="uResolution"
      blending={THREE.NoBlending}
    />
  );
}
