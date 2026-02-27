precision highp float;

in vec2 vTextureCoord;
uniform sampler2D uTexture;
out vec4 fragColor;

void main() {
  vec4 c = texture(uTexture, vTextureCoord);
  float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  fragColor = c * smoothstep(-0.1, 0.0, l);
}
