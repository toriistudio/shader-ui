import type {
  ControlsSchema,
  PresetMediaEntry,
} from "@toriistudio/v0-playground";

import {
  EFECTO_ASCII_COMPONENT_DEFAULTS,
  EFECTO_ASCII_POST_PROCESSING_DEFAULTS,
  type EfectoAsciiColorPalette,
  type EfectoAsciiStyle,
  type EfectoPublicAsciiPostProcessingSettings,
} from "@toriistudio/shader-ui";

const STYLE_OPTIONS: Record<EfectoAsciiStyle, string> = {
  standard: "Standard",
  dense: "Dense",
  minimal: "Minimal",
  blocks: "Blocks",
};

const COLOR_PALETTE_OPTIONS: Record<EfectoAsciiColorPalette, string> = {
  original: "Original",
  green: "Green",
  amber: "Amber",
  cyan: "Cyan",
  blue: "Blue",
};

export const PRESET_MEDIA: PresetMediaEntry[] = [
  {
    src: "https://res.cloudinary.com/dz8kk1l4r/image/upload/v1763233793/portrait_hd7dyc.png",
    label: "Portrait",
    type: "image",
  },
  {
    src: "https://res.cloudinary.com/dz8kk1l4r/image/upload/v1763233793/astronaut_q84mbj.png",
    label: "Astronaut",
    type: "image",
  },
  {
    src: "https://res.cloudinary.com/dz8kk1l4r/image/upload/v1763233793/surreal-head_r0ozcd.png",
    label: "Futuristic",
    type: "image",
  },
  {
    src: "https://res.cloudinary.com/dz8kk1l4r/image/upload/v1763233797/futuristic_bpwdzt.png",
    label: "Surreal",
    type: "image",
  },
];

export const POST_PROCESSING_PRESETS = {
  none: {
    scanlineIntensity: 0,
    targetFPS: 0,
    jitterIntensity: 0,
    mouseGlowEnabled: false,
    vignetteIntensity: 0,
    colorPalette: "original",
    curvature: 0,
    aberrationStrength: 0,
    noiseIntensity: 0,
    waveAmplitude: 0,
    glitchIntensity: 0,
    brightnessAdjust: 0,
    contrastAdjust: 1,
  },
  crt: {
    scanlineIntensity: 0.3,
    scanlineCount: 300,
    vignetteIntensity: 0.4,
    vignetteRadius: 0.7,
    curvature: 0.15,
    colorPalette: "original",
    brightnessAdjust: 0.1,
    contrastAdjust: 1.2,
  },
  terminal: {
    scanlineIntensity: 0.2,
    scanlineCount: 400,
    jitterIntensity: 0.05,
    jitterSpeed: 2,
    colorPalette: "green",
    noiseIntensity: 0.1,
    noiseScale: 2,
    vignetteIntensity: 0.3,
  },
  glitch: {
    jitterIntensity: 0.3,
    jitterSpeed: 5,
    glitchIntensity: 0.03,
    glitchFrequency: 2,
    aberrationStrength: 0.005,
    noiseIntensity: 0.2,
    targetFPS: 15,
  },
  retro: {
    scanlineIntensity: 0.4,
    scanlineCount: 250,
    curvature: 0.2,
    vignetteIntensity: 0.5,
    aberrationStrength: 0.003,
    colorPalette: "amber",
    brightnessAdjust: 0.15,
    contrastAdjust: 1.3,
  },
} satisfies Record<string, Partial<EfectoPublicAsciiPostProcessingSettings>>;

export type PostProcessingPresetKey = keyof typeof POST_PROCESSING_PRESETS;

export const POST_PROCESSING_PRESET_OPTIONS: Record<
  PostProcessingPresetKey,
  string
> = {
  none: "None",
  crt: "CRT",
  terminal: "Terminal",
  glitch: "Glitch",
  retro: "Retro",
};

