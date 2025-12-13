"use client";

import {
  Playground,
  useControls,
  type ControlsSchema,
} from "@toriistudio/v0-playground";

import { ShaderArt } from "@toriistudio/shader-ui";

const SHADER_ART_SCHEMA: ControlsSchema = {
  uIterations: {
    type: "number",
    value: 8,
    min: 1,
    max: 64,
    step: 1,
    folder: "Noise",
  },
  uAmplitude: {
    type: "number",
    value: 0.85,
    min: 0,
    max: 2,
    step: 0.01,
    folder: "Noise",
  },
  uFreq: {
    type: "number",
    value: 0.95,
    min: 0,
    max: 5,
    step: 0.01,
    folder: "Noise",
  },
};

function ShaderArtPreview() {
  const controlValues = useControls(SHADER_ART_SCHEMA, {
    componentName: "ShaderArt",
    config: {
      mainLabel: "Shader Art Controls",
      showGrid: false,
      showCopyButton: false,
      showCodeSnippet: true,
    },
  });

  const uIterations =
    controlValues.uIterations ?? SHADER_ART_SCHEMA.uIterations.value;
  const uAmplitude =
    controlValues.uAmplitude ?? SHADER_ART_SCHEMA.uAmplitude.value;
  const uFreq = controlValues.uFreq ?? SHADER_ART_SCHEMA.uFreq.value;

  return (
    <ShaderArt
      className="relative z-10 h-full w-full"
      uniforms={{
        uIterations,
        uAmplitude,
        uFreq,
      }}
    />
  );
}

export default function ShaderArtPage() {
  return (
    <Playground>
      <ShaderArtPreview />
    </Playground>
  );
}
