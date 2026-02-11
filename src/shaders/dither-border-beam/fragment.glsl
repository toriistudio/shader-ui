precision highp float;
precision highp int;

in vec2 vUv;

uniform float uThickness;
uniform float uIntensity;
uniform vec3 uColor;
uniform float uAlpha;
uniform int uUseDither;
uniform float uDitherStrength;
uniform int uUseTonemap;

out vec4 fragColor;

// PCG-ish hash, similar spirit to Unicorn's randFibo usage
uvec2 pcg2d(uvec2 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.y * 1664525u + 1013904223u;
  v.y += v.x * v.x * 1664525u + 1013904223u;
  v ^= v >> 16u;
  v.x += v.y * v.y * 1664525u + 1013904223u;
  v.y += v.x * v.x * 1664525u + 1013904223u;
  return v;
}

float rand01(vec2 p) {
  uvec2 v = floatBitsToUint(p);
  v = pcg2d(v);
  uint r = v.x ^ v.y;
  return float(r) / float(0xffffffffu);
}

vec3 tonemapTanh(vec3 x) {
  x = clamp(x, -40.0, 40.0);
  return (exp(x) - exp(-x)) / (exp(x) + exp(-x));
}

float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

vec3 drawViewportEdges(vec2 uv) {
  float distToEdge = min(min(uv.x, uv.y), min(1.0 - uv.x, 1.0 - uv.y));
  float sdf = distToEdge;

  // Unicorn formula:
  // glow = glowThickness / (1.0 - smoothstep(0.12, 0.01, abs(sdf) + 0.02));
  float glow = uThickness / (1.0 - smoothstep(0.12, 0.01, abs(sdf) + 0.02));

  vec3 beam = glow * pow(1.0 - abs(sdf), 3.0) * uColor;
  return beam * uIntensity;
}

void main() {
  vec2 uv = vUv;

  vec3 beam = drawViewportEdges(uv);
  if (uUseTonemap == 1) {
    beam = tonemapTanh(beam);
  }

  // We render just the beam. Composition happens in later passes.
  // Alpha in Unicorn was max(bg.a, luma(beam)); here we output beam-only alpha.
  float a = clamp(luma(beam) * uAlpha, 0.0, 1.0);

  // Tiny dither (like Unicorn /255.0)
  if (uUseDither == 1) {
    float d = (rand01(gl_FragCoord.xy) - 0.5) * uDitherStrength;
    beam += d;
  }

  fragColor = vec4(beam, a);
}
