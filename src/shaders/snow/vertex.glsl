uniform float uTime;
uniform float uFallSpeed;
uniform float uWindStrength;
uniform float uTurbulence;
uniform float uSize;
uniform float uTwinkleStrength;
uniform vec3 uArea;

attribute float aSpeed;
attribute float aSize;
attribute float aSeed;

varying float vAlpha;

float wrap(float value, float size) {
  return mod(value + size * 0.5, size) - size * 0.5;
}

void main() {
  float height = uArea.y;
  float width = uArea.x;
  float depth = uArea.z;

  float fall = uFallSpeed * (0.3 + aSpeed);
  float droppedY = position.y - uTime * fall;
  float wrappedY = wrap(droppedY, height);

  float sway =
      sin((wrappedY + aSeed) * 0.45 + uTime * 0.8) * uTurbulence +
      cos(uTime * 0.35 + aSeed) * 0.15;
  float wind = uWindStrength * (0.4 + aSpeed);
  float displacedX = wrap(position.x + sway + wind, width);

  float driftZ =
      sin(uTime * 0.25 + aSeed * 1.7) * 0.5 +
      cos((wrappedY + aSeed) * 0.2) * 0.4;
  float displacedZ = wrap(position.z + driftZ, depth);

  vec4 modelPosition =
      modelMatrix * vec4(displacedX, wrappedY, displacedZ, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;

  float baseSize = mix(0.45, 1.0, aSize) * uSize;
  float twinkle =
      1.0 + sin(uTime * (0.6 + aSpeed) + aSeed) * uTwinkleStrength;
  float perspective = clamp(15.0 / max(1.0, -viewPosition.z), 0.5, 3.0);
  gl_PointSize = baseSize * twinkle * perspective;
  gl_Position = projectionMatrix * viewPosition;

  vAlpha = mix(0.35, 1.0, aSize);
}
