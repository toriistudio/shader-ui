precision highp float;

in vec2 vTextureCoord;

uniform sampler2D uTexture;
uniform vec2 uResolution;

out vec4 fragColor;

void main() {
  vec2 uv = vTextureCoord;

  float ar = uResolution.x / uResolution.y;
  float ac = mix(ar, 1.0 / ar, 0.5);

  float gs = 0.005;
  float bg = 1.0 / gs;
  vec2 cellSize = vec2(1.0 / (bg * ar), 1.0 / bg) * ac;

  vec2 pos = vec2(0.5);
  vec2 off = uv - pos;
  vec2 cell = floor(off / cellSize);
  vec2 center = (cell + 0.5) * cellSize;
  vec2 pixelUv = center + pos;

  vec4 c = texture(uTexture, pixelUv);
  float lum = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
  float gm = pow(mix(0.2, 2.2, 0.3), 2.2);

  vec2 local = mod(uv - pos, cellSize) / cellSize;
  vec2 ct = local * 2.0 - 1.0;
  float d = length(ct);

  float ns = 16.0;
  float si = clamp(floor(lum * ns * gm), 0.0, ns - 1.0);
  float rad = si / ns;
  float alpha = smoothstep(rad + 0.08, rad - 0.08, d);

  vec3 tint = (c.rgb - si * 0.04) * 1.4;
  fragColor = vec4(mix(vec3(0.0), tint, alpha), 1.0);
}
