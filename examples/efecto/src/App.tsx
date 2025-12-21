"use client";

import { useEffect, useRef } from "react";

import {
  Playground,
  useControls,
  type ControlsSchema,
  type CopyButtonFnArgs,
  type UploadedMedia,
} from "@toriistudio/v0-playground";
import { useCallback, useMemo, useState } from "react";

import {
  Efecto,
  EFECTO_ASCII_COMPONENT_DEFAULTS,
  EFECTO_ASCII_POST_PROCESSING_DEFAULTS,
  type EfectoAsciiColorPalette,
  type EfectoAsciiStyle,
  type EfectoPublicAsciiPostProcessingSettings,
} from "@toriistudio/shader-ui";

const PORTRAIT_IMAGE_URL =
  "https://res.cloudinary.com/dz8kk1l4r/image/upload/v1763233793/portrait_hd7dyc.png";

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

const POST_PROCESSING_PRESETS = {
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

type PostProcessingPresetKey = keyof typeof POST_PROCESSING_PRESETS;

const POST_PROCESSING_PRESET_OPTIONS: Record<PostProcessingPresetKey, string> =
  {
    none: "None",
    crt: "CRT",
    terminal: "Terminal",
    glitch: "Glitch",
    retro: "Retro",
  };

const ASCII_CONTROL_SCHEMA = {
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

function EfectoPreview() {
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia | null>(
    null
  );

  const handleSelectMedia = useCallback((media: UploadedMedia) => {
    if (media.type !== "image") {
      return;
    }
    setUploadedMedia(media);
  }, []);

  const handleClearMedia = useCallback(() => {
    setUploadedMedia(null);
  }, []);

  const controlSchema = useMemo<ControlsSchema>(
    () => ({
      ...ASCII_CONTROL_SCHEMA,
    }),
    [handleClearMedia, handleSelectMedia]
  );

  const controlValues = useControls(controlSchema, {
    componentName: "Efecto",
    config: {
      mainLabel: "Efecto Controls",
      showGrid: false,
      showCopyButton: false,
      showCodeSnippet: true,
      addMediaUploadControl: {
        folder: "Input Source",
        folderPlacement: "top",
        onSelectMedia: handleSelectMedia,
        onClear: handleClearMedia,
      },
      showCopyButtonFn: useCallback(
        ({ values, jsonToComponentString }: CopyButtonFnArgs) => {
          const sharedProps = {
            mediaAdjustments: {
              brightness: values.brightness,
              contrast: values.contrast,
              saturation: values.saturation,
            },
            mouseParallax: values.mouseParallax ?? false,
            parallaxIntensity:
              typeof values.parallaxIntensity === "number"
                ? values.parallaxIntensity
                : 0.5,
            postProcessing: {
              scanlineIntensity: values.scanlineIntensity,
              scanlineCount: values.scanlineCount,
              targetFPS: values.targetFPS,
              jitterIntensity: values.jitterIntensity,
              jitterSpeed: values.jitterSpeed,
              mouseGlowEnabled: values.mouseGlowEnabled,
              mouseGlowRadius: values.mouseGlowRadius,
              mouseGlowIntensity: values.mouseGlowIntensity,
              vignetteIntensity: values.vignetteIntensity,
              vignetteRadius: values.vignetteRadius,
              colorPalette: values.colorPalette,
              curvature: values.curvature,
              aberrationStrength: values.aberrationStrength,
              noiseIntensity: values.noiseIntensity,
              noiseScale: values.noiseScale,
              noiseSpeed: values.noiseSpeed,
              waveAmplitude: values.waveAmplitude,
              waveFrequency: values.waveFrequency,
              waveSpeed: values.waveSpeed,
              glitchIntensity: values.glitchIntensity,
              glitchFrequency: values.glitchFrequency,
              brightnessAdjust: values.brightnessAdjust,
              contrastAdjust: values.contrastAdjust,
            },
            src: "/your-image-or-video-url",
          };

          return jsonToComponentString({
            componentName: "Efecto",
            props: {
              cellSize: values.cellSize,
              invert: values.invert,
              colorMode: values.colorMode,
              style: values.style,
              ...sharedProps,
            },
          });
        },
        []
      ),
    },
  });

  const controlValuesRef = useRef<Record<string, any>>(controlValues);
  controlValuesRef.current = controlValues;
  const setValueRef = useRef(controlValues.setValue);
  setValueRef.current = controlValues.setValue;

  const asciiStyle = (controlValues.style ??
    EFECTO_ASCII_COMPONENT_DEFAULTS.asciiStyle) as EfectoAsciiStyle;
  const presetKey = (controlValues.preset ?? "none") as PostProcessingPresetKey;
  const presetSettings = POST_PROCESSING_PRESETS[presetKey] ?? {};
  const paletteValue = (controlValues.colorPalette ??
    (presetSettings.colorPalette as EfectoAsciiColorPalette | undefined) ??
    "original") as EfectoAsciiColorPalette;

  useEffect(() => {
    const preset = POST_PROCESSING_PRESETS[presetKey];
    if (!preset) {
      return;
    }

    const latestValues = controlValuesRef.current;
    const setter = setValueRef.current;
    Object.entries(preset).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }
      if (latestValues[key] === value) {
        return;
      }
      setter(key, value);
    });
  }, [presetKey]);

  const resolveNumber = (
    key: keyof typeof ASCII_CONTROL_SCHEMA,
    presetValue: number | undefined,
    fallback: number
  ) => {
    const controlValue = controlValues[key];
    if (typeof controlValue === "number") {
      return controlValue;
    }
    if (typeof presetValue === "number") {
      return presetValue;
    }
    return fallback;
  };

  const resolveBoolean = (
    key: keyof typeof ASCII_CONTROL_SCHEMA,
    presetValue: boolean | undefined,
    fallback: boolean
  ) => {
    const controlValue = controlValues[key];
    if (typeof controlValue === "boolean") {
      return controlValue;
    }
    if (typeof presetValue === "boolean") {
      return presetValue;
    }
    return fallback;
  };

  const postProcessing: PublicAsciiPostProcessingSettings = {
    scanlineIntensity: resolveNumber(
      "scanlineIntensity",
      presetSettings.scanlineIntensity,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.scanlineIntensity
    ),
    scanlineCount: resolveNumber(
      "scanlineCount",
      presetSettings.scanlineCount,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.scanlineCount
    ),
    targetFPS: resolveNumber(
      "targetFPS",
      presetSettings.targetFPS,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.targetFPS
    ),
    jitterIntensity: resolveNumber(
      "jitterIntensity",
      presetSettings.jitterIntensity,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.jitterIntensity
    ),
    jitterSpeed: resolveNumber(
      "jitterSpeed",
      presetSettings.jitterSpeed,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.jitterSpeed
    ),
    mouseGlowEnabled: resolveBoolean(
      "mouseGlowEnabled",
      presetSettings.mouseGlowEnabled,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.mouseGlowEnabled
    ),
    mouseGlowRadius: resolveNumber(
      "mouseGlowRadius",
      presetSettings.mouseGlowRadius,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.mouseGlowRadius
    ),
    mouseGlowIntensity: resolveNumber(
      "mouseGlowIntensity",
      presetSettings.mouseGlowIntensity,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.mouseGlowIntensity
    ),
    vignetteIntensity: resolveNumber(
      "vignetteIntensity",
      presetSettings.vignetteIntensity,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.vignetteIntensity
    ),
    vignetteRadius: resolveNumber(
      "vignetteRadius",
      presetSettings.vignetteRadius,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.vignetteRadius
    ),
    colorPalette: paletteValue,
    curvature: resolveNumber(
      "curvature",
      presetSettings.curvature,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.curvature
    ),
    aberrationStrength: resolveNumber(
      "aberrationStrength",
      presetSettings.aberrationStrength,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.aberrationStrength
    ),
    noiseIntensity: resolveNumber(
      "noiseIntensity",
      presetSettings.noiseIntensity,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.noiseIntensity
    ),
    noiseScale: resolveNumber(
      "noiseScale",
      presetSettings.noiseScale,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.noiseScale
    ),
    noiseSpeed: resolveNumber(
      "noiseSpeed",
      presetSettings.noiseSpeed,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.noiseSpeed
    ),
    waveAmplitude: resolveNumber(
      "waveAmplitude",
      presetSettings.waveAmplitude,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.waveAmplitude
    ),
    waveFrequency: resolveNumber(
      "waveFrequency",
      presetSettings.waveFrequency,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.waveFrequency
    ),
    waveSpeed: resolveNumber(
      "waveSpeed",
      presetSettings.waveSpeed,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.waveSpeed
    ),
    glitchIntensity: resolveNumber(
      "glitchIntensity",
      presetSettings.glitchIntensity,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.glitchIntensity
    ),
    glitchFrequency: resolveNumber(
      "glitchFrequency",
      presetSettings.glitchFrequency,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.glitchFrequency
    ),
    brightnessAdjust: resolveNumber(
      "brightnessAdjust",
      presetSettings.brightnessAdjust,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.brightnessAdjust
    ),
    contrastAdjust: resolveNumber(
      "contrastAdjust",
      presetSettings.contrastAdjust,
      EFECTO_ASCII_POST_PROCESSING_DEFAULTS.contrastAdjust
    ),
  };

  const mediaAdjustments = {
    brightness:
      typeof controlValues.brightness === "number"
        ? controlValues.brightness
        : 1,
    contrast:
      typeof controlValues.contrast === "number" ? controlValues.contrast : 1,
    saturation:
      typeof controlValues.saturation === "number"
        ? controlValues.saturation
        : 1,
  };

  const mouseParallax =
    typeof controlValues.mouseParallax === "boolean"
      ? controlValues.mouseParallax
      : false;
  const parallaxIntensity =
    typeof controlValues.parallaxIntensity === "number"
      ? controlValues.parallaxIntensity
      : 0.5;

  const activeSrc = uploadedMedia?.src ?? PORTRAIT_IMAGE_URL;

  return (
    <Efecto
      className="relative h-full w-full overflow-hidden"
      style={asciiStyle}
      cellSize={
        typeof controlValues.cellSize === "number"
          ? controlValues.cellSize
          : EFECTO_ASCII_COMPONENT_DEFAULTS.cellSize
      }
      invert={
        typeof controlValues.invert === "boolean"
          ? controlValues.invert
          : EFECTO_ASCII_COMPONENT_DEFAULTS.invert
      }
      colorMode={
        typeof controlValues.colorMode === "boolean"
          ? controlValues.colorMode
          : EFECTO_ASCII_COMPONENT_DEFAULTS.colorMode
      }
      postProcessing={postProcessing}
      src={activeSrc}
      mouseParallax={mouseParallax}
      parallaxIntensity={parallaxIntensity}
      mediaAdjustments={mediaAdjustments}
    />
  );
}

export default function EfectoPage() {
  return (
    <Playground>
      <EfectoPreview />
    </Playground>
  );
}
