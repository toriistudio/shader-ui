"use client";

import {
  Playground,
  useControls,
  type ControlsSchema,
} from "@toriistudio/v0-playground";
import { OranoParticles } from "@toriistudio/shader-ui";

const ORANO_PARTICLES_SCHEMA: ControlsSchema = {
  particleCount: {
    type: "number",
    value: 2000,
    min: 250,
    max: 4000,
    step: 50,
    folder: "System",
  },
  color: {
    type: "color",
    value: "#ffe600",
    folder: "Material",
  },
  alpha: {
    type: "number",
    value: 1,
    min: 0,
    max: 1,
    step: 0.05,
    folder: "Material",
  },
  wind: {
    type: "number",
    value: 0.35,
    min: -1,
    max: 1,
    step: 0.00005,
    folder: "Simulation",
  },
  baseSize: {
    type: "number",
    value: 2,
    min: 0.5,
    max: 4,
    step: 0.05,
    folder: "Size",
  },
  distanceOffset: {
    type: "number",
    value: 12,
    min: 4,
    max: 50,
    step: 0.25,
    folder: "Size",
  },
  distanceStrength: {
    type: "number",
    value: 1.5,
    min: 0.1,
    max: 4,
    step: 0.05,
    folder: "Size",
  },
};

function Scene() {
  const controlValues = useControls(ORANO_PARTICLES_SCHEMA, {
    componentName: "OranoParticles",
    config: {
      mainLabel: "Orano Particles Controls",
      showGrid: false,
      showCopyButton: false,
      showCodeSnippet: true,
    },
  });

  const particleCount =
    controlValues.particleCount ?? ORANO_PARTICLES_SCHEMA.particleCount.value;
  const color = controlValues.color ?? ORANO_PARTICLES_SCHEMA.color.value;
  const alpha = controlValues.alpha ?? ORANO_PARTICLES_SCHEMA.alpha.value;
  const wind = controlValues.wind ?? ORANO_PARTICLES_SCHEMA.wind.value;
  const baseSize =
    controlValues.baseSize ?? ORANO_PARTICLES_SCHEMA.baseSize.value;
  const distanceOffset =
    controlValues.distanceOffset ?? ORANO_PARTICLES_SCHEMA.distanceOffset.value;
  const distanceStrength =
    controlValues.distanceStrength ??
    ORANO_PARTICLES_SCHEMA.distanceStrength.value;

  return (
    <OranoParticles
      className="relative z-10 h-full w-full"
      particleCount={particleCount}
      color={color}
      alpha={alpha}
      wind={wind}
      baseSize={baseSize}
      distanceOffset={distanceOffset}
      distanceStrength={distanceStrength}
    />
  );
}

export default function Home() {
  return (
    <Playground>
      <Scene />
    </Playground>
  );
}
