precision highp float;

in vec2 vUv;
out vec4 FragColor;

uniform float uTime;
uniform vec3 uColor;
uniform vec4 uPattern;
uniform bool uReverseGradient;
uniform float uCenterFadeStrength;
uniform float uVerticalFade;
uniform float uFinalMix;

#define PI 3.14159265358979323846

const float FREQUENCY = 35.0;
const float LINE_WIDTH = .1;
const float NOISE_INTENSITY = 0.2;
const float TIME_MULTIPLIER = 2.0;
const float CENTER_FADE = 0.6;
const float TIME_DISTURBANCE = .3;

float hash21(vec2 p){
    p = fract(p*vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x*p.y);
}

float band(float v, float w){
    return 1.0 - smoothstep(0.0, w, abs(v));
}

float circularPattern(vec2 uv, float time, float scale, float rotation) {
    float r = length(uv);
    float angle = atan(uv.y, uv.x) + rotation;
    float phase = scale * r - time;
    return sin(phase);
}

float squarePattern(vec2 uv, float time, float scale, float rotation) {
    float cos_r = cos(rotation);
    float sin_r = sin(rotation);
    vec2 rotated = vec2(uv.x * cos_r - uv.y * sin_r, uv.x * sin_r + uv.y * cos_r);
    float phase = scale * (abs(rotated.x) + abs(rotated.y)) - time;
    return sin(phase);
}

float spiralPattern(vec2 uv, float time, float scale, float rotation) {
    float r = length(uv);
    float angle = atan(uv.y, uv.x) + rotation;
    float phase = scale * (r + angle * 2.0) - time;
    return sin(phase);
}

float gridPattern(vec2 uv, float time, float scale, float rotation) {
    float cos_r = cos(rotation);
    float sin_r = sin(rotation);
    vec2 rotated = vec2(uv.x * cos_r - uv.y * sin_r, uv.x * sin_r + uv.y * cos_r);
    float phase_x = scale * rotated.x - time;
    float phase_y = scale * rotated.y - time;
    return sin(phase_x) * sin(phase_y);
}

float radialPattern(vec2 uv, float time, float scale, float rotation) {
    float r = length(uv);
    float angle = atan(uv.y, uv.x) + rotation;
    float phase = scale * angle * 8.0 - time;
    return sin(phase);
}

float wavePattern(vec2 uv, float time, float scale, float rotation) {
    float cos_r = cos(rotation);
    float sin_r = sin(rotation);
    vec2 rotated = vec2(uv.x * cos_r - uv.y * sin_r, uv.x * sin_r + uv.y * cos_r);
    float phase = scale * rotated.y - time;
    return sin(phase);
}

float diamondPattern(vec2 uv, float time, float scale, float rotation) {
    float cos_r = cos(rotation);
    float sin_r = sin(rotation);
    vec2 rotated = vec2(uv.x * cos_r - uv.y * sin_r, uv.x * sin_r + uv.y * cos_r);
    float diamondDist = max(abs(rotated.x), abs(rotated.y));
    float phase = scale * diamondDist - time;
    return sin(phase);
}

float hexagonPattern(vec2 uv, float time, float scale, float rotation) {
    float cos_r = cos(rotation);
    float sin_r = sin(rotation);
    vec2 rotated = vec2(uv.x * cos_r - uv.y * sin_r, uv.x * sin_r + uv.y * cos_r);
    vec2 hexUV = abs(rotated);
    float hexDist = max(hexUV.x * 0.866025 + hexUV.y * 0.5, hexUV.y);
    float phase = scale * hexDist - time;
    return sin(phase);
}

float getPattern(vec2 uv, float time, float patternType, float scale, float rotation) {
    if (patternType < 0.5) { return circularPattern(uv, time, scale, rotation); }
    else if (patternType < 1.5) { return squarePattern(uv, time, scale, rotation); }
    else if (patternType < 2.5) { return spiralPattern(uv, time, scale, rotation); }
    else if (patternType < 3.5) { return gridPattern(uv, time, scale, rotation); }
    else if (patternType < 4.5) { return radialPattern(uv, time, scale, rotation); }
    else if (patternType < 5.5) { return wavePattern(uv, time, scale, rotation); }
    else if (patternType < 6.5) { return diamondPattern(uv, time, scale, rotation); }
    else { return hexagonPattern(uv, time, scale, rotation); }
}

