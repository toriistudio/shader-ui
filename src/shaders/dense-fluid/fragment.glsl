precision highp float;

in vec2 vUv;
out vec4 FragColor;

uniform float uTime;
uniform vec2  uResolution;
uniform float uTimeScale;
uniform float uAmpDecay;
const int NUM_RIPPLES = 6;
uniform vec2  uRippleOrigins[NUM_RIPPLES];
uniform float uRippleStarts[NUM_RIPPLES];
uniform vec3  uColor;
uniform int   uHasColor;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289v2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289v2(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p, float t) {
  float val = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 5; i++) {
    val += amp * snoise(p * freq + t * 0.3);
    freq *= 2.1;
    amp *= uAmpDecay;
    p += vec2(1.7, 9.2);
  }
  return val;
}

void main() {
  vec2 p = vUv - 0.5;
  p.x *= uResolution.x / max(uResolution.y, 1.0);

  float t = uTime * uTimeScale;

  // Ripple displacement — expanding rings from click/drag events
  vec2 rippleDisp = vec2(0.0);
  for (int i = 0; i < NUM_RIPPLES; i++) {
    float start = uRippleStarts[i];
    if (start < 0.0) continue;
    float age = uTime - start;
    if (age > 3.0) continue;

    vec2 rOrigin = uRippleOrigins[i] - 0.5;
    rOrigin.x *= uResolution.x / max(uResolution.y, 1.0);

    vec2 diff = p - rOrigin;
    float dist = length(diff);
    vec2 dir = normalize(diff + 0.0001);

    float radius = age * 0.5;
    float ring = exp(-(dist - radius) * (dist - radius) * 30.0);
    float decay = exp(-age * 1.2);
    float n = snoise(p * 3.0 + age * 0.4);
    rippleDisp += dir * ring * decay * 0.18
      + vec2(n, snoise(p * 3.0 + vec2(5.0) + age * 0.4)) * ring * decay * 0.05;
  }
  p += rippleDisp;

  // Triple-layer domain-warped FBM
  vec2 q = vec2(fbm(p + vec2(0.0, 0.0), t),
                fbm(p + vec2(5.2, 1.3), t));

  vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2), t * 1.2),
                fbm(p + 4.0 * q + vec2(8.3, 2.8), t * 1.2));

  float f = fbm(p + 3.5 * r, t * 0.8);

  // Color mixing
  vec3 col;
  if (uHasColor == 1) {
    vec3 dark = uColor * 0.25;
    vec3 mid = uColor;
    vec3 bright = uColor * 1.35;
    col = mix(dark, mid, clamp(f * f * 2.0, 0.0, 1.0));
    col = mix(col, mid, clamp(length(q) * 0.5, 0.0, 1.0));
    col = mix(col, bright, clamp(length(r.x) * 0.6, 0.0, 1.0));
  } else {
    col = mix(vec3(0.075, 0.065, 0.055), vec3(0.20, 0.14, 0.07), clamp(f * f * 2.0, 0.0, 1.0));
    col = mix(col, vec3(0.78, 0.58, 0.24), clamp(length(q) * 0.5, 0.0, 1.0));
    col = mix(col, vec3(0.95, 0.75, 0.35), clamp(length(r.x) * 0.6, 0.0, 1.0));
  }

  // Highlight boost
  float highlight = smoothstep(0.5, 1.2, f * f * 3.0 + length(r) * 0.5);
  col += vec3(0.18, 0.12, 0.04) * highlight;

  // Gamma
  col = pow(col, vec3(1.1));

  FragColor = vec4(col, 1.0);
}
