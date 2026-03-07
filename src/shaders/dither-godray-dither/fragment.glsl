precision highp float;

in vec2 vTextureCoord;

uniform sampler2D uTexture;
uniform sampler2D uBackgroundTexture;
uniform float uHasBackground;
uniform float uDitherBackground;
uniform float uBackgroundAspect;
uniform float uBackgroundScale;
uniform vec2 uResolution;

out vec4 fragColor;

// Object-cover UV: fills the canvas, cropping the image centered at (0.5, 0.5).
// scale > 1 zooms in, scale < 1 zooms out.
vec2 coverUV(vec2 uv, float imageAspect, float canvasAspect, float scale) {
  vec2 offset = uv - 0.5;
  if (imageAspect > canvasAspect) {
    offset.x *= canvasAspect / imageAspect;
  } else {
    offset.y *= imageAspect / canvasAspect;
  }
  return (offset / scale) + 0.5;
}

void main() {
  vec2 uv = vTextureCoord;

  float ar = uResolution.x / uResolution.y;
  float ac = mix(ar, 1.0 / ar, 0.5);

  float gs = 0.005;
  float bg = 1.0 / gs;
  vec2 cellSize = vec2(1.0 / (bg * ar), 1.0 / bg) * ac;

  vec2 pos = vec2(0.5);
  vec2 off = uv - pos;
  vec2 cell = floor(off / cellSize);
  vec2 center = (cell + 0.5) * cellSize;
  vec2 pixelUv = center + pos;

  // Foreground dither
  vec4 c = texture(uTexture, pixelUv);
  float lum = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
  float gm = pow(mix(0.2, 2.2, 0.3), 2.2);

  vec2 local = mod(uv - pos, cellSize) / cellSize;
  vec2 ct = local * 2.0 - 1.0;
  float d = length(ct);

  float ns = 16.0;
  float si = clamp(floor(lum * ns * gm), 0.0, ns - 1.0);
  float rad = si / ns;
  float alpha = smoothstep(rad + 0.08, rad - 0.08, d);

  vec3 tint = (c.rgb - si * 0.04) * 1.4;

  // Background — sampled with cover UVs
  vec2 bgUV = coverUV(uv, uBackgroundAspect, ar, uBackgroundScale);
  vec2 bgCellUV = coverUV(pixelUv, uBackgroundAspect, ar, uBackgroundScale);

  float beamReveal = smoothstep(0.4, 0.75, lum);
  vec3 bgRaw = texture(uBackgroundTexture, bgUV).rgb;
  vec3 bgRawColor = mix(vec3(0.0), bgRaw, uHasBackground * beamReveal);

  // Background content at cell-snapped UV (pixelated)
  vec3 bgCell = texture(uBackgroundTexture, bgCellUV).rgb;

  // Dithered mode: background image multiplies the beam tint.
  // bgCell * 0.6 + 0.4 maps [0,1] → [0.4, 1.0], so:
  //   bright bg  → tint × 1.0  (same intensity as raw mode)
  //   dark bg    → tint × 0.4  (dark areas of image dim the beam)
  // The beam's hue is always preserved; the background shows as luminance texture.
  vec3 bgCell3 = bgCell * 0.6 + 0.4;
  vec3 bgFiltered = tint * bgCell3;
  vec3 bgDotContent = mix(tint, bgFiltered, uHasBackground);
  vec3 dotColor = mix(tint, bgDotContent, uDitherBackground);

  // Gap (between dots): raw bg reveal in raw mode, black in dithered mode.
  vec3 gapColor = bgRawColor * (1.0 - uDitherBackground);

  fragColor = vec4(mix(gapColor, dotColor, alpha), 1.0);
}
