#define M_PI 3.1415926535897932384626433832795

uniform float uTime;
uniform float uWind;
uniform float uBaseSize;
uniform float uDistanceOffset;
uniform float uDistanceStrength;

varying float vAlpha;

highp float random(vec2 co) {
  highp float a = 12.9898;
  highp float b = 78.233;
  highp float c = 43758.5453;
  highp float dt = dot(co.xy, vec2(a, b));
  highp float sn = mod(dt, M_PI);

  return fract(sin(sn) * c);
}

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);

  modelPosition.x = mod(
      modelPosition.x + uTime * ((uWind * 0.5) + (uWind * 0.5) * random(modelPosition.yz)),
      20.0
    ) -
    10.0;

  modelPosition.y =
      modelPosition.y + sin(modelPosition.x) * 0.3 +
      modelPosition.y + sin(modelPosition.x * 0.357) * 0.3;

  vec4 viewPosition = viewMatrix * modelPosition;
  float cameraDistance = distance(vec4(0.0), viewPosition);

  float sizeFalloff =
      clamp((cameraDistance - uDistanceOffset) * uDistanceStrength, 0.0, uBaseSize);

  gl_PointSize = uBaseSize - sizeFalloff;
  gl_Position = projectionMatrix * viewPosition;

  vAlpha = 1.0 - clamp(cameraDistance * 0.5 / 12.0, 0.0, 1.0);
}
