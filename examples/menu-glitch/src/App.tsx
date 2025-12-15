"use client";

import { useMemo, useState } from "react";
import { MenuGlitch, type MenuGlitchUniforms } from "@toriistudio/shader-ui";
import {
  Playground,
  useControls,
  type ControlsSchema,
} from "@toriistudio/v0-playground";

const BASE_CONTROL_SCHEMA = {
  tileAmplitude: {
    type: "number",
    value: 2,
    min: 0.5,
    max: 4,
    step: 0.1,
    folder: "Tiles",
  },
  tileOffsetX: {
    type: "number",
    value: 0.1,
    min: -0.5,
    max: 0.5,
    step: 0.01,
    folder: "Tiles",
  },
  tileOffsetY: {
    type: "number",
    value: 0.03,
    min: -0.3,
    max: 0.3,
    step: 0.01,
    folder: "Tiles",
  },
  tileFrequencyX: {
    type: "number",
    value: 12,
    min: 2,
    max: 40,
    step: 1,
    folder: "Tiles",
  },
  tileFrequencyY: {
    type: "number",
    value: 20,
    min: 2,
    max: 40,
    step: 1,
    folder: "Tiles",
  },
  gradientAmplitude: {
    type: "number",
    value: 0.5,
    min: 0.1,
    max: 1,
    step: 0.05,
    folder: "Gradient",
  },
  gradientOffset: {
    type: "number",
    value: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    folder: "Gradient",
  },
  blueAmplitude: {
    type: "number",
    value: 0.5,
    min: 0.1,
    max: 1,
    step: 0.01,
    folder: "Chromatic",
  },
  waveAmplitude: {
    type: "number",
    value: 0.5,
    min: 0.1,
    max: 1.5,
    step: 0.05,
    folder: "Wave",
  },
  waveStrengthX: {
    type: "number",
    value: 0.1,
    min: 0,
    max: 0.5,
    step: 0.01,
    folder: "Wave",
  },
  waveStrengthY: {
    type: "number",
    value: 0,
    min: 0,
    max: 0.5,
    step: 0.01,
    folder: "Wave",
  },
  whiteTileChances: {
    type: "number",
    value: 0.05,
    min: 0.05,
    max: 1,
    step: 0.01,
    folder: "White Tiles",
  },
  whiteTileFrequency: {
    type: "number",
    value: 0.00015,
    min: 0,
    max: 1,
    step: 0.00001,
    folder: "White Tiles",
  },
  whiteTileStrength: {
    type: "number",
    value: 0,
    min: 0,
    max: 0.3,
    step: 0.01,
    folder: "White Tiles",
  },
  saturation: {
    type: "number",
    value: 1,
    min: 0.2,
    max: 3,
    step: 0.05,
    folder: "Color",
  },
  animationDuration: {
    type: "number",
    value: 2,
    min: 0.25,
    max: 4,
    step: 0.05,
    folder: "Animation",
    folderPlacement: "top",
  },
} satisfies ControlsSchema;

