#define M_PI 3.1415926535897932384626433832795

uniform sampler2D tDiffuse;
uniform sampler2D tGradient;

uniform float uTime;

uniform float uTileProgressVertical;
uniform float uTileProgressHorizontal;
uniform float uTileAmplitude;
uniform vec2  uTileFrequency;
uniform vec2  uTileOffset;

uniform float uWaveProgress;
uniform float uWaveAmplitude;
uniform vec2  uWaveStrength;

uniform float uGradientProgress;
uniform float uGradientOffset;
uniform float uGradientAmplitude;

uniform float uBlueProgress;
uniform float uBlueAmplitude;

uniform float uWhiteTileChances;
uniform float uWhiteTileFrequency;
uniform float uWhiteTileStrength;

uniform float uSaturation;

varying vec2 vUv;


// --------------------------------------------------
// Utilities
// --------------------------------------------------

float random(in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec2 getTileCoord(vec2 pos, vec2 frequency) {
    vec2 coord = vec2(
        floor(pos.x * frequency.x),
        floor(pos.y * frequency.y)
    );

    coord /= frequency;
    return coord;
}

float toSin(float value) {
    return (sin((value - 0.5) * M_PI) + 1.0) * 0.5;
}


// --------------------------------------------------
// Main
// --------------------------------------------------

void main() {

    // ------------------------
    // Tiles
    // ------------------------
    vec2 tileCoord1 = getTileCoord(vUv, uTileFrequency * 1.8942);
    vec2 tileCoord2 = getTileCoord(vUv, uTileFrequency * 1.0);
    vec2 tileCoord3 = getTileCoord(vUv, uTileFrequency * 2.1245);

    vec2 tileCoord = tileCoord2 +
        step(random(tileCoord1), 0.5) * (tileCoord3 - tileCoord2);

    float tileRandom = random(tileCoord);
    float tileAngle  = tileRandom * M_PI * 2.0;

    vec2 tileOffset = vec2(sin(tileAngle), cos(tileAngle)) * uTileOffset;

    float tileProgress = 1.0 -
        (distance(tileCoord.y, uTileProgressVertical) / (uTileAmplitude * 0.5));

    tileProgress = clamp(tileProgress, 0.0, 1.0);

    float tileProgressHorizontal = 1.0 -
        (distance(tileCoord.x, uTileProgressHorizontal) / (uTileAmplitude * 0.5));
    tileProgressHorizontal = clamp(tileProgressHorizontal, 0.0, 1.0);

    // ------------------------
    // Wave
    // ------------------------
    float waveProgress = 1.0 -
        (distance(vUv.x, uWaveProgress) / (uWaveAmplitude * 0.5));

    waveProgress = clamp(waveProgress, 0.0, 1.0);

    vec2 waveOffset = toSin(waveProgress) * uWaveStrength;


    // ------------------------
    // Gradient
    // ------------------------
    float gradientProgress = (tileCoord.x - uGradientProgress) / uGradientAmplitude;
    gradientProgress      += (tileRandom - 0.5) * uGradientOffset;

    vec4 gradientColor = texture2D(
        tGradient,
        vec2(clamp(gradientProgress, 0.0, 1.0), 0.0)
    );


    // ------------------------
    // Blue tint
    // ------------------------
    float blueProgress = (tileCoord.x - uBlueProgress) / uBlueAmplitude;
    blueProgress      += tileOffset.x;
    blueProgress       = clamp(blueProgress, 0.0, 1.0);


    // ------------------------
    // White flickering tiles
    // ------------------------
    float whiteTileProgress =
        sin(uTime * uWhiteTileFrequency + tileRandom * M_PI * 2.0) * 0.5 + 0.5;

    whiteTileProgress =
        clamp(whiteTileProgress - (1.0 - uWhiteTileChances), 0.0, 1.0) *
        (1.0 / uWhiteTileChances) *
        uWhiteTileStrength;


    // ------------------------
    // Final color pipeline
    // ------------------------
    vec2 uv = vUv;

    // Apply tile offset
    uv += tileOffset * tileProgress;

    // Apply waves (optional)
    // uv += waveOffset;

    // Repeat UV
    uv = mod(uv, vec2(1.0));

    // Base color removed so overlay only contains glitch elements
    vec4 color = vec4(0.0);

    // Add gradient
    color.rgb += gradientColor.rgb * gradientColor.a * tileProgressHorizontal;

    // Add white flicker effect
    color.rgb += vec3(whiteTileProgress) * tileProgressHorizontal;

    // Blue tone shift
    vec3 blueColor = vec3((color.r + color.g + color.b) / 3.0) *
                     vec3(0.3, 0.5, 1.0);

    color.rgb = mix(color.rgb, blueColor, vec3(blueProgress));

    // Saturation
    color.rgb *= uSaturation;

    float effectAlpha =
        clamp(tileProgressHorizontal * (tileProgress * 0.6 + whiteTileProgress + gradientColor.a), 0.0, 1.0);

    // Output
    gl_FragColor = vec4(color.rgb, effectAlpha);
}
