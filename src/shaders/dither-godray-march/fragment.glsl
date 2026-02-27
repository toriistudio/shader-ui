precision highp float;

in vec2 vTextureCoord;
uniform sampler2D uTexture;
out vec4 fragColor;

void main() {
  vec3 col = vec3(0.0);
  vec2 pos = vec2(0.5);
  vec2 dir = (pos - vTextureCoord) * 0.02;
  float w = 1.0;
  vec2 tc = vTextureCoord;

  for (int i = 0; i < 16; i++) {
    col += texture(uTexture, tc).rgb * w;
    w *= 0.94;
    tc += dir;
  }

  fragColor = vec4(col / 16.0, length(tc - vTextureCoord));
}
