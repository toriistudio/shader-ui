precision highp float;
precision highp int;

in vec2 vTextureCoord;

uniform sampler2D uTexture;
uniform vec2 uMousePos;
uniform vec2 uResolution;
uniform float uBlurRadius;

float ease (int easingFunc, float t) {
  return t < 0.5 ? 2.0 * t * t : -1.0 + (4.0 - 2.0 * t) * t;
}

out vec4 fragColor;

const int kernelSize = 36;

float getGaussianWeight(int index) {
  switch(index) {
    case 0: return 0.00094768;
    case 1: return 0.00151965;
    case 2: return 0.00237008;
    case 3: return 0.00359517;
    case 4: return 0.0053041;
    case 5: return 0.00761097;
    case 6: return 0.01062197;
    case 7: return 0.01441804;
    case 8: return 0.01903459;
    case 9: return 0.0244409;
    case 10: return 0.03052299;
    case 11: return 0.03707432;
    case 12: return 0.04379813;
    case 13: return 0.05032389;
    case 14: return 0.05623791;
    case 15: return 0.06112521;
    case 16: return 0.06461716;
    case 17: return 0.06643724;
    case 18: return 0.06643724;
    case 19: return 0.06461716;
    case 20: return 0.06112521;
    case 21: return 0.05623791;
    case 22: return 0.05032389;
    case 23: return 0.04379813;
    case 24: return 0.03707432;
    case 25: return 0.03052299;
    case 26: return 0.0244409;
    case 27: return 0.01903459;
    case 28: return 0.01441804;
    case 29: return 0.01062197;
    case 30: return 0.00761097;
    case 31: return 0.0053041;
    case 32: return 0.00359517;
    case 33: return 0.00237008;
    case 34: return 0.00151965;
    case 35: return 0.00094768;
    default: return 0.0;
  }
}

vec4 GaussianBlur(sampler2D tex, vec2 uv, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 pos = vec2(0.5, 0.5) + mix(vec2(0.0), (uMousePos - 0.5), 0.0000);
  float inner = distance(uv, pos);
  float outer = max(0.0, 1.0 - distance(uv, pos));
  float radius = mix(0.0, 1.5, clamp(uBlurRadius, 0.0, 1.0));
  float amt = 0 <= 1 ? 6.0 : 11.0;
  float amount = (0.4700 * amt) * ease(3, mix(inner, outer, 0.5000)) * radius;
  color += texture(tex, uv) * getGaussianWeight(0);
  for (int i = 0; i < kernelSize; i++) {
    float x = float(i - kernelSize / 2) * amount;
    color += texture(tex, uv + vec2(x * 0.001) * direction * vec2(0.5000, 1.0 - 0.5000)) * getGaussianWeight(i);
  }
  return color;
}

vec4 blur(vec2 uv, vec2 direction) {
  return GaussianBlur(uTexture, uv, direction);
}

void main() {
  vec2 uv = vTextureCoord;
  vec4 color = vec4(0.0);
  int dir = 0 % 2;
  vec2 direction = dir == 1 ? vec2(0.0, uResolution.x / uResolution.y) : vec2(1.0, 0.0);
  color = blur(uv, direction);
  fragColor = color;
}
