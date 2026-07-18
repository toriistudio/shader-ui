"use client";

import { type ComponentProps, useMemo } from "react";
import * as THREE from "three";

import ShaderPass from "@/components/ShaderPass";
import fragmentShader from "@/shaders/iyo-vad-canvas/fragment.glsl";
import vertexShader from "@/shaders/iyo-vad-canvas/vertex.glsl";

type IyoVADCanvasProps = {
  color?: string;
  scale?: number;
  reverseGradient?: boolean;
  centerFadeStrength?: number;
  verticalFade?: number;
  finalMix?: number;
  width?: string | number;
  height?: string | number;
} & Omit<ComponentProps<"div">, "ref" | "children" | "color" | "width" | "height">;

export default function IyoVADCanvas({
  color,
  scale = 1,
  reverseGradient = true,
  centerFadeStrength = 0.0,
  verticalFade = 2.0,
  finalMix = 0.85,
  width,
  height,
  ...divProps
}: IyoVADCanvasProps) {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPattern: { value: new THREE.Vector4(1, 1, scale, 0) },
      uColor: {
        value: color ? new THREE.Color(color) : new THREE.Color(0, 0, 0),
      },
      uReverseGradient: { value: reverseGradient },
      uCenterFadeStrength: { value: centerFadeStrength },
      uVerticalFade: { value: verticalFade },
      uFinalMix: { value: finalMix },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  (uniforms.uColor.value as THREE.Color).set(color ?? "#000000");
  (uniforms.uPattern.value as THREE.Vector4).z = scale;
  uniforms.uReverseGradient.value = reverseGradient;
  uniforms.uCenterFadeStrength.value = centerFadeStrength;
  uniforms.uVerticalFade.value = verticalFade;
  uniforms.uFinalMix.value = finalMix;

  return (
    <ShaderPass
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={uniforms}
      timeUniform="uTime"
      width={width}
      height={height}
      {...divProps}
    />
  );
}

export type { IyoVADCanvasProps };
