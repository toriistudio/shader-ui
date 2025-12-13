precision highp float;

attribute float aK;
attribute float aE;
attribute float aRotation;

uniform float uTime;
uniform float uTimeScale;
uniform float uSpread;
uniform float uPointSize;
uniform float uMorph;
uniform vec3 uColor;

varying vec3 vColor;
varying float vWeight;

mat2 rotation(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

void main() {
  float time = uTime * uTimeScale;
  float d = 7.0 * cos(length(vec2(aK, aE)) / 3.0 + time * 0.5);

  vec2 basePoint = vec2(
    aK * 4.0 + d * aK * sin(d + aE / 9.0 + time),
    aE * 2.0 - d * 9.0 - d * 9.0 * cos(d + time)
  );

  vec2 altPoint = vec2(
    aK * 6.0 + sin(time * 1.3 + aE * 2.0) * (42.0 + 12.0 * sin(aE * 1.15)),
    aE * 3.4 - d * 12.5 + 28.0 * cos(time * 0.75 + aK * 0.35)
  );

  vec2 morphed = mix(basePoint, altPoint, uMorph);
  float swirl = aRotation + uMorph * (0.8 + 0.25 * sin(time * 0.4 + aE));
  vec2 rotated = rotation(swirl) * morphed;

  float spreadMix = mix(uSpread, uSpread * 0.65, uMorph);
  vec2 scaled = rotated / spreadMix;
  vec3 modelPosition = vec3(scaled, 0.0);

  float radial = length(morphed) / (spreadMix * 0.9);
  vWeight = clamp(1.0 - radial * radial, 0.0, 1.0);

  vColor = uColor;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(modelPosition, 1.0);
  gl_PointSize = uPointSize * mix(1.0, 1.35, uMorph);
}
