"use client";

import {
  Playground,
  useControls,
  type ControlsSchema,
} from "@toriistudio/v0-playground";

import { FractalFlower } from "@toriistudio/shader-ui";

const FRACTAL_FLOWER_SCHEMA: ControlsSchema = {
  timeScale: {
    type: "number",
    value: 0.35,
    min: 0.1,
    max: 3,
    step: 0.01,
    folder: "Animation",
  },
  petalRadius: {
    type: "number",
    value: 0.05,
    min: 0.005,
    max: 0.1,
    step: 0.001,
    folder: "Shape",
  },
  scale: {
    type: "number",
    value: 7,
    min: 0.2,
    max: 15,
    step: 0.05,
    folder: "Shape",
  },
  intensity: {
    type: "number",
    value: 0.25,
    min: 0.05,
    max: 1,
    step: 0.01,
    folder: "Color",
  },
  morphCycle: {
    type: "number",
    value: 0,
    min: 0,
    max: 1,
    step: 0.01,
    folder: "Animation",
  },
  color: {
    type: "color",
    value: "#ff8af0",
    folder: "Color",
  },
};

function FractalFlowerPreview() {
  const controlValues = useControls(FRACTAL_FLOWER_SCHEMA, {
    componentName: "FractalFlower",
    config: {
      mainLabel: "Fractal Flower Controls",
      showGrid: false,
      showCopyButton: false,
      showCodeSnippet: true,
    },
  });

  const timeScale =
    controlValues.timeScale ?? FRACTAL_FLOWER_SCHEMA.timeScale.value;
  const petalRadius =
    controlValues.petalRadius ?? FRACTAL_FLOWER_SCHEMA.petalRadius.value;
  const scale = controlValues.scale ?? FRACTAL_FLOWER_SCHEMA.scale.value;
  const intensity =
    controlValues.intensity ?? FRACTAL_FLOWER_SCHEMA.intensity.value;
  const morphCycle =
    controlValues.morphCycle ?? FRACTAL_FLOWER_SCHEMA.morphCycle.value;
  const color = controlValues.color ?? FRACTAL_FLOWER_SCHEMA.color.value;

  return (
    <FractalFlower
      className="relative z-10 h-full w-full"
      timeScale={timeScale}
      petalRadius={petalRadius}
      scale={scale}
      intensity={intensity}
      morphCycle={morphCycle}
      color={color}
    />
  );
}

export default function FractalFlowerPage() {
  return (
    <Playground>
      <FractalFlowerPreview />
    </Playground>
  );
}
