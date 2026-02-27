out vec2 vTextureCoord;

void main() {
  vTextureCoord = uv;
  gl_Position = vec4(position, 1.0);
}
