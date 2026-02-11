"use client";

import { type RefObject, useEffect, useMemo } from "react";
import * as THREE from "three";

import ShaderPass from "@/components/ShaderPass";
import fragmentShader from "@/shaders/dither-diffuse/fragment.glsl";
import vertexShader from "@/shaders/dither-diffuse/vertex.glsl";

export type DiffusePassUniforms = {
  trackMouse: boolean;
  diffuseRadius: number;
};

type DiffusePassProps = {
  inputTexture?: THREE.Texture | null;
  target?: THREE.WebGLRenderTarget | null;
  clear?: boolean;
  clearColor?: THREE.ColorRepresentation;
  enabled?: boolean;
  priority?: number;
  uniforms?: Partial<DiffusePassUniforms>;
  elementRef?: RefObject<HTMLElement>;
};

const DEFAULTS: DiffusePassUniforms = {
  trackMouse: true,
  diffuseRadius: 0.5,
};


export default function DiffusePass({
  inputTexture = null,
  target = null,
  clear = false,
  clearColor = 0x000000,
  enabled = true,
  priority = 0,
  uniforms: uniformsOverride = {},
  elementRef,
}: DiffusePassProps) {
  const u = { ...DEFAULTS, ...uniformsOverride };
  const mousePos = useMemo(() => new THREE.Vector2(0.5, 0.5), []);

  useEffect(() => {
    if (!elementRef?.current || !u.trackMouse) return;

    const element = elementRef.current;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;

      const mouseX = (event.clientX - rect.left) / rect.width;
      const mouseY = 1 - (event.clientY - rect.top) / rect.height;

      mousePos.set(
        Math.min(1, Math.max(0, mouseX)),
        Math.min(1, Math.max(0, mouseY)),
      );
    };

    const handleMouseLeave = () => {
      mousePos.set(0.5, 0.5);
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [elementRef, mousePos, u.trackMouse]);
  const fallbackTexture = useMemo(() => {
    const data = new Uint8Array([0, 0, 0, 255]);
    const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    texture.needsUpdate = true;
    return texture;
  }, []);

  useEffect(() => {
    if (!inputTexture) {
      console.warn("DiffusePass: inputTexture is required.");
    }
  }, [inputTexture]);

  const uniforms = useMemo<Record<string, THREE.IUniform>>(
    () => ({
      uTexture: { value: inputTexture ?? fallbackTexture },
      uTextureMatrix: { value: new THREE.Matrix4() },
      uTime: { value: 0 },
      uDiffuseRadius: { value: u.diffuseRadius },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMousePos: { value: mousePos },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  uniforms.uTexture.value = inputTexture ?? fallbackTexture;
  uniforms.uMousePos.value = mousePos;
  uniforms.uDiffuseRadius.value = u.diffuseRadius;

  return (
    <ShaderPass
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={uniforms}
      inputTexture={inputTexture ?? fallbackTexture}
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
