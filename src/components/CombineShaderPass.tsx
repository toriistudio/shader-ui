"use client";

import { useMemo } from "react";
import * as THREE from "three";

import ShaderPass from "@/components/ShaderPass";

export type CombineMode =
  | "add"
  | "screen"
  | "multiply"
  | "overlay"
  | "max"
  | "min"
  | "difference"
  | "alphaOver"
  | "premultipliedOver"
  | "lerp"
  | "mask";

export type Tonemap = "none" | "reinhard" | "aces";

export type CombineShaderPassProps = {
  inputA: THREE.Texture;
  inputB: THREE.Texture;
  mode?: CombineMode;
  opacityA?: number;
  opacityB?: number;
  clampOutput?: boolean;
  mix?: number;
  maskTexture?: THREE.Texture;
  maskChannel?: 0 | 1 | 2 | 3;
  maskThreshold?: number;
  invertMask?: boolean;
  tonemap?: Tonemap;
  target?: THREE.WebGLRenderTarget | null;
  clear?: boolean;
  priority?: number;
};

const COMBINE_MODE: Record<CombineMode, number> = {
  add: 0,
  screen: 1,
  multiply: 2,
  overlay: 3,
  max: 4,
  min: 5,
  difference: 6,
  alphaOver: 7,
  premultipliedOver: 8,
  lerp: 9,
  mask: 10,
};

const TONEMAP: Record<Tonemap, number> = {
  none: 0,
  reinhard: 1,
  aces: 2,
};

const VERT = `
out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = `
precision highp float;

in vec2 vUv;

uniform sampler2D uTextureA;
uniform sampler2D uTextureB;
uniform sampler2D uMaskTexture;

uniform int uMode;
uniform float uOpacityA;
uniform float uOpacityB;
uniform float uMix;
uniform int uMaskChannel;
uniform float uMaskThreshold;
uniform bool uInvertMask;
uniform bool uClampOutput;
uniform int uTonemap;
uniform bool uHasMask;

out vec4 fragColor;

float overlayChannel(float base, float blend) {
  return base < 0.5
    ? (2.0 * base * blend)
    : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend));
}

vec3 overlayBlend(vec3 base, vec3 blend) {
  return vec3(
    overlayChannel(base.r, blend.r),
    overlayChannel(base.g, blend.g),
    overlayChannel(base.b, blend.b)
  );
}

float sampleMask(vec2 uv) {
  vec4 maskSample = texture(uMaskTexture, uv);
  float m = maskSample.r;
  if (uMaskChannel == 1) {
    m = maskSample.g;
  } else if (uMaskChannel == 2) {
    m = maskSample.b;
  } else if (uMaskChannel == 3) {
    m = maskSample.a;
  }
  if (uInvertMask) {
    m = 1.0 - m;
  }
  return m;
}

vec3 tonemapReinhard(vec3 color) {
  return color / (color + vec3(1.0));
}

vec3 tonemapAces(vec3 color) {
  // ACES approximation by Krzysztof Narkowicz
  float a = 2.51;
  float b = 0.03;
  float c = 2.43;
  float d = 0.59;
  float e = 0.14;
  return clamp((color * (a * color + b)) / (color * (c * color + d) + e), 0.0, 1.0);
}

