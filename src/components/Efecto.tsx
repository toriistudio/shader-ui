"use client";

import { type ComponentProps } from "react";

import {
  EFECTO_ASCII_COMPONENT_DEFAULTS,
  type EfectoPublicAsciiPostProcessingSettings,
} from "@/components/EfectoAsciiEffect";
import {
  AsciiBaseProps,
  EfectoAsciiWrapper,
  type EfectoAsciiWrapperSettings,
} from "@/components/EfectoAsciiWrapper";
import type { EfectoMediaAdjustments } from "@/utils/efectoMediaAdjustments";

export type EfectoProps = Omit<ComponentProps<"div">, "ref"> & {
  cellSize?: number;
  invert?: boolean;
  colorMode?: boolean;
  style?: AsciiBaseProps["asciiStyle"];
  /** @deprecated use `style` */
  asciiStyle?: AsciiBaseProps["asciiStyle"];
  postProcessing?: Partial<EfectoPublicAsciiPostProcessingSettings>;
  src?: string;
  mouseParallax?: boolean;
  parallaxIntensity?: number;
  mediaAdjustments?: EfectoMediaAdjustments;
};

const ASCII_BASE_DEFAULTS: AsciiBaseProps = {
  cellSize: EFECTO_ASCII_COMPONENT_DEFAULTS.cellSize,
  invert: EFECTO_ASCII_COMPONENT_DEFAULTS.invert,
  colorMode: EFECTO_ASCII_COMPONENT_DEFAULTS.colorMode,
  asciiStyle: EFECTO_ASCII_COMPONENT_DEFAULTS.asciiStyle,
};

export default function Efecto({
  postProcessing,
  src,
  mouseParallax = false,
  parallaxIntensity = 0.5,
  mediaAdjustments,
  cellSize,
  invert,
  colorMode,
  style,
  asciiStyle,
  ...wrapperProps
}: EfectoProps) {
  const resolvedStyle = style ?? asciiStyle ?? ASCII_BASE_DEFAULTS.asciiStyle;
  const baseAsciiProps: AsciiBaseProps = {
    cellSize: cellSize ?? ASCII_BASE_DEFAULTS.cellSize,
    invert: invert ?? ASCII_BASE_DEFAULTS.invert,
    colorMode: colorMode ?? ASCII_BASE_DEFAULTS.colorMode,
    asciiStyle: resolvedStyle,
  };

  const asciiSettings: EfectoAsciiWrapperSettings = {
    ...baseAsciiProps,
    postProcessing,
  };

  return (
    <EfectoAsciiWrapper
      settings={asciiSettings}
      imageUrl={src}
      mediaAdjustments={mediaAdjustments}
      mouseParallax={mouseParallax}
      parallaxIntensity={parallaxIntensity}
      {...wrapperProps}
    />
  );
}
