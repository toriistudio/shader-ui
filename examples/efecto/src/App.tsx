"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Playground,
  useControls,
  type ControlsSchema,
  type CopyButtonFnArgs,
  type UploadedMedia,
} from "@toriistudio/v0-playground";

import {
  Efecto,
  EFECTO_ASCII_COMPONENT_DEFAULTS,
  type EfectoAsciiStyle,
} from "@toriistudio/shader-ui";

import {
  PRESET_MEDIA,
  ASCII_CONTROL_SCHEMA,
  applyPresetToControls,
  computePostProcessingState,
  type PostProcessingPresetKey,
} from "./presets";

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
        presetMedia: PRESET_MEDIA,
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
  const { postProcessing } = computePostProcessingState(
    controlValues,
    presetKey
  );

  useEffect(() => {
    applyPresetToControls(
      presetKey,
      controlValuesRef.current,
      setValueRef.current
    );
  }, [presetKey]);

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

  const activeSrc = uploadedMedia?.src ?? PRESET_MEDIA[0]?.src;

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
