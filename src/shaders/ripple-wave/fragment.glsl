precision highp float;

in vec2 vUv;
out vec4 FragColor;

uniform float uTime;
uniform vec2 uResolution;
uniform float uIntensity;
uniform float uZoom;
uniform float uSpeed;
uniform vec3 uPaletteA;
uniform vec3 uPaletteB;
uniform int uHasPalette;

void main() {
  vec2 uv = vUv - 0.5;
  uv.x *= uResolution.x / max(uResolution.y, 1.0);
  uv *= uZoom;

  float t = uTime * uSpeed;
  float rings = sin(length(uv) * 8.0 - t * 1.5);
  float waves = sin((uv.x + uv.y) * 6.0 + t * 0.9);
  float glow = smoothstep(0.0, 1.0, rings * 0.5 + 0.5);

  vec3 base = mix(vec3(0.05, 0.1, 0.2), vec3(0.35, 0.8, 0.9), glow);
  if (uHasPalette == 1) {
    base = mix(uPaletteA, uPaletteB, glow);
  }
  vec3 color = base + waves * 0.12;
  color *= uIntensity;

  FragColor = vec4(color, 1.0);
}
