// Terrain Vertex Shader
// Handles heightmap displacement

uniform sampler2D heightmapTexture;
uniform float heightScale;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vUv = uv;
    vNormal = normal;

    // Sample heightmap to displace vertices
    float height = texture2D(heightmapTexture, uv).r;

    // Displace position along normal (upward for flat plane)
    vec3 displaced = position + normal * height * heightScale;
    vPosition = displaced;

    // Transform to clip space
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