export const ASCII_CONTROL_SCHEMA = {
  style: {
    type: "select",
    value: EFECTO_ASCII_COMPONENT_DEFAULTS.asciiStyle,
    options: STYLE_OPTIONS,
    folder: "Basic",
  },
  cellSize: {
    type: "number",
    value: EFECTO_ASCII_COMPONENT_DEFAULTS.cellSize,
    min: 4,
    max: 24,
    step: 1,
    folder: "Basic",
  },
  invert: {
    type: "boolean",
    value: EFECTO_ASCII_COMPONENT_DEFAULTS.invert,
    folder: "Basic",
  },
  colorMode: {
    type: "boolean",
    value: EFECTO_ASCII_COMPONENT_DEFAULTS.colorMode,
    folder: "Basic",
  },
  mouseParallax: {
    type: "boolean",
    value: false,
    folder: "Mouse Parallax",
  },
  parallaxIntensity: {
    type: "number",
    value: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    folder: "Mouse Parallax",
  },
  preset: {
    type: "select",
    value: "none",
    options: POST_PROCESSING_PRESET_OPTIONS,
    folder: "Post-Processing",
  },
  colorPalette: {
    type: "select",
    value: "original",
    options: COLOR_PALETTE_OPTIONS,
    folder: "Display",
  },
  scanlineIntensity: {
    type: "number",
    value: EFECTO_ASCII_POST_PROCESSING_DEFAULTS.scanlineIntensity,
    min: 0,
    max: 1,
    step: 0.01,
    folder: "Display",
  },
  scanlineCount: {
    type: "number",
    value: EFECTO_ASCII_POST_PROCESSING_DEFAULTS.scanlineCount,
    min: 100,
    max: 1000,
    step: 10,
    folder: "Display",
  },
  vignetteIntensity: {
    type: "number",
    value: EFECTO_ASCII_POST_PROCESSING_DEFAULTS.vignetteIntensity,
    min: 0,
    max: 1,
    step: 0.01,
    folder: "Display",
  },
  vignetteRadius: {
    type: "number",
    value: EFECTO_ASCII_POST_PROCESSING_DEFAULTS.vignetteRadius,
    min: 0.5,
    max: 1.5,
    step: 0.01,
    folder: "Display",
  },
  curvature: {
    type: "number",
    value: EFECTO_ASCII_POST_PROCESSING_DEFAULTS.curvature,
    min: 0,
    max: 0.5,
    step: 0.01,
    folder: "Distortion",
  },
  aberrationStrength: {
    type: "number",
    value: EFECTO_ASCII_POST_PROCESSING_DEFAULTS.aberrationStrength,
    min: 0,
    max: 0.01,
    step: 0.0005,
    folder: "Distortion",
  },
  targetFPS: {
    type: "number",
    value: EFECTO_ASCII_POST_PROCESSING_DEFAULTS.targetFPS,
    min: 0,
    max: 60,
    step: 1,
    folder: "Animation",
  },
  jitterIntensity: {
    type: "number",
    value: EFECTO_ASCII_POST_PROCESSING_DEFAULTS.jitterIntensity,
    min: 0,
    max: 1,
    step: 0.01,
    folder: "Animation",
  },
  jitterSpeed: {
    type: "number",
    value: EFECTO_ASCII_POST_PROCESSING_DEFAULTS.jitterSpeed,
    min: 0,
    max: 10,
    step: 0.05,
    folder: "Animation",
  },
  waveAmplitude: {
    type: "number",
    value: EFECTO_ASCII_POST_PROCESSING_DEFAULTS.waveAmplitude,
    min: 0,
    max: 0.1,
    step: 0.001,
    folder: "Animation",
  },
  waveFrequency: {
    type: "number",
    value: EFECTO_ASCII_POST_PROCESSING_DEFAULTS.waveFrequency,
    min: 0.5,
    max: 20,
    step: 0.1,
    folder: "Animation",
  },
  waveSpeed: {
    type: "number",
    value: EFECTO_ASCII_POST_PROCESSING_DEFAULTS.waveSpeed,
    min: 0,
    max: 5,
    step: 0.01,
    folder: "Animation",
  },
  noiseIntensity: {
    type: "number",
    value: EFECTO_ASCII_POST_PROCESSING_DEFAULTS.noiseIntensity,
    min: 0,
    max: 1,
    step: 0.01,
    folder: "Noise",
  },
  noiseScale: {
    type: "number",
    value: EFECTO_ASCII_POST_PROCESSING_DEFAULTS.noiseScale,
    min: 0.1,
    max: 10,
    step: 0.1,
    folder: "Noise",
  },
  noiseSpeed: {
    type: "number",
    value: EFECTO_ASCII_POST_PROCESSING_DEFAULTS.noiseSpeed,
    min: 0,
    max: 5,
    step: 0.1,
    folder: "Noise",
  },
  glitchIntensity: {
    type: "number",
    value: EFECTO_ASCII_POST_PROCESSING_DEFAULTS.glitchIntensity,
    min: 0,
    max: 0.05,
    step: 0.001,
    folder: "Noise",
  },
  glitchFrequency: {
    type: "number",
    value: EFECTO_ASCII_POST_PROCESSING_DEFAULTS.glitchFrequency,
    min: 0,
    max: 10,
    step: 0.1,
    folder: "Noise",
  },
  mouseGlowEnabled: {
    type: "boolean",
    value: EFECTO_ASCII_POST_PROCESSING_DEFAULTS.mouseGlowEnabled,
    folder: "Interactive",
  },
  mouseGlowRadius: {
    type: "number",
    value: EFECTO_ASCII_POST_PROCESSING_DEFAULTS.mouseGlowRadius,
    min: 50,
    max: 500,
    step: 10,
    folder: "Interactive",
  },
  mouseGlowIntensity: {
    type: "number",
    value: EFECTO_ASCII_POST_PROCESSING_DEFAULTS.mouseGlowIntensity,
    min: 0,
    max: 3,
    step: 0.1,
    folder: "Interactive",
  },
  brightnessAdjust: {
    type: "number",
    value: EFECTO_ASCII_POST_PROCESSING_DEFAULTS.brightnessAdjust,
    min: -0.5,
    max: 0.5,
    step: 0.01,
    folder: "Color",
  },
  contrastAdjust: {
    type: "number",
    value: EFECTO_ASCII_POST_PROCESSING_DEFAULTS.contrastAdjust,
    min: 0.5,
    max: 2,
    step: 0.01,
    folder: "Color",
  },
  brightness: {
    type: "number",
    value: 1,
    min: 0,
    max: 2,
    step: 0.1,
    folder: "Media",
  },
  contrast: {
    type: "number",
    value: 1,
    min: 0,
    max: 2,
    step: 0.1,
    folder: "Media",
  },
  saturation: {
    type: "number",
    value: 1,
    min: 0,
    max: 2,
    step: 0.1,
    folder: "Media",
  },
} satisfies ControlsSchema;

