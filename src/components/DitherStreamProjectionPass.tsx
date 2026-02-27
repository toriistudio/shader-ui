"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

import ShaderPass from "@/components/ShaderPass";
import createFallbackTexture from "@/utils/createFallbackTexture";
import fragmentShader from "@/shaders/dither-godray-projection/fragment.glsl";
import vertexShader from "@/shaders/dither-godray-projection/vertex.glsl";

type DitherStreamProjectionPassProps = {
  imageTextureSrc?: string;
  projectionSpeed?: number;
  target?: THREE.WebGLRenderTarget | null;
  clear?: boolean;
  enabled?: boolean;
  priority?: number;
};

const DEFAULT_IMAGE_SRC =
  "https://firebasestorage.googleapis.com/v0/b/unicorn-studio.appspot.com/o/Zz28X5RDkvcGGVYLr9X6QdTIhxy1%2FUntitled%20design%20-%202025-10-14T141250.707.webp?alt=media&token=bfcd11a8-6529-41a6-a592-d78147e93840";

export default function DitherStreamProjectionPass({
  imageTextureSrc = DEFAULT_IMAGE_SRC,
  projectionSpeed = 0.05,
  target = null,
  clear = true,
  enabled = true,
  priority = 0,
}: DitherStreamProjectionPassProps) {
  const [imageTexture, setImageTexture] = useState<THREE.Texture | null>(null);
  const fallbackTexture = useMemo(() => createFallbackTexture(), []);

  useEffect(() => {
    let active = true;
    const loader = new THREE.TextureLoader();

    loader.load(
      imageTextureSrc,
      (texture) => {
        if (!active) {
          texture.dispose();
          return;
        }
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        texture.colorSpace = THREE.NoColorSpace;
        texture.needsUpdate = true;
        setImageTexture(texture);
      },
      undefined,
      () => {
        if (!active) return;
        setImageTexture(fallbackTexture);
      },
    );

    return () => {
      active = false;
    };
  }, [fallbackTexture, imageTextureSrc]);

  const uniforms = useMemo<Record<string, THREE.IUniform>>(
    () => ({
      uTex: { value: imageTexture ?? fallbackTexture },
      uTime: { value: 0 },
      uProjectionSpeed: { value: projectionSpeed },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  uniforms.uTex.value = imageTexture ?? fallbackTexture;
  uniforms.uProjectionSpeed.value = projectionSpeed;

  return (
    <ShaderPass
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={uniforms}
      target={target}
      clear={clear}
      enabled={enabled}
      priority={priority}
      timeUniform="uTime"
      blending={THREE.NoBlending}
    />
  );
}
