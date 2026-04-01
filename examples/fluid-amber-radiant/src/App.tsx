"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  Playground,
  useControls,
  useAdvancedPaletteControls,
} from "@toriistudio/v0-playground";

import { FluidAmberRadiant } from "@toriistudio/shader-ui";

const CONTROL_SCHEMA = {
  timeScale: {
    type: "number" as const,
    value: 0.15,
    min: 0.01,
    max: 0.5,
    step: 0.01,
  },
  ampDecay: {
    type: "number" as const,
    value: 0.48,
    min: 0.1,
    max: 0.8,
    step: 0.01,
  },
};

function ShaderScene() {
  const { hexColors, controlConfig } = useAdvancedPaletteControls({
    defaultPalette: ["#000000", "#000000", "#ffffff", "#ffffff"],
    control: { folder: "Colors" },
  });

  const hexColorsRef = useRef(hexColors);

  useEffect(() => {
    hexColorsRef.current = hexColors;
  }, [hexColors]);

  const showCopyButtonFn = useCallback(({ values, jsonToComponentString }) => {
    const newValues = Object.fromEntries(
      Object.entries(values).filter(([key]) =>
        Object.prototype.hasOwnProperty.call(CONTROL_SCHEMA, key),
      ),
    );

    return jsonToComponentString({
      props: {
        width: "100%",
        height: "100%",
        ...newValues,
        hexColors: hexColorsRef.current,
      },
    });
  }, []);

  const controls = useControls(CONTROL_SCHEMA, {
    componentName: "FluidAmberRadiant",
    config: {
      mainLabel: "Fluid Amber Radiant Controls",
      showGrid: false,
      showCopyButtonFn,
      showCopyButton: false,
      showCodeSnippet: true,
      addAdvancedPaletteControl: controlConfig,
    },
  });

  return (
    <FluidAmberRadiant
      className="relative z-10 h-full w-full"
      timeScale={controls.timeScale ?? CONTROL_SCHEMA.timeScale.value}
      ampDecay={controls.ampDecay ?? CONTROL_SCHEMA.ampDecay.value}
      hexColors={hexColors}
    />
  );
}

export default function ShaderPassPage() {
  return (
    <Playground>
      <ShaderScene />
    </Playground>
  );
}
