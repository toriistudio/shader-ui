precision highp float;

in vec2 vTextureCoord;

uniform sampler2D uTex;
uniform float uTime;
uniform float uProjectionSpeed;

out vec4 fragColor;

const float PI = 3.14159265;

vec3 ray(vec2 uv, vec2 m, float a) {
  vec2 s = (uv - 0.5) * 2.0;
  s.x *= a;
  s.y *= -1.0;

  float f = mix(radians(20.0), radians(120.0), 0.38);
  vec3 r = normalize(vec3(s * tan(f / 2.0), -1.0));

  float rx = (m.y - 0.5) * PI;
  float ry = (m.x - 0.5) * PI * 2.0;
  mat3 rY = mat3(cos(ry), 0.0, -sin(ry), 0.0, 1.0, 0.0, sin(ry), 0.0, cos(ry));
  mat3 rX = mat3(1.0, 0.0, 0.0, 0.0, cos(rx), sin(rx), 0.0, -sin(rx), cos(rx));

  return normalize(rX * rY * r);
}

vec2 directionToUv(vec3 d) {
  return vec2(atan(d.z, d.x) / (2.0 * PI) + 0.75, acos(clamp(d.y, -1.0, 1.0)) / PI);
}

vec4 sampleRepeat(vec2 uv) {
  vec2 f = vec2(uv.x, fract(uv.y));
  vec4 c = texture(uTex, f);

  float blendWidth = 0.1;
  float blendFactor = 0.0;
  if (f.y < blendWidth) {
    blendFactor = 1.0 - f.y / blendWidth;
  } else if (f.y > 1.0 - blendWidth) {
    blendFactor = (f.y - (1.0 - blendWidth)) / blendWidth;
  }

  if (blendFactor > 0.0) {
    blendFactor = smoothstep(0.0, 1.0, blendFactor);
    vec2 opposite = vec2(f.x, f.y > 0.5 ? f.y - 0.5 : f.y + 0.5);
    c = mix(c, texture(uTex, opposite), blendFactor);
  }

  return c;
}

void main() {
  vec2 uv = vTextureCoord;

  vec3 rd = ray(uv, vec2(0.5, 0.5056), 2.0);
  vec2 s = directionToUv(rd);

  float f = mix(radians(20.0), radians(120.0), 0.38);
  s = (s - 0.5) * (2.0 / tan(f / 2.0)) + 0.5;
  s += vec2(0.0, 0.02) * uTime * uProjectionSpeed;

  vec4 c = sampleRepeat(s);
  c.rgb = clamp(c.rgb - 0.14, 0.0, 1.0);

  float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  c.rgb = mix(vec3(l), c.rgb, 0.79);
  c.rgb = 1.22 * (c.rgb - 0.5) + 0.5;
  c.rgb = clamp(c.rgb, 0.0, 1.0);

  fragColor = c;
}
