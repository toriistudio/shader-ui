"use client";

import { useMemo } from "react";
import * as THREE from "three";

import ShaderPass from "@/components/ShaderPass";
import createFallbackTexture from "@/utils/createFallbackTexture";
import fragmentShader from "@/shaders/dither-godray-beam-composite/fragment.glsl";
import vertexShader from "@/shaders/dither-godray-beam-composite/vertex.glsl";

type DitherStreamBeamCompositePassProps = {
  inputTexture?: THREE.Texture | null;
  beamSpeed?: number;
  beamDirection?: "counterclockwise" | "clockwise";
  beamColor?: [number, number, number];
  beamCenter?: [number, number];
  beamRadius?: number;
  beamScale?: number;
  pathShape?: "circle" | "square" | "diamond" | "triangle" | "oval" | "custom";
  customPathPoints?: Array<[number, number]>;
  pathPos?: [number, number];
  pathAngle?: number;
  target?: THREE.WebGLRenderTarget | null;
  clear?: boolean;
  enabled?: boolean;
  priority?: number;
};

export default function DitherStreamBeamCompositePass({
  inputTexture = null,
  beamSpeed = 0.1,
  beamDirection = "counterclockwise",
  beamColor = [0.667, 0.686, 0.941],
  beamCenter = [0.5, 0.95],
  beamRadius = 0.6,
  beamScale = 1,
  pathShape = "circle",
  customPathPoints = [],
  pathPos = [0.5009, 1.0473],
  pathAngle = (0.999 - 0.25) * -6.28318531,
  target = null,
  clear = true,
  enabled = true,
  priority = 0,
}: DitherStreamBeamCompositePassProps) {
  const MAX_CUSTOM_POINTS = 64;
  const fallbackTexture = useMemo(() => createFallbackTexture(), []);

  const uniforms = useMemo<Record<string, THREE.IUniform>>(
    () => ({
      uTexture: { value: inputTexture ?? fallbackTexture },
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uBeamSpeed: { value: beamSpeed },
      uBeamDirection: { value: beamDirection === "clockwise" ? -1 : 1 },
      uBeamColor: {
        value: new THREE.Color(beamColor[0], beamColor[1], beamColor[2]),
      },
      uBeamCenter: { value: new THREE.Vector2(beamCenter[0], beamCenter[1]) },
      uBeamRadius: { value: beamRadius },
      uBeamScale: { value: beamScale },
      uPathShape: {
        value:
          pathShape === "square"
            ? 1
            : pathShape === "diamond"
              ? 2
              : pathShape === "triangle"
                ? 3
                : pathShape === "oval"
                  ? 4
                  : pathShape === "custom"
                    ? 5
                    : 0,
      },
      uCustomPointCount: {
        value: Math.min(customPathPoints.length, MAX_CUSTOM_POINTS),
      },
      uCustomPoints: {
        value: Array.from(
          { length: MAX_CUSTOM_POINTS },
          () => new THREE.Vector2(-1, -1),
        ),
      },
      uPathPos: { value: new THREE.Vector2(pathPos[0], pathPos[1]) },
      uPathAngle: { value: pathAngle },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  uniforms.uTexture.value = inputTexture ?? fallbackTexture;
  uniforms.uBeamSpeed.value = beamSpeed;
  uniforms.uBeamDirection.value = beamDirection === "clockwise" ? -1 : 1;
  (uniforms.uBeamColor.value as THREE.Color).setRGB(
    beamColor[0],
    beamColor[1],
    beamColor[2],
  );
  (uniforms.uBeamCenter.value as THREE.Vector2).set(
    beamCenter[0],
    beamCenter[1],
  );
  uniforms.uBeamRadius.value = beamRadius;
  uniforms.uBeamScale.value = beamScale;
  uniforms.uPathShape.value =
    pathShape === "square"
      ? 1
      : pathShape === "diamond"
        ? 2
        : pathShape === "triangle"
          ? 3
          : pathShape === "oval"
            ? 4
            : pathShape === "custom"
              ? 5
              : 0;
  uniforms.uCustomPointCount.value = Math.min(
    customPathPoints.length,
    MAX_CUSTOM_POINTS,
  );
  const uniformCustomPoints = uniforms.uCustomPoints.value as THREE.Vector2[];
  for (let index = 0; index < MAX_CUSTOM_POINTS; index += 1) {
    const point = customPathPoints[index];
    uniformCustomPoints[index].set(point?.[0] ?? -1, point?.[1] ?? -1);
  }
  (uniforms.uPathPos.value as THREE.Vector2).set(pathPos[0], pathPos[1]);
  uniforms.uPathAngle.value = pathAngle;

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
      timeUniform="uTime"
      resolutionUniform="uResolution"
      blending={THREE.NoBlending}
    />
  );
}
