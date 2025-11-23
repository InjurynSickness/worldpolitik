// Water Fragment Shader
// Animated water using scrolling normal maps

uniform sampler2D waterNormalMap1;
uniform sampler2D waterNormalMap2;
uniform float time;
uniform vec3 waterColor;
uniform vec3 lightDirection;

varying vec2 vUv;

const float WAVE_SPEED_1 = 0.02;
const float WAVE_SPEED_2 = 0.015;
const float WAVE_SCALE = 100.0;

void main() {
    // Create two scrolling UV coordinates for wave animation
    vec2 uv1 = vUv * WAVE_SCALE + vec2(time * WAVE_SPEED_1, time * WAVE_SPEED_1 * 0.5);
    vec2 uv2 = vUv * WAVE_SCALE - vec2(time * WAVE_SPEED_2 * 0.8, time * WAVE_SPEED_2);

    // Sample two normal maps moving in different directions
    vec3 normal1 = texture2D(waterNormalMap1, uv1).rgb * 2.0 - 1.0;
    vec3 normal2 = texture2D(waterNormalMap2, uv2).rgb * 2.0 - 1.0;

    // Blend the normals
    vec3 normal = normalize(normal1 + normal2);

    // Calculate lighting
    float diffuse = max(dot(normal, normalize(lightDirection)), 0.0);

    // Apply lighting to water color
    vec3 litColor = waterColor * (0.5 + diffuse * 0.5);

    // Add slight specular highlight
    vec3 viewDir = vec3(0.0, 0.0, 1.0); // Top-down view
    vec3 halfDir = normalize(lightDirection + viewDir);
    float specular = pow(max(dot(normal, halfDir), 0.0), 32.0);

    vec3 finalColor = litColor + vec3(specular * 0.3);

    gl_FragColor = vec4(finalColor, 1.0);
}
