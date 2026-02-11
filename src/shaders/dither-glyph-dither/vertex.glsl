out vec2 vTextureCoord;

uniform mat4 uTextureMatrix;

void main() {
  vTextureCoord = (uTextureMatrix * vec4(uv, 0.0, 1.0)).xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
