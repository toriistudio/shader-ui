"use client";


import { SceneProvider } from "@/hooks/SceneProvider";
import { DITHER_SPRITE_TEXTURE_SRC } from "@/constants/dither";

import BorderBeamPass, {
  type BorderBeamPassUniforms,
} from "@/components/DitherBorderBeamPass";
import BlurPass, { type BlurPassUniforms } from "@/components/DitherBlurPass";
import DiffusePass, {
  type DiffusePassUniforms,
} from "@/components/DitherDiffusePass";
import ExpandingRingPass, {
  type ExpandingRingPassUniforms,
} from "@/components/DitherExpandingRingPass";
import RenderPipeline from "@/components/RenderPipeline";
import GlyphDitherPass, {
  type GlyphDitherPassUniforms,
} from "@/components/DitherGlyphDitherPass";
import NoiseWarpPass, {
  type NoiseWarpPassUniforms,
} from "@/components/DitherNoiseWarpPass";

type DitherPulseRingProps = {
  spriteTextureSrc?: string;
  glyphDitherEnabled?: boolean;
  diffuseEnabled?: boolean;
  blurEnabled?: boolean;
  noiseWarpEnabled?: boolean;
  noiseWarpRadius?: NoiseWarpPassUniforms["radius"];
  noiseWarpStrength?: NoiseWarpPassUniforms["strength"];
  diffuseRadius?: DiffusePassUniforms["diffuseRadius"];
  blurRadius?: BlurPassUniforms["blurRadius"];
  borderThickness?: number;
  borderIntensity?: number;
  borderColor?: BorderBeamPassUniforms["color"];
  borderDitherStrength?: number;
  borderTonemap?: boolean;
  borderAlpha?: number;
  ringColor?: ExpandingRingPassUniforms["color"];
  ringSpeed?: number;
  ringPosition?: ExpandingRingPassUniforms["position"];
  ringAlpha?: ExpandingRingPassUniforms["alpha"];
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
};

export default function DitherPulseRing({
  spriteTextureSrc = DITHER_SPRITE_TEXTURE_SRC,
  glyphDitherEnabled = true,
  diffuseEnabled = false,
  blurEnabled = false,
  noiseWarpEnabled = false,
  noiseWarpRadius,
  noiseWarpStrength,
  diffuseRadius,
  blurRadius,
  borderThickness,
  borderIntensity,
  borderColor,
  borderDitherStrength,
  borderTonemap,
  borderAlpha,
  ringColor,
  ringSpeed,
  ringPosition,
  ringAlpha,
  width = "100%",
  height = "100%",
  className,
  style,
}: DitherPulseRingProps) {
  const resolvedClassName = className ?? "relative z-10 h-full w-full";

  return (
    <SceneProvider
      width={width}
      height={height}
      className={resolvedClassName}
      style={style}
      manualRender
    >
      <DitherPulseRingContent
        spriteTextureSrc={spriteTextureSrc}
        glyphDitherEnabled={glyphDitherEnabled}
        diffuseEnabled={diffuseEnabled}
        blurEnabled={blurEnabled}
        noiseWarpEnabled={noiseWarpEnabled}
        noiseWarpRadius={noiseWarpRadius}
        noiseWarpStrength={noiseWarpStrength}
        diffuseRadius={diffuseRadius}
        blurRadius={blurRadius}
        borderThickness={borderThickness}
        borderIntensity={borderIntensity}
        borderColor={borderColor}
        borderDitherStrength={borderDitherStrength}
        borderTonemap={borderTonemap}
        borderAlpha={borderAlpha}
        ringColor={ringColor}
        ringSpeed={ringSpeed}
        ringPosition={ringPosition}
        ringAlpha={ringAlpha}
      />
    </SceneProvider>
  );
}

function DitherPulseRingContent({
  spriteTextureSrc = DITHER_SPRITE_TEXTURE_SRC,
  glyphDitherEnabled = true,
  diffuseEnabled = false,
  blurEnabled = false,
  noiseWarpEnabled = false,
  noiseWarpRadius,
  noiseWarpStrength,
  diffuseRadius,
  blurRadius,
  borderThickness,
  borderIntensity,
  borderColor,
  borderDitherStrength,
  borderTonemap,
  borderAlpha,
  ringColor,
  ringSpeed,
  ringPosition,
  ringAlpha,
}: DitherPulseRingProps) {

  const glyphUniforms: Partial<GlyphDitherPassUniforms> = {};
  glyphUniforms.trackMouse = false;

  const noiseUniforms: Partial<NoiseWarpPassUniforms> = {};
  noiseUniforms.trackMouse = false;
  if (noiseWarpRadius !== undefined) {
    noiseUniforms.radius = noiseWarpRadius;
  }
  if (noiseWarpStrength !== undefined) {
    noiseUniforms.strength = noiseWarpStrength;
  }

  const diffuseUniforms: Partial<DiffusePassUniforms> = {};
  diffuseUniforms.trackMouse = false;
  if (diffuseRadius !== undefined) {
    diffuseUniforms.diffuseRadius = diffuseRadius;
  }

  const blurUniforms: Partial<BlurPassUniforms> = {};
  blurUniforms.trackMouse = false;
  if (blurRadius !== undefined) {
    blurUniforms.blurRadius = blurRadius;
  }

  const borderUniforms: Partial<BorderBeamPassUniforms> = {};
  if (borderThickness !== undefined) borderUniforms.thickness = borderThickness;
  if (borderIntensity !== undefined) borderUniforms.intensity = borderIntensity;
  if (borderColor) borderUniforms.color = borderColor;
  if (borderDitherStrength !== undefined) {
    borderUniforms.ditherStrength = borderDitherStrength;
  }
  if (borderTonemap !== undefined) borderUniforms.tonemap = borderTonemap;
  if (borderAlpha !== undefined) borderUniforms.alpha = borderAlpha;

  const ringUniforms: Partial<ExpandingRingPassUniforms> = {};
  if (ringColor) ringUniforms.color = ringColor;
  if (ringSpeed !== undefined) ringUniforms.speed = ringSpeed;
  if (ringPosition) ringUniforms.position = ringPosition;
  if (ringAlpha !== undefined) ringUniforms.alpha = ringAlpha;

  return (
    <RenderPipeline
      passes={[
        {
          component: BorderBeamPass,
          props: { uniforms: borderUniforms },
        },
        {
          component: ExpandingRingPass,
          props: { clear: true, uniforms: ringUniforms },
        },
        {
          component: NoiseWarpPass,
          enabled: noiseWarpEnabled,
          props: { uniforms: noiseUniforms },
        },
        {
          component: GlyphDitherPass,
          enabled: glyphDitherEnabled,
          props: { spriteTextureSrc, uniforms: glyphUniforms },
        },
        {
          component: DiffusePass,
          enabled: diffuseEnabled,
          props: { uniforms: diffuseUniforms },
        },
        {
          component: BlurPass,
          enabled: blurEnabled,
          props: { uniforms: blurUniforms },
        },
      ]}
    />
  );
}