type ControlValues = Record<string, unknown>;
type ControlSetter = (key: string, value: unknown) => void;

const getNumber = (value: unknown) =>
  typeof value === "number" ? value : undefined;
const getBoolean = (value: unknown) =>
  typeof value === "boolean" ? value : undefined;

const resolveNumber = (
  key: keyof typeof EFECTO_ASCII_POST_PROCESSING_DEFAULTS,
  controlValues: ControlValues,
  presetSettings: Partial<EfectoPublicAsciiPostProcessingSettings>,
  fallback: number
) => {
  const controlValue = getNumber(controlValues[key]);
  if (typeof controlValue === "number") {
    return controlValue;
  }

  const presetValue = getNumber(presetSettings[key]);
  if (typeof presetValue === "number") {
    return presetValue;
  }

  return fallback;
};

const resolveBoolean = (
  key: keyof typeof EFECTO_ASCII_POST_PROCESSING_DEFAULTS,
  controlValues: ControlValues,
  presetSettings: Partial<EfectoPublicAsciiPostProcessingSettings>,
  fallback: boolean
) => {
  const controlValue = getBoolean(controlValues[key]);
  if (typeof controlValue === "boolean") {
    return controlValue;
  }

  const presetValue = getBoolean(presetSettings[key]);
  if (typeof presetValue === "boolean") {
    return presetValue;
  }

  return fallback;
};

