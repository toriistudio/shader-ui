"use client";

import { Playground, useControls } from "@toriistudio/v0-playground";

import { DitherPulseRing } from "@toriistudio/shader-ui";
import type { CombineShaderMode } from "@toriistudio/shader-ui";

const BOLDER_FOLDER = "Border Settings";
const RING_FOLDER = "Ring Settings";
const DIFFUSE_FOLDER = "Diffuse Settings";
const BLUR_FOLDER = "Blur Settings";
const NOISE_FOLDER = "Noise Settings";
const GENERAL_FOLDER = "General Settings";
const CONTROL_SCHEMA = {
  color: {
    type: "color" as const,
    value: "#4599ff",
    folder: GENERAL_FOLDER,
  },
  combineMode: {
    type: "select" as const,
    value: "alphaOver",
    options: {
      add: "add",
      screen: "screen",
      multiply: "multiply",
      overlay: "overlay",
      max: "max",
      min: "min",
      difference: "difference",
      alphaOver: "alphaOver",
      premultipliedOver: "premultipliedOver",
      lerp: "lerp",
      mask: "mask",
    },
    folder: GENERAL_FOLDER,
  },
  glyphDitherEnabled: {
    type: "boolean" as const,
    value: true,
    folder: GENERAL_FOLDER,
  },
  noiseWarpEnabled: {
    type: "boolean" as const,
    value: true,
    folder: NOISE_FOLDER,
  },
  noiseWarpStrength: {
    type: "number" as const,
    value: 0.1,
    min: 0,
    max: 1,
    step: 0.01,
    folder: NOISE_FOLDER,
  },
  noiseWarpRadius: {
    type: "number" as const,
    value: 0.7,
    min: 0,
    max: 1,
    step: 0.01,
    folder: NOISE_FOLDER,
  },

  diffuseEnabled: {
    type: "boolean" as const,
    value: true,
    folder: DIFFUSE_FOLDER,
  },
  diffuseRadius: {
    type: "number" as const,
    value: 0.2,
    min: 0,
    max: 1,
    step: 0.01,
    folder: DIFFUSE_FOLDER,
  },
  blurEnabled: {
    type: "boolean" as const,
    value: true,
    folder: BLUR_FOLDER,
  },
  blurRadius: {
    type: "number" as const,
    value: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    folder: BLUR_FOLDER,
  },
  ringSpeed: {
    type: "number" as const,
    value: 0.2,
    min: 0.02,
    max: 1,
    step: 0.02,
    folder: RING_FOLDER,
  },
  ringAlpha: {
    type: "number" as const,
    value: 1.0,
    min: 0,
    max: 1,
    step: 0.01,
    folder: RING_FOLDER,
  },
  ringPosX: {
    type: "number" as const,
    value: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    folder: RING_FOLDER,
  },
  ringPosY: {
    type: "number" as const,
    value: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    folder: RING_FOLDER,
  },
  borderThickness: {
    type: "number" as const,
    value: 0.07,
    min: 0.002,
    max: 0.1,
    step: 0.002,
    folder: BOLDER_FOLDER,
  },
  borderIntensity: {
    type: "number" as const,
    value: 1.0,
    min: 0,
    max: 3,
    step: 0.05,
    folder: BOLDER_FOLDER,
  },
  borderAlpha: {
    type: "number" as const,
    value: 1.0,
    min: 0,
    max: 1,
    step: 0.01,
    folder: BOLDER_FOLDER,
  },
  borderTonemap: {
    type: "boolean" as const,
    value: true,
    folder: BOLDER_FOLDER,
  },
};

function ShaderScene() {
  const controls = useControls(CONTROL_SCHEMA, {
    componentName: "DitherPulseRing",
    config: {
      mainLabel: "Controls",
      showCopyButton: false,
      showCodeSnippet: true,
      showCopyButtonFn: ({ values, jsonToComponentString }) => {
        const newValues = Object.fromEntries(
          Object.entries(values).filter(
            ([key]) =>
              Object.prototype.hasOwnProperty.call(CONTROL_SCHEMA, key) &&
              key !== "color",
          ),
        );
        const color = values.color ?? CONTROL_SCHEMA.color.value;

        return jsonToComponentString({
          props: {
            width: "100%",
            height: "100%",
            ringColor: color,
            borderColor: color,
            ...newValues,
          },
        });
      },
    },
  });

  const color = controls.color ?? CONTROL_SCHEMA.color.value;

  return (
    <DitherPulseRing
      width="100%"
      height="100%"
      noiseWarpEnabled={
        controls.noiseWarpEnabled ?? CONTROL_SCHEMA.noiseWarpEnabled.value
      }
      noiseWarpRadius={
        controls.noiseWarpRadius ?? CONTROL_SCHEMA.noiseWarpRadius.value
      }
      noiseWarpStrength={
        controls.noiseWarpStrength ?? CONTROL_SCHEMA.noiseWarpStrength.value
      }
      glyphDitherEnabled={
        controls.glyphDitherEnabled ?? CONTROL_SCHEMA.glyphDitherEnabled.value
      }
      combineMode={
        (controls.combineMode ??
          CONTROL_SCHEMA.combineMode.value) as CombineShaderMode
      }
      diffuseEnabled={
        controls.diffuseEnabled ?? CONTROL_SCHEMA.diffuseEnabled.value
      }
      diffuseRadius={
        controls.diffuseRadius ?? CONTROL_SCHEMA.diffuseRadius.value
      }
      blurEnabled={controls.blurEnabled ?? CONTROL_SCHEMA.blurEnabled.value}
      blurRadius={controls.blurRadius ?? CONTROL_SCHEMA.blurRadius.value}
      borderThickness={
        controls.borderThickness ?? CONTROL_SCHEMA.borderThickness.value
      }
      borderIntensity={
        controls.borderIntensity ?? CONTROL_SCHEMA.borderIntensity.value
      }
      borderColor={color}
      ringColor={color}
      borderTonemap={
        controls.borderTonemap ?? CONTROL_SCHEMA.borderTonemap.value
      }
      borderAlpha={controls.borderAlpha ?? CONTROL_SCHEMA.borderAlpha.value}
      ringSpeed={controls.ringSpeed ?? CONTROL_SCHEMA.ringSpeed.value}
      ringAlpha={controls.ringAlpha ?? CONTROL_SCHEMA.ringAlpha.value}
      ringPosition={[
        controls.ringPosX ?? CONTROL_SCHEMA.ringPosX.value,
        controls.ringPosY ?? CONTROL_SCHEMA.ringPosY.value,
      ]}
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
