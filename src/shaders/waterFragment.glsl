// Water Fragment Shader
// Simple solid blue water (animated waves disabled for now to reduce lag)

uniform vec3 waterColor;

varying vec2 vUv;

void main() {
    // Simple solid color for water (no waves yet - causes lag)
    gl_FragColor = vec4(waterColor, 1.0);
}
