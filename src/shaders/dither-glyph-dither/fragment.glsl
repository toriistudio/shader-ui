precision highp float;

in vec2 vTextureCoord;

uniform sampler2D uTexture;
uniform sampler2D uSprite;
uniform sampler2D uCustomTexture;
uniform vec2 uMousePos;
uniform vec2 uResolution;

out vec4 fragColor;

void main() {
  vec2 uv = vTextureCoord;
  vec2 pos = vec2(0.5, 0.5) + mix(vec2(0.0), (uMousePos - 0.5), 0.0000);
  float aspectRatio = uResolution.x / uResolution.y;
  float aspectCorrection = mix(aspectRatio, 1.0 / aspectRatio, 0.5);

  float gridSize = mix(0.05, 0.005, 1.0000);
  float baseGrid = 1.0 / gridSize;
  vec2 cellSize = vec2(1.0 / (baseGrid * aspectRatio), 1.0 / baseGrid) * aspectCorrection;

  vec2 offsetUv = uv - pos;
  vec2 cell = floor(offsetUv / cellSize);
  vec2 cellCenter = (cell + 0.5) * cellSize;
  vec2 pixelatedCoord = cellCenter + pos;

  vec4 bg = texture(uTexture, vTextureCoord);
  vec4 color = texture(uTexture, pixelatedCoord);

  float luminance = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
  luminance = mix(luminance, 1.0 - luminance, float(0));

  float gamma = pow(mix(0.2, 2.2, 0.5800), 2.2);

  ivec2 customTextureSize = textureSize(uCustomTexture, 0);
  ivec2 spriteTextureSize = textureSize(uSprite, 0);
  float selectedWidth = mix(float(spriteTextureSize.x), float(customTextureSize.x), float(0 == 6));
  float GLYPH_HEIGHT = mix(float(spriteTextureSize.y), float(customTextureSize.y), float(0 == 6));
  float scaleFactor = gridSize / GLYPH_HEIGHT;

  float numSprites = max(1.0, selectedWidth / GLYPH_HEIGHT);
  float numGlyphRows = 1.0;

  float spriteIndex = clamp(floor(luminance * numSprites), 0.0, numSprites - 1.0);
  float spriteIndexWithGamma = clamp(floor(luminance * numSprites * gamma), 0.0, numSprites - 1.0);

  float glyphIndex = 0.0;
  float normalizedSpriteSizeX = 1.0 / numSprites;
  float normalizedSpriteSizeY = 1.0 / numGlyphRows;

  float spriteX = (spriteIndexWithGamma * normalizedSpriteSizeX);
  vec2 spriteSheetUV = vec2(spriteX, glyphIndex / numGlyphRows);

  vec2 spriteSize = vec2(GLYPH_HEIGHT / aspectRatio, GLYPH_HEIGHT) * scaleFactor * aspectCorrection;
  vec2 localOffset = mod(uv - pos, spriteSize) / spriteSize;

  float inset = 0.5 / GLYPH_HEIGHT;
  localOffset = clamp(localOffset, inset, 1.0 - inset);

  spriteSheetUV += vec2(localOffset.x * normalizedSpriteSizeX, localOffset.y * normalizedSpriteSizeY);

  vec4 spriteColor = texture(uSprite, spriteSheetUV);
  float alpha = smoothstep(0.0, 1.0, spriteColor.r);

  vec3 cc = (color.rgb - spriteIndex * 0.04) * 1.4;
  vec3 col = mix(cc, vec3(0.0, 1.0, 1.0), float(0));
  vec3 dithered = mix(mix(vec3(0.0), vec3(1.0), float(0)), col, alpha);

  color.rgb = mix(bg.rgb, dithered, 0.5000);
  fragColor = color;
}
