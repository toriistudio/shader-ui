"use client";

import { useCallback } from "react";
import {
  Playground,
  useControls,
  type CopyButtonFnArgs,
} from "@toriistudio/v0-playground";
import { WANDY_HAND_DEFAULTS, WandyHand } from "@toriistudio/shader-ui";

function WandyHandScene() {
  const controls = useControls(
    {
      text: { type: "string", value: "Happy", folder: "Copy" },
      fontSize: {
        type: "number",
        value: 160,
        min: 60,
        max: 260,
        step: 1,
        folder: "Typography",
      },
      durationMs: {
        type: "number",
        value: 2200,
        min: 600,
        max: 6000,
        step: 50,
        folder: "Motion",
      },
      strokeWidth: {
        type: "number",
        value: 3.2,
        min: 1,
        max: 8,
        step: 0.1,
        folder: "Stroke",
      },
      penOpacity: {
        type: "number",
        value: 1,
        min: 0.1,
        max: 1,
        step: 0.05,
        folder: "Stroke",
      },
      strokeColor: { type: "color", value: "#fff", folder: "Stroke" },
      lineCap: {
        type: "select",
        value: "round",
        options: {
          round: "round",
          butt: "butt",
          square: "square",
        },
        folder: "Stroke",
      },
      lineJoin: {
        type: "select",
        value: "round",
        options: {
          round: "round",
          miter: "miter",
          bevel: "bevel",
        },
        folder: "Stroke",
      },
      samplesPerCurve: {
        type: "number",
        value: 5,
        min: 1,
        max: 16,
        step: 1,
        folder: "Geometry",
      },
      strokeMode: {
        type: "select",
        value: WANDY_HAND_DEFAULTS.strokeMode,
        options: {
          outline: "outline",
          full: "full",
        },
      },
      animate: {
        type: "boolean",
        value: true,
        folder: "Motion",
      },
      canvasPadding: {
        type: "number",
        value: 8,
        min: 8,
        max: 200,
        step: 1,
        folder: "Layout",
      },
      backgroundColor: {
        type: "color",
        value: "transparent",
        folder: "Layout",
      },
      imperfections: {
        type: "boolean",
        value: false,
        label: "Handmade stroke imperfections",
        folder: "Stroke",
      },
    },
    {
      componentName: "WandyHand",
      config: {
        mainLabel: "Controls",
        showGrid: false,
        showCopyButton: false,
        showCodeSnippet: true,
        showPresentationButton: true,
        showCopyButtonFn: useCallback(
          ({ values, jsonToComponentString }: CopyButtonFnArgs) => {
            const props = {
              text: values.text,
              fontSize: values.fontSize,
              durationMs: values.durationMs,
              strokeWidth: values.strokeWidth,
              penOpacity: values.penOpacity,
              strokeColor: values.strokeColor,
              lineCap: values.lineCap,
              lineJoin: values.lineJoin,
              samplesPerCurve: values.samplesPerCurve,
              strokeMode: values.strokeMode,
              animate: values.animate,
              canvasPadding: values.canvasPadding,
              backgroundColor: values.backgroundColor,
              imperfectionsEnabled: values.imperfections,
            };
            const filteredProps = Object.fromEntries(
              Object.entries(props).filter(([key, value]) => {
                if (key === "text") return true;
                const defaultValue =
                  WANDY_HAND_DEFAULTS[key as keyof typeof WANDY_HAND_DEFAULTS];
                return value !== defaultValue;
              })
            );
            return jsonToComponentString({
              componentName: "WandyHand",
              props: filteredProps,
            });
          },
          []
        ),
      },
    }
  );

  return (
    <WandyHand
      text={controls.text}
      fontSize={controls.fontSize}
      durationMs={controls.durationMs}
      strokeWidth={controls.strokeWidth}
      penOpacity={controls.penOpacity}
      strokeColor={controls.strokeColor}
      lineCap={controls.lineCap}
      lineJoin={controls.lineJoin}
      samplesPerCurve={controls.samplesPerCurve}
      strokeMode={controls.strokeMode}
      animate={controls.animate}
      canvasPadding={controls.canvasPadding}
      backgroundColor={controls.backgroundColor}
      imperfectionsEnabled={controls.imperfections}
    />
  );
}

export default function Page() {
  return (
    <Playground>
      <WandyHandScene />
    </Playground>
  );
}