void main() {
  vec4 a = texture(uTextureA, vUv);
  vec4 b = texture(uTextureB, vUv);

  a.rgb *= uOpacityA;
  a.a *= uOpacityA;
  b.rgb *= uOpacityB;
  b.a *= uOpacityB;

  vec3 rgb = vec3(0.0);
  float alpha = 0.0;

  if (uMode == 0) {
    rgb = a.rgb + b.rgb;
    alpha = max(a.a, b.a);
  } else if (uMode == 1) {
    rgb = 1.0 - (1.0 - a.rgb) * (1.0 - b.rgb);
    alpha = max(a.a, b.a);
  } else if (uMode == 2) {
    rgb = a.rgb * b.rgb;
    alpha = max(a.a, b.a);
  } else if (uMode == 3) {
    rgb = overlayBlend(a.rgb, b.rgb);
    alpha = max(a.a, b.a);
  } else if (uMode == 4) {
    rgb = max(a.rgb, b.rgb);
    alpha = max(a.a, b.a);
  } else if (uMode == 5) {
    rgb = min(a.rgb, b.rgb);
    alpha = max(a.a, b.a);
  } else if (uMode == 6) {
    rgb = abs(a.rgb - b.rgb);
    alpha = max(a.a, b.a);
  } else if (uMode == 7) {
    float outA = a.a + b.a * (1.0 - a.a);
    vec3 premult = a.rgb * a.a + b.rgb * b.a * (1.0 - a.a);
    vec3 outRgb = outA > 1e-6 ? premult / outA : vec3(0.0);
    rgb = outRgb;
    alpha = outA;
  } else if (uMode == 8) {
    rgb = a.rgb + b.rgb * (1.0 - a.a);
    alpha = a.a + b.a * (1.0 - a.a);
  } else if (uMode == 9) {
    float t = uHasMask ? sampleMask(vUv) : uMix;
    rgb = mix(b.rgb, a.rgb, t);
    alpha = mix(b.a, a.a, t);
  } else if (uMode == 10) {
    float t = uHasMask ? sampleMask(vUv) : uMix;
    bool chooseA = t > uMaskThreshold;
    rgb = chooseA ? a.rgb : b.rgb;
    alpha = chooseA ? a.a : b.a;
  }

  if (uTonemap == 1) {
    rgb = tonemapReinhard(rgb);
  } else if (uTonemap == 2) {
    rgb = tonemapAces(rgb);
  }

  if (uClampOutput) {
    rgb = clamp(rgb, 0.0, 1.0);
    alpha = clamp(alpha, 0.0, 1.0);
  }

  fragColor = vec4(rgb, alpha);
}
`;

export default function CombineShaderPass({
  inputA,
  inputB,
  mode = "add",
  opacityA = 1,
  opacityB = 1,
  clampOutput = true,
  mix = 0.5,
  maskTexture,
  maskChannel = 0,
  maskThreshold = 0.5,
  invertMask = false,
  tonemap = "none",
  target = null,
  clear = true,
  priority = 0,
}: CombineShaderPassProps) {
  const uniforms = useMemo<Record<string, THREE.IUniform>>(
    () => ({
      uTextureA: { value: inputA },
      uTextureB: { value: inputB },
      uMaskTexture: { value: maskTexture ?? inputA },
      uMode: { value: COMBINE_MODE[mode] },
      uOpacityA: { value: opacityA },
      uOpacityB: { value: opacityB },
      uMix: { value: mix },
      uMaskChannel: { value: maskChannel },
      uMaskThreshold: { value: maskThreshold },
      uInvertMask: { value: invertMask },
      uClampOutput: { value: clampOutput },
      uTonemap: { value: TONEMAP[tonemap] },
      uHasMask: { value: Boolean(maskTexture) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  uniforms.uTextureA.value = inputA;
  uniforms.uTextureB.value = inputB;
  uniforms.uMaskTexture.value = maskTexture ?? inputA;
  uniforms.uMode.value = COMBINE_MODE[mode];
  uniforms.uOpacityA.value = opacityA;
  uniforms.uOpacityB.value = opacityB;
  uniforms.uMix.value = mix;
  uniforms.uMaskChannel.value = maskChannel;
  uniforms.uMaskThreshold.value = maskThreshold;
  uniforms.uInvertMask.value = invertMask;
  uniforms.uClampOutput.value = clampOutput;
  uniforms.uTonemap.value = TONEMAP[tonemap];
  uniforms.uHasMask.value = Boolean(maskTexture);

  return (
    <ShaderPass
      vertexShader={VERT}
      fragmentShader={FRAG}
      uniforms={uniforms}
      target={target}
      clear={clear}
      priority={priority}
      blending={THREE.NoBlending}
    />
  );
}
