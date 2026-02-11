precision highp float;
precision highp int;

in vec2 vUv;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uPos;
uniform vec3 uColor;
uniform float uSpeed;
uniform float uAlpha;

out vec4 fragColor;

const float PI = 3.14159265359;
const float TWO_PI = 6.28318530718;

mat2 rot(float a) { return mat2(cos(a),-sin(a),sin(a),cos(a)); }

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

vec3 drawExpandingRings(vec2 uv, vec2 center) {
  float aspectRatio = uResolution.x / uResolution.y;
  uv.x *= aspectRatio;
  center.x *= aspectRatio;

  vec2 corners[4];
  corners[0] = vec2(0.0, 0.0);
  corners[1] = vec2(1.0, 0.0);
  corners[2] = vec2(0.0, 1.0);
  corners[3] = vec2(1.0, 1.0);

  float maxRadius = 0.0;
  for (int i = 0; i < 4; i++) {
    vec2 c = corners[i];
    c.x *= aspectRatio;
    maxRadius = max(maxRadius, length(c - center));
  }

  float modulo = fract(uTime * uSpeed);
  float ringRadius = maxRadius * modulo;

  float distFromCenter = length(uv - center);
  float ringDist = abs(distFromCenter - ringRadius);

  float lineRadius = 0.5 * modulo;
  float brightness = lineRadius / (1.0 - smoothstep(0.2, 0.002, ringDist + 0.02));
  brightness *= max(0.0, 1.0 - modulo);

  vec3 ringColor = brightness * pow(1.0 - ringDist, 3.0) * uColor;
  return ringColor;
}

void main() {
  vec2 uv = vUv;
  vec3 ring = drawExpandingRings(uv, uPos);
  float a = clamp(luma(ring) * uAlpha, 0.0, 1.0);
  fragColor = vec4(ring, a);
}
