precision mediump float;

uniform vec3 uColor;

varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float dist = length(uv);
  float mask = smoothstep(0.5, 0.0, dist);
  if (mask <= 0.01) {
    discard;
  }

  float centerGlow = smoothstep(0.22, 0.0, dist);
  vec3 color = mix(uColor * 1.2, uColor, centerGlow);

  gl_FragColor = vec4(color, mask * vAlpha);
}
