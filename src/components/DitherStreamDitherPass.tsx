"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

import ShaderPass from "@/components/ShaderPass";
import createFallbackTexture from "@/utils/createFallbackTexture";
import fragmentShader from "@/shaders/dither-godray-dither/fragment.glsl";
import vertexShader from "@/shaders/dither-godray-dither/vertex.glsl";

type DitherStreamDitherPassProps = {
  inputTexture?: THREE.Texture | null;
  backgroundImageSrc?: string;
  backgroundImageScale?: number;
  ditherBackground?: boolean;
  target?: THREE.WebGLRenderTarget | null;
  clear?: boolean;
  enabled?: boolean;
  priority?: number;
};

export default function DitherStreamDitherPass({
  inputTexture = null,
  backgroundImageSrc,
  backgroundImageScale = 1.0,
  ditherBackground = true,
  target = null,
  clear = true,
  enabled = true,
  priority = 0,
}: DitherStreamDitherPassProps) {
  const fallbackTexture = useMemo(() => createFallbackTexture(), []);
  const [backgroundTexture, setBackgroundTexture] =
    useState<THREE.Texture | null>(null);
  const [backgroundAspect, setBackgroundAspect] = useState(1.0);

  useEffect(() => {
    if (!backgroundImageSrc) {
      setBackgroundTexture(null);
      setBackgroundAspect(1.0);
      return;
    }

    let active = true;
    const loader = new THREE.TextureLoader();

    loader.load(
      backgroundImageSrc,
      (texture) => {
        if (!active) {
          texture.dispose();
          return;
        }
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        const img = texture.image as HTMLImageElement;
        if (img && img.naturalWidth && img.naturalHeight) {
          setBackgroundAspect(img.naturalWidth / img.naturalHeight);
        }
        setBackgroundTexture(texture);
      },
      undefined,
      (error) => {
        if (!active) return;
        console.error(
          "[DitherStream] Failed to load backgroundImageSrc — likely a CORS issue. The image server must include Access-Control-Allow-Origin headers.",
          backgroundImageSrc,
          error,
        );
        setBackgroundTexture(null);
      },
    );

    return () => {
      active = false;
    };
  }, [backgroundImageSrc]);

  const uniforms = useMemo<Record<string, THREE.IUniform>>(
    () => ({
      uTexture: { value: inputTexture ?? fallbackTexture },
      uBackgroundTexture: { value: fallbackTexture },
      uHasBackground: { value: 0.0 },
      uDitherBackground: { value: 1.0 },
      uBackgroundAspect: { value: 1.0 },
      uBackgroundScale: { value: 1.0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  uniforms.uTexture.value = inputTexture ?? fallbackTexture;
  uniforms.uBackgroundTexture.value = backgroundTexture ?? fallbackTexture;
  uniforms.uHasBackground.value = backgroundTexture ? 1.0 : 0.0;
  uniforms.uDitherBackground.value = ditherBackground ? 1.0 : 0.0;
  uniforms.uBackgroundAspect.value = backgroundAspect;
  uniforms.uBackgroundScale.value = backgroundImageScale;

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
