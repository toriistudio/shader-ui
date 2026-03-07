precision highp float;
precision highp int;

in vec2 vTextureCoord;

uniform sampler2D uTexture;
uniform float uTime;
uniform vec2 uResolution;
uniform float uBeamSpeed;
uniform float uBeamDirection;
uniform vec3 uBeamColor;
uniform vec2 uBeamCenter;
uniform float uBeamRadius;
uniform float uBeamScale;
uniform int uPathShape;
uniform int uCustomPointCount;
uniform vec2 uCustomPoints[64];
uniform vec2 uPathPos;
uniform float uPathAngle;

out vec4 fragColor;

const float PI = 3.14159265;
const float TWO_PI = 6.28318531;
const int MAX_CUSTOM_POINTS = 64;

uvec2 hash2d(uvec2 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.y * 1664525u + 1013904223u;
  v.y += v.x * v.x * 1664525u + 1013904223u;
  v ^= v >> 16u;
  v.x += v.y * v.y * 1664525u + 1013904223u;
  v.y += v.x * v.x * 1664525u + 1013904223u;
  return v;
}

float randomFibo(vec2 p) {
  uvec2 v = floatBitsToUint(p);
  v = hash2d(v);
  return float(v.x ^ v.y) / float(0xffffffffu);
}

float calculateAngle(vec2 p, vec2 c) {
  float a = atan(p.y - c.y, p.x - c.x);
  return a < 0.0 ? a + TWO_PI : a;
}

float angularDiff(float a, float b) {
  float d = abs(a - b);
  return d > PI ? TWO_PI - d : d;
}

float angularFade(float pointAngle, float peakAngle, float fadeAmount) {
  return 1.04 - smoothstep(0.0, fadeAmount, angularDiff(pointAngle, peakAngle));
}

float sdEquilateralTriangle(vec2 p) {
  const float k = 1.7320508;
  p.x = abs(p.x) - 1.0;
  p.y = p.y + 1.0 / k;
  if (p.x + k * p.y > 0.0) {
    p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  }
  p.x -= clamp(p.x, -2.0, 0.0);
  return -length(p) * sign(p.y);
}

vec3 dodge(vec3 src, vec3 dst) {
  return vec3(
    src.x >= 1.0 ? 1.0 : min(1.0, dst.x / max(0.001, 1.0 - src.x)),
    src.y >= 1.0 ? 1.0 : min(1.0, dst.y / max(0.001, 1.0 - src.y)),
    src.z >= 1.0 ? 1.0 : min(1.0, dst.z / max(0.001, 1.0 - src.z))
  );
}

float easeExpoIn(float t) {
  return t <= 0.0 ? 0.0 : pow(2.0, 10.0 * (t - 1.0));
}

vec2 rot2(vec2 v, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
}

float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.00001), 0.0, 1.0);
  return length(pa - ba * h);
}

vec3 beamAt(vec2 uv) {
  float aspect = uResolution.x / uResolution.y;
  vec2 center = uBeamCenter;

  vec2 u2 = vec2(uv.x * aspect, uv.y);
  vec2 c2 = vec2(center.x * aspect, center.y);

  float ringRadius = uBeamRadius;
  vec2 delta = (u2 - c2) / max(uBeamScale, 0.0001);
  float circleDist = abs(length(delta) - ringRadius);
  float squareDist = abs(max(abs(delta.x), abs(delta.y)) - ringRadius);
  float diamondDist = abs(abs(delta.x) + abs(delta.y) - ringRadius);
  float ovalDist =
    abs(length(vec2(delta.x / 1.5, delta.y)) - ringRadius);
  float triangleDist =
    abs(sdEquilateralTriangle(delta / max(ringRadius, 0.0001))) * ringRadius;
  float customDist = 10.0;

  float ringDist = circleDist;
  if (uPathShape == 1) {
    ringDist = squareDist;
  } else if (uPathShape == 2) {
    ringDist = diamondDist;
  } else if (uPathShape == 3) {
    ringDist = triangleDist;
  } else if (uPathShape == 4) {
    ringDist = ovalDist;
  } else if (uPathShape == 5 && uCustomPointCount > 1) {
    vec2 uva = vec2(uv.x * aspect, uv.y);
    for (int i = 0; i < MAX_CUSTOM_POINTS - 1; i++) {
      if (i >= uCustomPointCount - 1) {
        break;
      }
      vec2 a = vec2(uCustomPoints[i].x * aspect, uCustomPoints[i].y);
      vec2 b = vec2(uCustomPoints[i + 1].x * aspect, uCustomPoints[i + 1].y);
      customDist = min(customDist, segmentDistance(uva, a, b));
    }
    ringDist = customDist;
  }

  float b = 0.25 / (1.0 - smoothstep(0.2, 0.002, ringDist + 0.02));
  float ang = fract(0.19 + uTime * uBeamSpeed * uBeamDirection) * TWO_PI;
  b *= angularFade(calculateAngle(u2, c2), ang, PI * 0.5);

  vec3 col = b * pow(max(0.0, 1.0 - ringDist), 3.0) * uBeamColor;
  col = tanh(clamp(col, -40.0, 40.0));
  col += (randomFibo(gl_FragCoord.xy) - 0.5) / 255.0;

  return col;
}

void main() {
  vec2 uv = vTextureCoord;

  float ang = uPathAngle;
  vec2 pos = uPathPos;
  vec2 off = uv - pos;
  vec2 ro = rot2(off, -ang);
  vec2 so = ro;

  if (ro.x > 0.0) {
    float e = easeExpoIn(ro.x);
    so.y = ro.y / (1.0 + 4.0 * e * e);
  }

  vec2 st = clamp(pos + rot2(so, ang), 0.0, 1.0);

  vec3 beam = beamAt(st);
  vec4 img = texture(uTexture, st);
  vec3 outColor = mix(beam, dodge(img.rgb, beam), img.a);

  fragColor = vec4(outColor, 1.0);
}