function SceneBackground() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(circle at top, rgba(15,23,42,0.85), rgba(2,6,23,0.95))",
        padding: "3rem 4rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        color: "#f8fafc",
      }}
    >
      <div style={{ textTransform: "uppercase", letterSpacing: "0.5rem" }}>
        VIGNETTE LAYERS
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.25rem",
          flex: 1,
        }}
      >
        {["Horizon", "Nebula", "Mirage", "Cascade", "Eclipse"].map(
          (label, index) => (
            <div
              key={label}
              style={{
                borderRadius: "1rem",
                border: "1px solid rgba(248,250,252,0.15)",
                padding: "1.5rem",
                background:
                  "linear-gradient(135deg, rgba(15,23,42,0.85), rgba(15,23,42,0.45))",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                backdropFilter: "blur(12px)",
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  letterSpacing: "0.25rem",
                  color: "#94a3b8",
                }}
              >
                LAYER {index + 1}
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{label}</div>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#cbd5f5",
                  lineHeight: 1.5,
                }}
              >
                Procedural cards to showcase how the glitch plane overlays UI
                content when triggers fire.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  marginTop: "auto",
                }}
              >
                <span
                  style={{
                    padding: "0.35rem 0.9rem",
                    borderRadius: "999px",
                    border: "1px solid rgba(148,163,184,0.4)",
                    fontSize: "0.75rem",
                    letterSpacing: "0.15rem",
                  }}
                >
                  ACTIVE
                </span>
                <span
                  style={{
                    padding: "0.35rem 0.9rem",
                    borderRadius: "999px",
                    border: "1px solid rgba(148,163,184,0.2)",
                    fontSize: "0.75rem",
                    letterSpacing: "0.15rem",
                    color: "#94a3b8",
                  }}
                >
                  02:14
                </span>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function MenuGlitchPreview() {
  const [showSignal, setShowSignal] = useState(0);
  const [hideSignal, setHideSignal] = useState(0);

  const schema = useMemo<ControlsSchema>(
    () => ({
      ...BASE_CONTROL_SCHEMA,
      triggerShow: {
        type: "button",
        label: "Show menu glitch",
        onClick: () => setShowSignal((value) => value + 1),
        folder: "Animation",
        folderPlacement: "top",
      },
      triggerHide: {
        type: "button",
        label: "Hide menu glitch",
        onClick: () => setHideSignal((value) => value + 1),
        folder: "Animation",
        folderPlacement: "top",
      },
    }),
    [setHideSignal, setShowSignal]
  );

  const controlValues = useControls(schema, {
    componentName: "MenuGlitch",
    config: {
      mainLabel: "Menu Glitch Controls",
      showGrid: false,
      showCopyButton: false,
      showCodeSnippet: true,
    },
  });

  const {
    tileAmplitude,
    tileOffsetX,
    tileOffsetY,
    tileFrequencyX,
    tileFrequencyY,
    gradientAmplitude,
    gradientOffset,
    blueAmplitude,
    waveAmplitude,
    waveStrengthX,
    waveStrengthY,
    whiteTileChances,
    whiteTileFrequency,
    whiteTileStrength,
    saturation,
    animationDuration,
  } = controlValues;

  const settings = useMemo<MenuGlitchUniforms>(
    () => ({
      tileAmplitude: tileAmplitude ?? BASE_CONTROL_SCHEMA.tileAmplitude.value,
      planeScale: 1,
      gradientProgress: 1,
      blueProgress: 1,
      waveProgress: 0.5,
      debug: false,
      tileOffset: {
        x: tileOffsetX ?? BASE_CONTROL_SCHEMA.tileOffsetX.value,
        y: tileOffsetY ?? BASE_CONTROL_SCHEMA.tileOffsetY.value,
      },
      tileFrequency: {
        x: tileFrequencyX ?? BASE_CONTROL_SCHEMA.tileFrequencyX.value,
        y: tileFrequencyY ?? BASE_CONTROL_SCHEMA.tileFrequencyY.value,
      },
      gradientAmplitude:
        gradientAmplitude ?? BASE_CONTROL_SCHEMA.gradientAmplitude.value,
      gradientOffset:
        gradientOffset ?? BASE_CONTROL_SCHEMA.gradientOffset.value,
      blueAmplitude: blueAmplitude ?? BASE_CONTROL_SCHEMA.blueAmplitude.value,
      waveAmplitude: waveAmplitude ?? BASE_CONTROL_SCHEMA.waveAmplitude.value,
      waveStrength: {
        x: waveStrengthX ?? BASE_CONTROL_SCHEMA.waveStrengthX.value,
        y: waveStrengthY ?? BASE_CONTROL_SCHEMA.waveStrengthY.value,
      },
      whiteTileChances:
        whiteTileChances ?? BASE_CONTROL_SCHEMA.whiteTileChances.value,
      whiteTileFrequency:
        whiteTileFrequency ?? BASE_CONTROL_SCHEMA.whiteTileFrequency.value,
      whiteTileStrength:
        whiteTileStrength ?? BASE_CONTROL_SCHEMA.whiteTileStrength.value,
      saturation: saturation ?? BASE_CONTROL_SCHEMA.saturation.value,
      duration:
        animationDuration ?? BASE_CONTROL_SCHEMA.animationDuration.value,
      showSignal,
      hideSignal,
    }),
    [
      tileAmplitude,
      tileOffsetX,
      tileOffsetY,
      tileFrequencyX,
      tileFrequencyY,
      gradientAmplitude,
      gradientOffset,
      blueAmplitude,
      waveAmplitude,
      waveStrengthX,
      waveStrengthY,
      whiteTileChances,
      whiteTileFrequency,
      whiteTileStrength,
      saturation,
      animationDuration,
      showSignal,
      hideSignal,
    ]
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <SceneBackground />
      <MenuGlitch
        settings={settings}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      />
    </div>
  );
}

export default function MenuGlitchPage() {
  return (
    <Playground>
      <MenuGlitchPreview />
    </Playground>
  );
}
