// Terrain Fragment Shader
// Implements texture splatting: terrain index -> atlas lookup -> colormap tint
// Water pixels are discarded (transparent) to show water plane below

uniform sampler2D terrainIndexTexture;  // terrain_indexed.png (0-255 index)
uniform sampler2D atlasTexture;         // atlas0.png (4x4 grid of textures)
uniform sampler2D colormapTexture;      // colormap_land.png (global tint)
uniform sampler2D normalMapTexture;     // Normal map for lighting
uniform vec3 lightDirection;            // Directional light
uniform float lightIntensity;
uniform float ambientIntensity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

const float TILES_PER_ROW = 4.0;        // 4x4 atlas grid
const float TILE_SIZE = 1.0 / TILES_PER_ROW;
const float TILING_FACTOR = 500.0;      // How many times to repeat textures

void main() {
    // Step 1: Read terrain type index (0-255)
    // Use .r channel, multiply by 255 to get actual index
    float terrainIndex = texture2D(terrainIndexTexture, vUv).r * 255.0;

    // Step 2: Discard water pixels (index 0 or very low values)
    // This creates transparency where water should be, showing the blue plane below
    // Use 0.5 threshold to handle any texture filtering artifacts
    if (terrainIndex < 0.5) {
        discard;
        return;
    }

    // Step 3: Calculate which tile in the atlas grid
    float col = mod(terrainIndex, TILES_PER_ROW);
    float row = floor(terrainIndex / TILES_PER_ROW);

    // Step 4: Create tiled UV coordinates (repeat texture many times)
    vec2 tiledUv = fract(vUv * TILING_FACTOR);

    // Step 5: Map tiled UV to the specific atlas region
    vec2 atlasUv = vec2(
        (col + tiledUv.x) * TILE_SIZE,
        (row + tiledUv.y) * TILE_SIZE
    );

    // Step 6: Sample the terrain texture from atlas
    vec4 diffuseColor = texture2D(atlasTexture, atlasUv);

    // Step 7: Sample the global colormap (tint)
    vec4 tintColor = texture2D(colormapTexture, vUv);

    // Step 8: Blend diffuse and tint (multiply blend with brightness boost)
    // Multiply by 2.2 to compensate for double-darkening from two textures
    vec3 baseColor = diffuseColor.rgb * tintColor.rgb * 2.2;

    // Step 9: Apply lighting using normal map
    vec3 normalMapSample = texture2D(normalMapTexture, vUv).rgb;
    vec3 normal = normalize(normalMapSample * 2.0 - 1.0); // Convert from [0,1] to [-1,1]

    // Calculate diffuse lighting
    float diffuse = max(dot(normal, normalize(lightDirection)), 0.0);

    // Combine ambient and diffuse (CRITICAL: ambient prevents pitch black shadows)
    float lighting = ambientIntensity + diffuse * lightIntensity;

    // Step 10: Apply lighting (ambient ensures nothing is ever pitch black)
    vec3 finalColor = baseColor * lighting;

    gl_FragColor = vec4(finalColor, 1.0);
}
