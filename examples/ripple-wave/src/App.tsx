"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  Playground,
  useControls,
  useAdvancedPaletteControls,
} from "@toriistudio/v0-playground";

import { RippleWave } from "@toriistudio/shader-ui";

const CONTROL_SCHEMA = {
  intensity: {
    type: "number" as const,
    value: 1.5,
    min: 0,
    max: 2,
    step: 0.05,
  },
  zoom: {
    type: "number" as const,
    value: 1.75,
    min: 0.5,
    max: 2.5,
    step: 0.05,
  },
  speed: {
    type: "number" as const,
    value: 0.35,
    min: 0,
    max: 3,
    step: 0.05,
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
    componentName: "RippleWave",
    config: {
      mainLabel: "Ripple Wave Controls",
      showGrid: false,
      showCopyButtonFn,
      showCopyButton: false,
      showCodeSnippet: true,
      addAdvancedPaletteControl: controlConfig,
    },
  });

  return (
    <RippleWave
      className="relative z-10 h-full w-full"
      intensity={controls.intensity ?? CONTROL_SCHEMA.intensity.value}
      zoom={controls.zoom ?? CONTROL_SCHEMA.zoom.value}
      speed={controls.speed ?? CONTROL_SCHEMA.speed.value}
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
