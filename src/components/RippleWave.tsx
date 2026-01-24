"use client";

import { useMemo } from "react";
import * as THREE from "three";

import ShaderPass from "@/components/ShaderPass";
import fragmentShader from "@/shaders/ripple-wave/fragment.glsl";
import vertexShader from "@/shaders/ripple-wave/vertex.glsl";

type RippleWaveProps = {
  width?: string | number;
  height?: string | number;
  intensity?: number;
  zoom?: number;
  speed?: number;
  hexColors?: string[];
};

export default function RippleWave({
  width,
  height,
  intensity = 0.85,
  zoom = 1.2,
  speed = 0.9,
  hexColors,
}: RippleWaveProps) {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
      uIntensity: { value: intensity },
      uZoom: { value: zoom },
      uSpeed: { value: speed },
      uPaletteA: { value: new THREE.Color(0, 0, 0) },
      uPaletteB: { value: new THREE.Color(0, 0, 0) },
      uHasPalette: { value: 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  uniforms.uIntensity.value = intensity;
  uniforms.uZoom.value = zoom;
  uniforms.uSpeed.value = speed;

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
      clearColor={0x060b14}
      timeUniform="uTime"
      resolutionUniform="uResolution"
      priority={1}
      width={width}
      height={height}
    />
  );
}
