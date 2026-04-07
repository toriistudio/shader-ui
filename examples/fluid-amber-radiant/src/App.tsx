"use client";

import { useCallback } from "react";
import { Playground, useControls } from "@toriistudio/v0-playground";

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
  color: {
    type: "color" as const,
    value: "#32c8c5",
    folder: "Colors",
  },
  rippleOnClick: {
    type: "boolean" as const,
    value: false,
    folder: "Interaction",
  },
};

function ShaderScene() {
  const showCopyButtonFn = useCallback(({ values, jsonToComponentString }) => {
    const color = values.color ?? CONTROL_SCHEMA.color.value;
    const rippleOnClick =
      values.rippleOnClick ?? CONTROL_SCHEMA.rippleOnClick.value;

    return jsonToComponentString({
      props: {
        width: "100%",
        height: "100%",
        timeScale: values.timeScale ?? CONTROL_SCHEMA.timeScale.value,
        ampDecay: values.ampDecay ?? CONTROL_SCHEMA.ampDecay.value,
        hexColors: [color, color],
        ...(rippleOnClick ? { rippleOnClick: true } : {}),
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
    },
  });

  const color = controls.color ?? CONTROL_SCHEMA.color.value;

  return (
    <FluidAmberRadiant
      className="relative z-10 h-full w-full"
      timeScale={controls.timeScale ?? CONTROL_SCHEMA.timeScale.value}
      ampDecay={controls.ampDecay ?? CONTROL_SCHEMA.ampDecay.value}
      hexColors={[color, color]}
      rippleOnClick={
        controls.rippleOnClick ?? CONTROL_SCHEMA.rippleOnClick.value
      }
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
