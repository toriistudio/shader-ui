precision highp float;
precision highp int;

in vec2 vTextureCoord;

uniform sampler2D uTexture;
uniform float uTime;
uniform float uDiffuseRadius;
uniform vec2 uMousePos;
uniform vec2 uResolution;

float ease (int easingFunc, float t) { return t; }
uvec2 pcg2d(uvec2 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.y * 1664525u + 1013904223u;
  v.y += v.x * v.x * 1664525u + 1013904223u;
  v ^= v >> 16;
  v.x += v.y * v.y * 1664525u + 1013904223u;
  v.y += v.x * v.x * 1664525u + 1013904223u;
  return v;
}
float randFibo(vec2 p) {
  uvec2 v = floatBitsToUint(p);
  v = pcg2d(v);
  uint r = v.x ^ v.y;
  return float(r) / float(0xffffffffu);
}

const float MAX_ITERATIONS = 24.0;
const float PI = 3.14159265;
const float TWOPI = 6.2831853;

out vec4 fragColor;

void main() {
  vec2 uv = vTextureCoord;
  vec2 pos = vec2(0.5, 0.5) + mix(vec2(0.0), (uMousePos - 0.5), 0.0000);
  float aspectRatio = uResolution.x / uResolution.y;
  float delta = fract(floor(uTime) / 20.0);
  float angle, rotation, amp;
  float inner = distance(uv * vec2(aspectRatio, 1.0), pos * vec2(aspectRatio, 1.0));
  float outer = max(0.0, 1.0 - distance(uv * vec2(aspectRatio, 1.0), pos * vec2(aspectRatio, 1.0)));
  float amount = 0.0900 * 2.0;

  vec2 mPos = vec2(0.5, 0.5) + mix(vec2(0.0), (uMousePos - 0.5), 0.0000);
  pos = vec2(0.5, 0.5);
  float radius = max(uDiffuseRadius, 0.0);
  radius = mix(0.0001, 1.5, clamp(radius, 0.0, 1.0));
  float dist = ease(0, max(0.0, 1.0 - distance(uv * vec2(aspectRatio, 1.0), mPos * vec2(aspectRatio, 1.0)) / radius));
  amount *= dist;

  vec4 col;
  if (amount <= 0.001) {
    col = texture(uTexture, uv);
  } else {
    vec4 result = vec4(0.0);
    float threshold = max(1.0 - 0.0000, 2.0 / MAX_ITERATIONS);
    const float invMaxIterations = 1.0 / float(MAX_ITERATIONS);
    vec2 dir = vec2(0.5000 / aspectRatio, 1.0 - 0.5000) * amount * 0.4;
    float iterations = 0.0;
    for (float i = 1.0; i <= MAX_ITERATIONS; i++) {
      float th = i * invMaxIterations;
      if (th > threshold) break;
      float random1 = randFibo(uv + th + delta);
      float random2 = randFibo(uv + th * 2.0 + delta);
      float random3 = randFibo(uv + th * 3.0 + delta);
      vec2 ranPoint = vec2(random1 * 2.0 - 1.0, random2 * 2.0 - 1.0) * mix(1.0, random3, 0.8);
      result += texture(uTexture, uv + ranPoint * dir);
      iterations += 1.0;
    }
    result /= max(1.0, iterations);
    col = result;
  }
  fragColor = col;
}
