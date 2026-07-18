"use client";

import { useCallback } from "react";
import {
  Playground,
  useControls,
  type CopyButtonFnArgs,
} from "@toriistudio/v0-playground";

import { IyoVADCanvas } from "@toriistudio/shader-ui";

const CONTROL_SCHEMA = {
  color: {
    type: "color" as const,
    value: "#ffffff",
  },
  scale: {
    type: "number" as const,
    value: 1.0,
    min: 0.1,
    max: 3,
    step: 0.05,
  },
  reverseGradient: {
    type: "boolean" as const,
    value: true,
  },
  centerFadeStrength: {
    type: "number" as const,
    value: 0.0,
    min: 0,
    max: 1,
    step: 0.05,
  },
  verticalFade: {
    type: "number" as const,
    value: 2.0,
    min: 0,
    max: 5,
    step: 0.1,
  },
  finalMix: {
    type: "number" as const,
    value: 0.85,
    min: 0,
    max: 1,
    step: 0.05,
  },
};

function ShaderScene() {
  const showCopyButtonFn = useCallback(({ values, jsonToComponentString }: CopyButtonFnArgs) => {
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
      },
    });
  }, []);

  const controls = useControls(CONTROL_SCHEMA, {
    componentName: "IyoVADCanvas",
    config: {
      mainLabel: "IyoVADCanvas Controls",
      showGrid: false,
      showCopyButtonFn,
      showCopyButton: false,
      showCodeSnippet: true,
    },
  });

  return (
    <IyoVADCanvas
      className="relative z-10 h-full w-full"
      color={controls.color ?? CONTROL_SCHEMA.color.value}
      scale={controls.scale ?? CONTROL_SCHEMA.scale.value}
      reverseGradient={
        controls.reverseGradient ?? CONTROL_SCHEMA.reverseGradient.value
      }
      centerFadeStrength={
        controls.centerFadeStrength ?? CONTROL_SCHEMA.centerFadeStrength.value
      }
      verticalFade={controls.verticalFade ?? CONTROL_SCHEMA.verticalFade.value}
      finalMix={controls.finalMix ?? CONTROL_SCHEMA.finalMix.value}
    />
  );
}

export default function IyoVADCanvasPage() {
  return (
    <Playground>
      <ShaderScene />
    </Playground>
  );
}
