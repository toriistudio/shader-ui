"use client";
import { useCallback, useMemo, useState } from "react";
import { Playground, useControls } from "@toriistudio/v0-playground";
import { DitherStream, DitherStreamPathDrawer } from "@toriistudio/shader-ui";

const BEAM_FOLDER = "Beam";
const PROJECTION_FOLDER = "Projection";
const BACKGROUND_FOLDER = "Background";
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
    min: 0.01,
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
      custom: "custom",
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
  beamCustomPathPoints: {
    type: "string" as const,
    value: "",
    hidden: true,
  },
  projectionSpeed: {
    type: "number" as const,
    value: 0.05,
    min: 0.005,
    max: 0.2,
    step: 0.005,
    folder: PROJECTION_FOLDER,
  },
  backgroundImageSrc: {
    type: "string" as const,
    value:
      "https://media3.s-nbcnews.com/i/newscms/2020_04/3203206/200126-kobe-bryant-cs-551p_94a33c06ae6c4bbebaf59985de472c42.jpg",
    folder: BACKGROUND_FOLDER,
  },
  backgroundDithered: {
    type: "boolean" as const,
    value: false,
    folder: BACKGROUND_FOLDER,
  },
  godrayIntensity: {
    type: "number" as const,
    value: 0.1,
    min: 0,
    max: 3,
    step: 0.1,
    folder: GODRAY_FOLDER,
  },
};

type BeamPathShape =
  | "circle"
  | "square"
  | "diamond"
  | "triangle"
  | "oval"
  | "custom";

function ShaderScene() {
  const [isDrawModeActive, setIsDrawModeActive] = useState(false);

  const controlSchema = useMemo(
    () => ({
      ...CONTROL_SCHEMA,
      drawYourOwnPath: {
        type: "button" as const,
        label: isDrawModeActive ? "Cancel Drawing" : "Draw Your Own Path",
        onClick: () => setIsDrawModeActive((previous) => !previous),
        folder: BEAM_FOLDER,
      },
    }),
    [isDrawModeActive],
  );

  const controls = useControls(controlSchema, {
    componentName: "DitherStream",
    config: {
      mainLabel: "Controls",
      showCopyButton: false,
      showCodeSnippet: true,
      showPresentationButton: true,
      showCopyButtonFn: ({ values, jsonToComponentString }) => {
        const points: Array<[number, number]> = (() => {
          try {
            return JSON.parse(values.beamCustomPathPoints || "[]");
          } catch {
            return [];
          }
        })();
        return jsonToComponentString({
          props: {
            width: "100%",
            height: "100%",
            ...values,
            ...(values.beamPathShape === "custom" && points.length >= 2
              ? { beamCustomPathPoints: points }
              : {}),
          },
        });
      },
    },
  });

  const customPathPoints = useMemo<Array<[number, number]>>(() => {
    const raw = controls.beamCustomPathPoints as string | undefined;
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }, [controls.beamCustomPathPoints]);

  const resolvedBackgroundImageSrc = useMemo(() => {
    const src = controls.backgroundImageSrc || undefined;
    if (!src) return src;
    try {
      const url = new URL(src);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return `/api/image-proxy?url=${encodeURIComponent(src)}`;
      }
    } catch {
      console.error(
        "Invalid URL provided for background image. Falling back to using it as a relative path.",
        src,
      );
    }
    return src;
  }, [controls.backgroundImageSrc]);

  const selectedShape = (controls.beamPathShape ??
    CONTROL_SCHEMA.beamPathShape.value) as BeamPathShape;
  const resolvedShape =
    selectedShape === "custom" && customPathPoints.length < 2
      ? "circle"
      : selectedShape;

  const handlePathCommit = useCallback(
    (points: Array<[number, number]>) => {
      controls.setValue("beamCustomPathPoints", JSON.stringify(points));
      controls.setValue("beamPathShape", "custom");
      setIsDrawModeActive(false);
    },
    [controls],
  );

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
      beamPathShape={resolvedShape as BeamPathShape}
      beamCustomPathPoints={customPathPoints}
      beamEnabled={!isDrawModeActive}
      projectionSpeed={
        controls.projectionSpeed ?? CONTROL_SCHEMA.projectionSpeed.value
      }
      backgroundImageSrc={resolvedBackgroundImageSrc}
      backgroundDithered={
        controls.backgroundDithered ?? CONTROL_SCHEMA.backgroundDithered.value
      }
      godrayIntensity={
        controls.godrayIntensity ?? CONTROL_SCHEMA.godrayIntensity.value
      }
    >
      <DitherStreamPathDrawer
        enabled={isDrawModeActive}
        beamColor={controls.beamColor ?? CONTROL_SCHEMA.beamColor.value}
        backgroundImageSrc={resolvedBackgroundImageSrc}
        onCommit={handlePathCommit}
      />
    </DitherStream>
  );
}

export default function DitherStreamPage() {
  return (
    <Playground>
      <ShaderScene />
    </Playground>
  );
}
