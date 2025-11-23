// Terrain Fragment Shader
// Implements texture splatting: terrain index -> atlas lookup -> colormap tint

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

    // Step 2: Calculate which tile in the atlas grid
    float col = mod(terrainIndex, TILES_PER_ROW);
    float row = floor(terrainIndex / TILES_PER_ROW);

    // Step 3: Create tiled UV coordinates (repeat texture many times)
    vec2 tiledUv = fract(vUv * TILING_FACTOR);

    // Step 4: Map tiled UV to the specific atlas region
    vec2 atlasUv = vec2(
        (col + tiledUv.x) * TILE_SIZE,
        (row + tiledUv.y) * TILE_SIZE
    );

    // Step 5: Sample the terrain texture from atlas
    vec4 diffuseColor = texture2D(atlasTexture, atlasUv);

    // Step 6: Sample the global colormap (tint)
    vec4 tintColor = texture2D(colormapTexture, vUv);

    // Step 7: Blend diffuse and tint (multiply blend)
    vec3 baseColor = diffuseColor.rgb * tintColor.rgb;

    // Step 8: Apply lighting using normal map
    vec3 normalMapSample = texture2D(normalMapTexture, vUv).rgb;
    vec3 normal = normalize(normalMapSample * 2.0 - 1.0); // Convert from [0,1] to [-1,1]

    // Calculate diffuse lighting
    float diffuse = max(dot(normal, normalize(lightDirection)), 0.0);

    // Combine ambient and diffuse
    float lighting = ambientIntensity + diffuse * lightIntensity;

    // Step 9: Apply lighting and brightness boost
    vec3 finalColor = baseColor * lighting * 1.5;

    gl_FragColor = vec4(finalColor, 1.0);
}
