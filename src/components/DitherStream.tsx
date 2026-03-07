"use client";

import DitherStreamBeamCompositePass from "@/components/DitherStreamBeamCompositePass";
import DitherStreamDitherPass from "@/components/DitherStreamDitherPass";
import DitherStreamGodRaysPass from "@/components/DitherStreamGodRaysPass";
import DitherStreamProjectionPass from "@/components/DitherStreamProjectionPass";
import DitherStreamRendererConfig from "@/components/DitherStreamRendererConfig";
import RenderPipeline from "@/components/RenderPipeline";
import { SceneProvider } from "@/context/SceneProvider";

type DitherStreamProps = {
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  imageTextureSrc?: string;
  backgroundImageSrc?: string;
  backgroundImageScale?: number;
  backgroundDithered?: boolean;
  projectionSpeed?: number;
  beamSpeed?: number;
  beamDirection?: "counterclockwise" | "clockwise";
  beamColor?: [number, number, number] | string;
  beamCenter?: [number, number];
  beamRadius?: number;
  beamScale?: number;
  beamPathShape?:
    | "circle"
    | "square"
    | "diamond"
    | "triangle"
    | "oval"
    | "custom";
  beamCustomPathPoints?: Array<[number, number]>;
  beamEnabled?: boolean;
  pathPos?: [number, number];
  pathAngle?: number;
  godrayIntensity?: number;
};

export default function DitherStream({
  width = "100%",
  height = "100%",
  className = "relative h-full w-full",
  style,
  children,
  imageTextureSrc,
  backgroundImageSrc,
  backgroundImageScale = 1.0,
  backgroundDithered = true,
  projectionSpeed = 0.05,
  beamSpeed = 0.1,
  beamDirection = "counterclockwise",
  beamColor = [0.667, 0.686, 0.941],
  beamCenter = [0.5, 0.95],
  beamRadius = 0.6,
  beamScale = 1,
  beamPathShape = "circle",
  beamCustomPathPoints = [],
  beamEnabled = true,
  pathPos = [0.5009, 1.0473],
  pathAngle = (0.999 - 0.25) * -6.28318531,
  godrayIntensity = 2.9,
}: DitherStreamProps) {
  const resolveColor = (color: [number, number, number] | string) => {
    if (Array.isArray(color)) return color;
    const normalized = color.replace("#", "");
    if (normalized.length !== 6)
      return [0.667, 0.686, 0.941] as [number, number, number];
    return [
      parseInt(normalized.slice(0, 2), 16) / 255,
      parseInt(normalized.slice(2, 4), 16) / 255,
      parseInt(normalized.slice(4, 6), 16) / 255,
    ] as [number, number, number];
  };

  const resolvedBeamColor = resolveColor(beamColor);

  return (
    <SceneProvider
      width={width}
      height={height}
      className={className}
      style={style}
      manualRender
    >
      <DitherStreamRendererConfig />
      <RenderPipeline
        passes={[
          {
            component: DitherStreamProjectionPass,
            props: { imageTextureSrc, projectionSpeed },
          },
          {
            component: DitherStreamBeamCompositePass,
            enabled: beamEnabled,
            props: {
              beamSpeed,
              beamDirection,
              beamColor: resolvedBeamColor,
              beamCenter,
              beamRadius,
              beamScale,
              pathShape: beamPathShape,
              customPathPoints: beamCustomPathPoints,
              pathPos,
              pathAngle,
            },
          },
          {
            component: DitherStreamDitherPass,
            props: {
              backgroundImageSrc,
              backgroundImageScale,
              ditherBackground: backgroundDithered,
            },
          },
          {
            component: DitherStreamGodRaysPass,
            props: { intensity: godrayIntensity },
          },
        ]}
      />
      {children}
    </SceneProvider>
  );
}
