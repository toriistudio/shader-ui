precision highp float;

in vec2 vTextureCoord;
uniform sampler2D uScene;
uniform sampler2D uGR;
uniform float uGodrayIntensity;
out vec4 fragColor;

void main() {
  vec3 bg = texture(uScene, vTextureCoord).rgb;
  vec3 gr = texture(uGR, vTextureCoord).rgb;
  fragColor = vec4(bg + gr * uGodrayIntensity, 1.0);
}
