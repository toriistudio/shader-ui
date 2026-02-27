"use client";

import { Playground, useControls } from "@toriistudio/v0-playground";

import { DitherStream } from "@toriistudio/shader-ui";

const BEAM_FOLDER = "Beam";
const PROJECTION_FOLDER = "Projection";
const GODRAY_FOLDER = "Godray";

const CONTROL_SCHEMA = {
  beamColor: {
    type: "color" as const,
    value: "#aab0f0",
    folder: BEAM_FOLDER,
  },
  beamSpeed: {
    type: "number" as const,
    value: 0.1,
    min: 0.01,
    max: 0.5,
    step: 0.01,
    folder: BEAM_FOLDER,
  },
  beamCenterX: {
    type: "number" as const,
    value: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    folder: BEAM_FOLDER,
  },
  beamCenterY: {
    type: "number" as const,
    value: 0.95,
    min: 0,
    max: 1.5,
    step: 0.01,
    folder: BEAM_FOLDER,
  },
  beamScale: {
    type: "number" as const,
    value: 1,
    min: 0.5,
    max: 2,
    step: 0.01,
    folder: BEAM_FOLDER,
  },
  beamPathShape: {
    type: "select" as const,
    value: "circle",
    options: {
      circle: "circle",
      square: "square",
      diamond: "diamond",
      triangle: "triangle",
      oval: "oval",
    },
    folder: BEAM_FOLDER,
  },
  beamDirection: {
    type: "select" as const,
    value: "counterclockwise",
    options: {
      counterclockwise: "counterclockwise",
      clockwise: "clockwise",
    },
    folder: BEAM_FOLDER,
  },
  projectionSpeed: {
    type: "number" as const,
    value: 0.05,
    min: 0.005,
    max: 0.2,
    step: 0.005,
    folder: PROJECTION_FOLDER,
  },
  godrayIntensity: {
    type: "number" as const,
    value: 2.9,
    min: 0,
    max: 6,
    step: 0.1,
    folder: GODRAY_FOLDER,
  },
};

function ShaderScene() {
  const controls = useControls(CONTROL_SCHEMA, {
    componentName: "DitherStream",
    config: {
      mainLabel: "Controls",
      showCopyButton: false,
      showCodeSnippet: true,
      showCopyButtonFn: ({ values, jsonToComponentString }) => {
        const excludedKeys = ["beamCenterX", "beamCenterY"];

        const newValues = Object.fromEntries(
          Object.entries(values).filter(([key]) => !excludedKeys.includes(key)),
        );

        return jsonToComponentString({
          props: {
            width: "100%",
            height: "100%",
            beamCenter: [
              values.beamCenterX ?? CONTROL_SCHEMA.beamCenterX.value,
              values.beamCenterY ?? CONTROL_SCHEMA.beamCenterY.value,
            ],
            ...newValues,
          },
        });
      },
    },
  });

  return (
    <DitherStream
      width={"100%"}
      height={"100%"}
      beamColor={controls.beamColor ?? CONTROL_SCHEMA.beamColor.value}
      beamSpeed={controls.beamSpeed ?? CONTROL_SCHEMA.beamSpeed.value}
      beamDirection={
        (controls.beamDirection ?? CONTROL_SCHEMA.beamDirection.value) as
          | "counterclockwise"
          | "clockwise"
      }
      beamCenter={[
        controls.beamCenterX ?? CONTROL_SCHEMA.beamCenterX.value,
        controls.beamCenterY ?? CONTROL_SCHEMA.beamCenterY.value,
      ]}
      beamScale={controls.beamScale ?? CONTROL_SCHEMA.beamScale.value}
      beamPathShape={
        (controls.beamPathShape ?? CONTROL_SCHEMA.beamPathShape.value) as
          | "circle"
          | "square"
          | "diamond"
          | "triangle"
          | "oval"
      }
      projectionSpeed={
        controls.projectionSpeed ?? CONTROL_SCHEMA.projectionSpeed.value
      }
      godrayIntensity={
        controls.godrayIntensity ?? CONTROL_SCHEMA.godrayIntensity.value
      }
    />
  );
}

export default function DitherStreamPage() {
  return (
    <Playground>
      <ShaderScene />
    </Playground>
  );
}
