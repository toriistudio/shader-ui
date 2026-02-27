"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

import ShaderPass from "@/components/ShaderPass";
import { useSceneContext } from "@/context/SceneProvider";
import createFallbackTexture from "@/utils/createFallbackTexture";
import extractFragment from "@/shaders/dither-godray-extract/fragment.glsl";
import extractVertex from "@/shaders/dither-godray-extract/vertex.glsl";
import finalFragment from "@/shaders/dither-godray-final/fragment.glsl";
import finalVertex from "@/shaders/dither-godray-final/vertex.glsl";
import marchFragment from "@/shaders/dither-godray-march/fragment.glsl";
import marchVertex from "@/shaders/dither-godray-march/vertex.glsl";

type DitherStreamGodRaysPassProps = {
  inputTexture?: THREE.Texture | null;
  intensity?: number;
  target?: THREE.WebGLRenderTarget | null;
  enabled?: boolean;
  priority?: number;
};

const TARGET_OPTIONS: THREE.RenderTargetOptions = {
  depthBuffer: false,
  stencilBuffer: false,
};

export default function DitherStreamGodRaysPass({
  inputTexture = null,
  intensity = 2.9,
  target = null,
  enabled = true,
  priority = 0,
}: DitherStreamGodRaysPassProps) {
  const sharedScene = useSceneContext();
  const size = sharedScene?.size ?? { width: 1, height: 1 };

  const fallbackTexture = useMemo(() => createFallbackTexture(), []);

  const extractTarget = useMemo(
    () => new THREE.WebGLRenderTarget(1, 1, TARGET_OPTIONS),
    [],
  );
  const marchTarget = useMemo(
    () => new THREE.WebGLRenderTarget(1, 1, TARGET_OPTIONS),
    [],
  );

  useEffect(() => {
    return () => {
      extractTarget.dispose();
      marchTarget.dispose();
    };
  }, [extractTarget, marchTarget]);

  useEffect(() => {
    if (size.width <= 1 || size.height <= 1) return;

    extractTarget.setSize(size.width, size.height);
    marchTarget.setSize(
      Math.max(1, Math.floor(size.width / 4)),
      Math.max(1, Math.floor(size.height / 4)),
    );
  }, [extractTarget, marchTarget, size.height, size.width]);

  const extractUniforms = useMemo<Record<string, THREE.IUniform>>(
    () => ({
      uTexture: { value: inputTexture ?? fallbackTexture },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const marchUniforms = useMemo<Record<string, THREE.IUniform>>(
    () => ({
      uTexture: { value: extractTarget.texture },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const finalUniforms = useMemo<Record<string, THREE.IUniform>>(
    () => ({
      uScene: { value: inputTexture ?? fallbackTexture },
      uGR: { value: marchTarget.texture },
      uGodrayIntensity: { value: intensity },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  extractUniforms.uTexture.value = inputTexture ?? fallbackTexture;
  marchUniforms.uTexture.value = extractTarget.texture;
  finalUniforms.uScene.value = inputTexture ?? fallbackTexture;
  finalUniforms.uGR.value = marchTarget.texture;
  finalUniforms.uGodrayIntensity.value = intensity;

  return (
    <>
      <ShaderPass
        vertexShader={extractVertex}
        fragmentShader={extractFragment}
        uniforms={extractUniforms}
        inputTexture={inputTexture ?? fallbackTexture}
        target={extractTarget}
        clear
        enabled={enabled}
        priority={priority}
        blending={THREE.NoBlending}
      />
      <ShaderPass
        vertexShader={marchVertex}
        fragmentShader={marchFragment}
        uniforms={marchUniforms}
        inputTexture={extractTarget.texture}
        target={marchTarget}
        clear
        enabled={enabled}
        priority={priority + 1}
        blending={THREE.NoBlending}
      />
      <ShaderPass
        vertexShader={finalVertex}
        fragmentShader={finalFragment}
        uniforms={finalUniforms}
        inputTexture={inputTexture ?? fallbackTexture}
        target={target}
        clear
        enabled={enabled}
        priority={priority + 2}
        blending={THREE.NoBlending}
      />
    </>
  );
}