void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    float baseTime = uTime * TIME_MULTIPLIER;
    float timeOscillation = sin(uTime * 0.3) * 0.5 + sin(uTime * 0.7) * 0.3;
    float timeNoise = hash21(vec2(uTime * 0.1, 0.0)) * 0.4 - 0.2;
    float t = baseTime + (timeOscillation + timeNoise) * TIME_DISTURBANCE;
    float w = max(0.001, LINE_WIDTH);
    float r = length(uv);
    float patternScale = FREQUENCY * uPattern.z;
    float patternTime = t;
    float patternRotation = uPattern.w;
    float field = getPattern(uv, patternTime, uPattern.x, patternScale, patternRotation);
    float jSeed = hash21(uv * 50.0) * 6.28318530718;
    float staticJ = (hash21(uv * 50.0) - 0.5) * 0.008;
    float oscJ = sin(uTime * 42.0 + jSeed) * 0.004;
    float particleJitter = staticJ + oscJ;
    vec2 jitteredUV = uv + vec2(particleJitter);
    float jitteredField = getPattern(jitteredUV, patternTime, uPattern.x, patternScale, patternRotation);
    field = mix(field, jitteredField, uPattern.y * 0.3);
    float localPhase = 0.06 * sin(12.0 * uTime + hash21(uv * 30.0) * 6.28318530718);
    field += localPhase * uPattern.y;
    if (uPattern.x < 1.5 || uPattern.x > 4.5) {
        vec2 corners[4];
        corners[0] = vec2( 1.10,  1.10);
        corners[1] = vec2(-1.10,  1.10);
        corners[2] = vec2(-1.10, -1.10);
        corners[3] = vec2( 1.10, -1.10);
        for (int i = 0; i < 4; i++) {
            vec2 cornerUV = uv - corners[i];
            float cjSeed  = hash21((uv + corners[i]) * 40.0 + float(i)) * 6.28318530718;
            float cStatic = (hash21((uv + corners[i]) * 40.0 + float(i)) - 0.5) * 0.008;
            float cOsc    = sin(uTime * 38.0 + cjSeed) * 0.0038;
            float cJ      = cStatic + cOsc;
            float cr = length(cornerUV);
            vec2  cDir = (cr > 0.0) ? cornerUV / cr : vec2(0.0);
            vec2  cJitteredUV = cornerUV + cDir * cJ;
            float cornerField = getPattern(cJitteredUV, patternTime + localPhase * 0.9,
                                           uPattern.x, patternScale * 0.8, patternRotation);
            field += 0.4 * cornerField * uPattern.y;
        }
    }
    float lines = band(field, w);
    float glowLines = band(field, w * 3.0);
    float vign = smoothstep(1.5, 0.2, r);
    float centerFadeBase = uReverseGradient
      ? (1.0 - smoothstep(0.0, CENTER_FADE, r))
      : smoothstep(0.0, CENTER_FADE, r);
    float centerFade = mix(1.0, centerFadeBase, uCenterFadeStrength);
    float verticalDistance = abs(uv.y);
    float verticalFade = 1.0 - smoothstep(0.0, uVerticalFade, verticalDistance);
    float lineIntensity = clamp(lines * vign * centerFade * verticalFade, 0.0, 1.0);
    float tremor = 1.0 + 0.05 * sin(2.0*PI*60.0*uTime + hash21(gl_FragCoord.xy)*6.28318530718);
    lineIntensity *= tremor;
    float grainMask = smoothstep(0.2, 1.0, lineIntensity);
    float rnd = hash21(gl_FragCoord.xy + vec2(uTime * 123.4, uTime * 57.3));
    float grain = 1.0 + (rnd - 0.5) * 1.15;
    lineIntensity = clamp(lineIntensity * mix(1.0, grain, grainMask * NOISE_INTENSITY), 0.0, 1.0);
    float haloNoise = hash21(uv * 30.0 + uTime);
    float halo = pow(glowLines * 0.6 * vign * centerFade * verticalFade * (0.95 + 0.05*haloNoise), 1.8);
    float dots = step(0.999, hash21(gl_FragCoord.xy * 0.5 + uTime));
    float intensity = min(1.0, lineIntensity + halo + dots * 0.08);
    vec3 baseColor = uColor;
    vec3 backgroundColor = vec3(16.0/255.0);
    vec3 col = mix(backgroundColor, baseColor, intensity * uFinalMix);
    FragColor = vec4(col, 1.0);
}
