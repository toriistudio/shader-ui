"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

import ShaderPass from "@/components/ShaderPass";
import useMouse from "@/hooks/useMouse";
import { DITHER_SPRITE_TEXTURE_SRC } from "@/constants/dither";
import fragmentShader from "@/shaders/dither-glyph-dither/fragment.glsl";
import vertexShader from "@/shaders/dither-glyph-dither/vertex.glsl";

export type GlyphDitherPassUniforms = {
  trackMouse: boolean;
};

type GlyphDitherPassProps = {
  inputTexture?: THREE.Texture | null;
  spriteTextureSrc?: string;
  target?: THREE.WebGLRenderTarget | null;
  clear?: boolean;
  clearColor?: THREE.ColorRepresentation;
  enabled?: boolean;
  priority?: number;
  uniforms?: Partial<GlyphDitherPassUniforms>;
};

const DEFAULTS: GlyphDitherPassUniforms = {
  trackMouse: true,
};


export default function GlyphDitherPass({
  inputTexture = null,
  spriteTextureSrc = DITHER_SPRITE_TEXTURE_SRC,
  target = null,
  clear = false,
  clearColor = 0x000000,
  enabled = true,
  priority = 0,
  uniforms: uniformsOverride = {},
}: GlyphDitherPassProps) {
  const u = { ...DEFAULTS, ...uniformsOverride };
  const mousePos = useMouse({ enabled: u.trackMouse });
  const [spriteTexture, setSpriteTexture] = useState<THREE.Texture | null>(
    null
  );
  const fallbackTexture = useMemo(() => {
    const data = new Uint8Array([0, 0, 0, 255]);
    const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    texture.needsUpdate = true;
    return texture;
  }, []);

  useEffect(() => {
    if (!inputTexture) {
      console.warn("GlyphDitherPass: inputTexture is required.");
    }
  }, [inputTexture]);

  useEffect(() => {
    let isActive = true;
    const loader = new THREE.TextureLoader();
    loader.load(
      spriteTextureSrc,
      (texture) => {
        if (!isActive) {
          texture.dispose();
          return;
        }
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.generateMipmaps = false;
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        texture.needsUpdate = true;
        setSpriteTexture(texture);
      },
      undefined,
      () => {
        if (!isActive) return;
        setSpriteTexture(fallbackTexture);
      }
    );

    return () => {
      isActive = false;
    };
  }, [fallbackTexture, spriteTextureSrc]);

  const uniforms = useMemo<Record<string, THREE.IUniform>>(
    () => ({
      uTexture: { value: inputTexture ?? fallbackTexture },
      uSprite: { value: spriteTexture ?? fallbackTexture },
      uCustomTexture: { value: spriteTexture ?? fallbackTexture },
      uTextureMatrix: { value: new THREE.Matrix4() },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMousePos: { value: mousePos },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  uniforms.uTexture.value = inputTexture ?? fallbackTexture;
  uniforms.uCustomTexture.value = spriteTexture ?? fallbackTexture;
  uniforms.uSprite.value = spriteTexture ?? fallbackTexture;
  uniforms.uMousePos.value = mousePos;

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
      resolutionUniform="uResolution"
      blending={THREE.NoBlending}
    />
  );
}
