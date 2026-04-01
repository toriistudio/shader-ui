"use client";

import { useMemo } from "react";
import * as THREE from "three";

import ShaderPass from "@/components/ShaderPass";
import fragmentShader from "@/shaders/fluid-amber-radiant/fragment.glsl";
import vertexShader from "@/shaders/fluid-amber-radiant/vertex.glsl";

type FluidAmberRadiantProps = {
  width?: string | number;
  height?: string | number;
  timeScale?: number;
  ampDecay?: number;
  hexColors?: string[];
};

export default function FluidAmberRadiant({
  width,
  height,
  timeScale = 0.15,
  ampDecay = 0.48,
  hexColors,
}: FluidAmberRadiantProps) {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
      uTimeScale: { value: timeScale },
      uAmpDecay: { value: ampDecay },
      uMouse: { value: new THREE.Vector2(-1, -1) },
      uPaletteA: { value: new THREE.Color(0, 0, 0) },
      uPaletteB: { value: new THREE.Color(0, 0, 0) },
      uHasPalette: { value: 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  uniforms.uTimeScale.value = timeScale;
  uniforms.uAmpDecay.value = ampDecay;

  const mixedPalette = useMemo(() => {
    if (!hexColors?.length) return null;
    const midpoint = Math.ceil(hexColors.length / 2);
    const firstHalf = hexColors.slice(0, midpoint);
    const secondHalf = hexColors.slice(midpoint);

    const average = (colors: string[]) => {
      if (!colors.length) return new THREE.Color(0, 0, 0);
      const mixed = new THREE.Color(0, 0, 0);
      colors.forEach((hex) => {
        const c = new THREE.Color(hex);
        mixed.r += c.r;
        mixed.g += c.g;
        mixed.b += c.b;
      });
      mixed.r /= colors.length;
      mixed.g /= colors.length;
      mixed.b /= colors.length;
      return mixed;
    };

    return {
      a: average(firstHalf),
      b: average(secondHalf.length ? secondHalf : firstHalf),
    };
  }, [hexColors]);

  if (mixedPalette) {
    (uniforms.uPaletteA.value as THREE.Color).copy(mixedPalette.a);
    (uniforms.uPaletteB.value as THREE.Color).copy(mixedPalette.b);
    uniforms.uHasPalette.value = 1;
  } else {
    uniforms.uHasPalette.value = 0;
  }

  return (
    <ShaderPass
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={uniforms}
      clearColor={0x0a0a0a}
      timeUniform="uTime"
      resolutionUniform="uResolution"
      priority={1}
      width={width}
      height={height}
    />
  );
}
