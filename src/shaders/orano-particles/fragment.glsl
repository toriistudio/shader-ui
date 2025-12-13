uniform vec3 uColor;
uniform float uAlpha;

varying float vAlpha;

void main() {
  gl_FragColor = vec4(uColor, vAlpha * uAlpha);
}
