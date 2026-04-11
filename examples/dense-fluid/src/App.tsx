"use client";

import { useCallback } from "react";
import { Playground, useControls } from "@toriistudio/v0-playground";

import { DenseFluid } from "@toriistudio/shader-ui";

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
    value: "#fff",
    folder: "Colors",
  },
  ripple: {
    type: "boolean" as const,
    value: true,
    folder: "Interaction",
  },
};

function ShaderScene() {
  const showCopyButtonFn = useCallback(({ values, jsonToComponentString }) => {
    return jsonToComponentString({
      props: {
        width: "100%",
        height: "100%",
        timeScale: values.timeScale ?? CONTROL_SCHEMA.timeScale.value,
        ampDecay: values.ampDecay ?? CONTROL_SCHEMA.ampDecay.value,
        color: values.color ?? CONTROL_SCHEMA.color.value,
        ripple: values.ripple ?? CONTROL_SCHEMA.ripple.value,
      },
    });
  }, []);

  const controls = useControls(CONTROL_SCHEMA, {
    componentName: "DenseFluid",
    config: {
      mainLabel: "Dense Fluid Controls",
      showGrid: false,
      showCopyButtonFn,
      showCopyButton: false,
      showCodeSnippet: true,
    },
  });

  return (
    <DenseFluid
      className="relative z-10 h-full w-full"
      timeScale={controls.timeScale ?? CONTROL_SCHEMA.timeScale.value}
      ampDecay={controls.ampDecay ?? CONTROL_SCHEMA.ampDecay.value}
      color={controls.color ?? CONTROL_SCHEMA.color.value}
      ripple={controls.ripple ?? CONTROL_SCHEMA.ripple.value}
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
