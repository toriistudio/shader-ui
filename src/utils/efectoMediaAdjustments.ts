export type EfectoMediaAdjustments = {
  brightness?: number;
  contrast?: number;
  saturation?: number;
};

export const EFECTO_MEDIA_ADJUSTMENT_DEFAULTS: Required<EfectoMediaAdjustments> =
  {
    brightness: 1,
    contrast: 1,
    saturation: 1,
  };

export const resolveEfectoMediaAdjustments = (
  adjustments?: EfectoMediaAdjustments
): Required<EfectoMediaAdjustments> => ({
  brightness:
    typeof adjustments?.brightness === "number"
      ? adjustments.brightness
      : EFECTO_MEDIA_ADJUSTMENT_DEFAULTS.brightness,
  contrast:
    typeof adjustments?.contrast === "number"
      ? adjustments.contrast
      : EFECTO_MEDIA_ADJUSTMENT_DEFAULTS.contrast,
  saturation:
    typeof adjustments?.saturation === "number"
      ? adjustments.saturation
      : EFECTO_MEDIA_ADJUSTMENT_DEFAULTS.saturation,
});
