precision highp float;

uniform float uIntensity;
uniform float uExposure;
uniform float uPetalRadius;
uniform float uMorph;

varying vec3 vColor;
varying float vWeight;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float sigma = max(0.3, uPetalRadius * 10.0);
  float dist2 = dot(uv, uv);
  float alpha = exp(-dist2 / (sigma * sigma));

  if (alpha <= 0.01) {
    discard;
  }

  float weight = 0.6 + 0.4 * vWeight;
  float falloff = pow(alpha, 0.8);
  float morphBoost = mix(1.0, 1.35, uMorph);
  vec3 color = clamp(vColor * weight * falloff * (uIntensity * morphBoost), 0.0, 1.0);

  float outAlpha = clamp(alpha * mix(0.6, 0.85, uMorph), 0.0, 1.0);
  gl_FragColor = vec4(color, outAlpha);
}