export const computePostProcessingState = (
  controlValues: ControlValues,
  presetKey: PostProcessingPresetKey
) => {
  const presetSettings = POST_PROCESSING_PRESETS[presetKey] ?? {};

  const paletteValue = (controlValues.colorPalette ??
    presetSettings.colorPalette ??
    "original") as EfectoAsciiColorPalette;

  const postProcessing: EfectoPublicAsciiPostProcessingSettings = {
    scanlineIntensity: resolveNumber(
      "scanlineIntensity",
      controlValues,
      presetSettings,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.scanlineIntensity
    ),
    scanlineCount: resolveNumber(
      "scanlineCount",
      controlValues,
      presetSettings,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.scanlineCount
    ),
    targetFPS: resolveNumber(
      "targetFPS",
      controlValues,
      presetSettings,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.targetFPS
    ),
    jitterIntensity: resolveNumber(
      "jitterIntensity",
      controlValues,
      presetSettings,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.jitterIntensity
    ),
    jitterSpeed: resolveNumber(
      "jitterSpeed",
      controlValues,
      presetSettings,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.jitterSpeed
    ),
    mouseGlowEnabled: resolveBoolean(
      "mouseGlowEnabled",
      controlValues,
      presetSettings,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.mouseGlowEnabled
    ),
    mouseGlowRadius: resolveNumber(
      "mouseGlowRadius",
      controlValues,
      presetSettings,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.mouseGlowRadius
    ),
    mouseGlowIntensity: resolveNumber(
      "mouseGlowIntensity",
      controlValues,
      presetSettings,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.mouseGlowIntensity
    ),
    vignetteIntensity: resolveNumber(
      "vignetteIntensity",
      controlValues,
      presetSettings,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.vignetteIntensity
    ),
    vignetteRadius: resolveNumber(
      "vignetteRadius",
      controlValues,
      presetSettings,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.vignetteRadius
    ),
    colorPalette: paletteValue,
    curvature: resolveNumber(
      "curvature",
      controlValues,
      presetSettings,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.curvature
    ),
    aberrationStrength: resolveNumber(
      "aberrationStrength",
      controlValues,
      presetSettings,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.aberrationStrength
    ),
    noiseIntensity: resolveNumber(
      "noiseIntensity",
      controlValues,
      presetSettings,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.noiseIntensity
    ),
    noiseScale: resolveNumber(
      "noiseScale",
      controlValues,
      presetSettings,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.noiseScale
    ),
    noiseSpeed: resolveNumber(
      "noiseSpeed",
      controlValues,
      presetSettings,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.noiseSpeed
    ),
    waveAmplitude: resolveNumber(
      "waveAmplitude",
      controlValues,
      presetSettings,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.waveAmplitude
    ),
    waveFrequency: resolveNumber(
      "waveFrequency",
      controlValues,
      presetSettings,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.waveFrequency
    ),
    waveSpeed: resolveNumber(
      "waveSpeed",
      controlValues,
      presetSettings,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.waveSpeed
    ),
    glitchIntensity: resolveNumber(
      "glitchIntensity",
      controlValues,
      presetSettings,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.glitchIntensity
    ),
    glitchFrequency: resolveNumber(
      "glitchFrequency",
      controlValues,
      presetSettings,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.glitchFrequency
    ),
    brightnessAdjust: resolveNumber(
      "brightnessAdjust",
      controlValues,
      presetSettings,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.brightnessAdjust
    ),
    contrastAdjust: resolveNumber(
      "contrastAdjust",
      controlValues,
      presetSettings,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.contrastAdjust
    ),
  };

  return { paletteValue, postProcessing, presetSettings };
};

export const applyPresetToControls = (
  presetKey: PostProcessingPresetKey,
  controlValues: ControlValues,
  setValue: ControlSetter
) => {
  const preset = POST_PROCESSING_PRESETS[presetKey];
  if (!preset) {
    return;
  }

  Object.entries(preset).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    if (controlValues[key] === value) {
      return;
    }
    setValue(key, value);
  });
};
