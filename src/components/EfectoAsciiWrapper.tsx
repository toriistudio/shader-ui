"use client";

import {
  AsciiEffect,
  EFECTO_ASCII_POST_PROCESSING_DEFAULTS,
  type EfectoAsciiColorPalette,
  type AsciiEffectRendererProps,
  type EfectoAsciiStyle,
  type EfectoPublicAsciiPostProcessingSettings,
} from "@/components/EfectoAsciiEffect";
import type { EfectoMediaAdjustments } from "@/utils/efectoMediaAdjustments";

type ControlValues = Record<string, unknown>;

const resolveNumber = (
  values: ControlValues,
  key: string,
  fallback: number
) => {
  const value = values[key];
  return typeof value === "number" ? value : fallback;
};

const resolveBoolean = (
  values: ControlValues,
  key: string,
  fallback: boolean
) => {
  const value = values[key];
  return typeof value === "boolean" ? value : fallback;
};

export type AsciiBaseProps = {
  cellSize: number;
  invert: boolean;
  colorMode: boolean;
  asciiStyle: EfectoAsciiStyle;
};

export const buildAsciiEffectProps = (
  values: ControlValues,
  baseProps: AsciiBaseProps
): EfectoAsciiWrapperSettings => {
  const styleValue = (values.style ?? baseProps.asciiStyle) as EfectoAsciiStyle;
  const paletteValue = (values.colorPalette ??
    "original") as EfectoAsciiColorPalette;

  const postProcessing: EfectoPublicAsciiPostProcessingSettings = {
    scanlineIntensity: resolveNumber(
      values,
      "scanlineIntensity",
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.scanlineIntensity
    ),
    scanlineCount: resolveNumber(
      values,
      "scanlineCount",
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.scanlineCount
    ),
    targetFPS: resolveNumber(
      values,
      "targetFPS",
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.targetFPS
    ),
    jitterIntensity: resolveNumber(
      values,
      "jitterIntensity",
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.jitterIntensity
    ),
    jitterSpeed: resolveNumber(
      values,
      "jitterSpeed",
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.jitterSpeed
    ),
    mouseGlowEnabled: resolveBoolean(
      values,
      "mouseGlowEnabled",
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.mouseGlowEnabled
    ),
    mouseGlowRadius: resolveNumber(
      values,
      "mouseGlowRadius",
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.mouseGlowRadius
    ),
    mouseGlowIntensity: resolveNumber(
      values,
      "mouseGlowIntensity",
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.mouseGlowIntensity
    ),
    vignetteIntensity: resolveNumber(
      values,
      "vignetteIntensity",
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.vignetteIntensity
    ),
    vignetteRadius: resolveNumber(
      values,
      "vignetteRadius",
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.vignetteRadius
    ),
    colorPalette: paletteValue,
    curvature: resolveNumber(
      values,
      "curvature",
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.curvature
    ),
    aberrationStrength: resolveNumber(
      values,
      "aberrationStrength",
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.aberrationStrength
    ),
    noiseIntensity: resolveNumber(
      values,
      "noiseIntensity",
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.noiseIntensity
    ),
    noiseScale: resolveNumber(
      values,
      "noiseScale",
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.noiseScale
    ),
    noiseSpeed: resolveNumber(
      values,
      "noiseSpeed",
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.noiseSpeed
    ),
    waveAmplitude: resolveNumber(
      values,
      "waveAmplitude",
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.waveAmplitude
    ),
    waveFrequency: resolveNumber(
      values,
      "waveFrequency",
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.waveFrequency
    ),
    waveSpeed: resolveNumber(
      values,
      "waveSpeed",
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.waveSpeed
    ),
    glitchIntensity: resolveNumber(
      values,
      "glitchIntensity",
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.glitchIntensity
    ),
    glitchFrequency: resolveNumber(
      values,
      "glitchFrequency",
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.glitchFrequency
    ),
    brightnessAdjust: resolveNumber(
      values,
      "brightnessAdjust",
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.brightnessAdjust
    ),
    contrastAdjust: resolveNumber(
      values,
      "contrastAdjust",
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.contrastAdjust
    ),
  };

  return {
    cellSize: resolveNumber(values, "cellSize", baseProps.cellSize),
    invert: resolveBoolean(values, "invert", baseProps.invert),
    colorMode: resolveBoolean(values, "colorMode", baseProps.colorMode),
    asciiStyle: styleValue,
    postProcessing,
  };
};

export type EfectoAsciiWrapperSettings = {
  cellSize: number;
  invert: boolean;
  colorMode: boolean;
  asciiStyle: EfectoAsciiStyle;
  postProcessing?: Partial<EfectoPublicAsciiPostProcessingSettings>;
};

type WrapperPassthroughProps = Omit<
  AsciiEffectRendererProps,
  | "asciiStyle"
  | "cellSize"
  | "invert"
  | "colorMode"
  | "postProcessing"
  | "imageUrl"
  | "mediaAdjustments"
  | "mouseParallax"
  | "parallaxIntensity"
>;

type EfectoAsciiWrapperProps = WrapperPassthroughProps & {
  settings: EfectoAsciiWrapperSettings;
  imageUrl?: string;
  mediaAdjustments?: EfectoMediaAdjustments;
  mouseParallax?: boolean;
  parallaxIntensity?: number;
};

export function EfectoAsciiWrapper({
  settings,
  imageUrl,
  mediaAdjustments,
  mouseParallax,
  parallaxIntensity,
  ...passThrough
}: EfectoAsciiWrapperProps) {
  return (
    <AsciiEffect
      asciiStyle={settings.asciiStyle}
      cellSize={settings.cellSize}
      invert={settings.invert}
      colorMode={settings.colorMode}
      postProcessing={settings.postProcessing}
      imageUrl={imageUrl}
      mediaAdjustments={mediaAdjustments}
      mouseParallax={mouseParallax}
      parallaxIntensity={parallaxIntensity}
      {...passThrough}
    />
  );
}
