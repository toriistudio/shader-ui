uniform vec2 uvScale;
uniform vec2 uvOffset;
varying vec2 vUv;

void main() {
  // Apply texture scale and offset for cover-fill effect
  vUv = uv * uvScale + uvOffset;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}