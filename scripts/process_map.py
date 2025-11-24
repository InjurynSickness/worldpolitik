#!/usr/bin/env python3
"""
HOI4-Style Map Processor - Texture Splatting Shader Simulation

This script simulates what a game engine shader does: texture splatting.
Instead of rendering raw terrain indices as flat colors (which shows ugly
checkerboard dithering), we:

1. SEPARATE INDICES: Extract boolean masks for each terrain type
2. BLUR MASKS: Apply Gaussian blur to turn checkerboard into smooth gradients
3. GENERATE TEXTURES: Create procedural noise-based textures for each terrain
4. COMPOSITE: Layer textures using blurred masks for smooth transitions
5. APPLY LIGHTING: Add depth from normal map

This eliminates the grid pattern completely and produces a real map look.
"""

import os
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
ASSETS_SOURCE = PROJECT_ROOT / "assets-source"
PUBLIC_DIR = PROJECT_ROOT / "public"

# Input files
TERRAIN_BMP = ASSETS_SOURCE / "terrain.bmp"
NORMAL_BMP = ASSETS_SOURCE / "world_normal.bmp"
PROVINCES_BMP = ASSETS_SOURCE / "provinces.bmp"

# Output file
FINAL_MAP_COMPOSITE = PUBLIC_DIR / "final_map_composite.png"

# Terrain color definitions (approximate HoI4 terrain indices)
# These are used to identify terrain types in the indexed terrain.bmp
TERRAIN_COLORS = {
    'ocean': (68, 107, 163),      # Deep blue
    'water': (41, 52, 73),         # Dark blue
    'desert': (225, 193, 110),     # Sandy beige
    'mountain': (169, 176, 168),   # Gray
    'hills': (178, 190, 148),      # Light olive
    'forest': (97, 136, 70),       # Green
    'jungle': (59, 89, 63),        # Dark green
    'plains': (192, 184, 117),     # Yellow-green
    'urban': (156, 156, 156),      # Gray
    'marsh': (114, 127, 87),       # Muddy green
    'lakes': (74, 103, 130),       # Blue-gray
}

# Procedural texture colors (what we'll render)
TEXTURE_TINTS = {
    'ocean': np.array([40, 60, 90], dtype=np.float32),
    'water': np.array([45, 65, 95], dtype=np.float32),
    'desert': np.array([215, 195, 140], dtype=np.float32),
    'mountain': np.array([200, 200, 200], dtype=np.float32),
    'hills': np.array([160, 170, 130], dtype=np.float32),
    'forest': np.array([85, 115, 60], dtype=np.float32),
    'jungle': np.array([50, 85, 55], dtype=np.float32),
    'plains': np.array([180, 180, 100], dtype=np.float32),
    'urban': np.array([140, 140, 140], dtype=np.float32),
    'marsh': np.array([100, 115, 75], dtype=np.float32),
    'lakes': np.array([70, 95, 120], dtype=np.float32),
}

# Processing parameters
MASK_BLUR_SIGMA = 1.8  # Gaussian blur sigma for mask smoothing
NOISE_SCALE = 0.15     # Noise intensity (15% of base color)


def log_info(message: str):
    print(f"ℹ️  {message}")


def log_success(message: str):
    print(f"✅ {message}")


def log_error(message: str):
    print(f"❌ {message}")


def create_terrain_masks(terrain_path: Path, shape: tuple) -> dict:
    """
    STEP 1: Separate the terrain indices into boolean masks.

    For each terrain type, create a mask where True = this terrain is present.
    Then apply Gaussian blur to smooth the checkerboard pattern into gradients.

    Args:
        terrain_path: Path to terrain.bmp
        shape: (height, width) of map

    Returns:
        Dict of terrain_name -> blurred float mask (0.0 to 1.0)
    """
    log_info("Loading terrain.bmp and extracting terrain indices...")

    terrain = Image.open(terrain_path)
    if terrain.mode != 'RGB':
        terrain = terrain.convert('RGB')

    terrain_arr = np.array(terrain, dtype=np.int32)  # Use int32 to prevent overflow
    height, width = shape

    # Initialize masks for each terrain type
    terrain_masks = {}

    # Classify pixels using vectorized operations (MUCH faster!)
    log_info("Classifying pixels by terrain type (vectorized)...")

    for terrain_name, terrain_color in TERRAIN_COLORS.items():
        # Calculate Euclidean distance for all pixels at once
        tc = np.array(terrain_color, dtype=np.int32)
        diff = terrain_arr - tc
        distance = np.sqrt(np.sum(diff ** 2, axis=2))

        # Create boolean mask for this terrain
        terrain_masks[terrain_name] = distance

    # For each pixel, find the closest terrain type
    log_info("Finding closest terrain type for each pixel...")
    final_masks = {name: np.zeros((height, width), dtype=np.float32)
                   for name in TERRAIN_COLORS.keys()}

    # Stack all distance maps and find minimum
    terrain_names = list(terrain_masks.keys())
    distance_stack = np.stack([terrain_masks[name] for name in terrain_names], axis=2)
    closest_indices = np.argmin(distance_stack, axis=2)

    # Create binary masks for each terrain
    for idx, terrain_name in enumerate(terrain_names):
        final_masks[terrain_name] = (closest_indices == idx).astype(np.float32)

    terrain_masks = final_masks
    log_success("Terrain classification complete")

    # CRITICAL: Apply Gaussian blur to each mask
    # This is what eliminates the checkerboard pattern!
    log_info(f"Applying Gaussian blur (sigma={MASK_BLUR_SIGMA}) to all masks...")

    blurred_masks = {}
    for terrain_name, mask in terrain_masks.items():
        if np.sum(mask) > 0:  # Only blur if terrain exists
            blurred = gaussian_filter(mask, sigma=MASK_BLUR_SIGMA)
            # Normalize to [0, 1] range
            if blurred.max() > 0:
                blurred = blurred / blurred.max()
            blurred_masks[terrain_name] = blurred

            coverage = (np.sum(mask > 0) / mask.size) * 100
            log_info(f"  {terrain_name}: {coverage:.2f}% coverage")

    log_success("Mask blurring complete - checkerboard grid eliminated!")

    return blurred_masks


def generate_noise_texture(shape: tuple, seed: int = 42) -> np.ndarray:
    """
    STEP 2: Generate procedural noise texture.

    Creates a simple noise pattern that makes the map look like terrain
    instead of flat colors.

    Args:
        shape: (height, width)
        seed: Random seed for reproducibility

    Returns:
        Grayscale noise array (0.0 to 1.0)
    """
    np.random.seed(seed)

    # Generate white noise
    noise = np.random.normal(0.5, 0.15, shape)

    # Apply slight blur to make it less harsh
    noise = gaussian_filter(noise, sigma=0.5)

    # Clip to valid range
    noise = np.clip(noise, 0, 1)

    return noise.astype(np.float32)


def composite_textures(blurred_masks: dict, base_noise: np.ndarray, shape: tuple) -> np.ndarray:
    """
    STEP 3: Composite all terrain textures using blurred masks.

    For each terrain type, apply its color tint to the noise texture,
    then blend using the blurred mask. This creates smooth transitions
    between terrain types.

    Args:
        blurred_masks: Dict of terrain_name -> blurred mask
        base_noise: Procedural noise texture
        shape: (height, width)

    Returns:
        RGB composite array (0-255)
    """
    log_info("Compositing terrain textures...")

    height, width = shape
    composite = np.zeros((height, width, 3), dtype=np.float32)
    total_weight = np.zeros((height, width), dtype=np.float32)

    # Layer each terrain type
    for terrain_name, mask in blurred_masks.items():
        if terrain_name not in TEXTURE_TINTS:
            continue

        # Get the color tint for this terrain
        tint = TEXTURE_TINTS[terrain_name]

        # Create textured version: base_color + noise variation
        for channel in range(3):
            noise_variation = (base_noise - 0.5) * tint[channel] * NOISE_SCALE
            textured_channel = tint[channel] + noise_variation

            # Apply this textured color where mask is active
            composite[:, :, channel] += textured_channel * mask

        # Track total weight for normalization
        total_weight += mask

    # Normalize by total weight to prevent overbright areas
    for channel in range(3):
        composite[:, :, channel] = np.divide(
            composite[:, :, channel],
            total_weight,
            where=total_weight > 0
        )

    # Clip to valid range and convert to uint8
    composite = np.clip(composite, 0, 255).astype(np.uint8)

    log_success("Texture compositing complete")

    return composite


def apply_lighting(composite: np.ndarray, normal_path: Path) -> np.ndarray:
    """
    STEP 4: Apply lighting from normal map to add depth.

    Uses multiply/overlay blending to add shadows and highlights
    from the normal map.

    Args:
        composite: RGB composite array
        normal_path: Path to world_normal.bmp

    Returns:
        RGB array with lighting applied
    """
    log_info("Loading normal map for lighting...")

    normal = Image.open(normal_path)
    if normal.mode != 'RGB':
        normal = normal.convert('RGB')

    # Resize normal map to match composite if needed
    if normal.size != (composite.shape[1], composite.shape[0]):
        log_info(f"Resizing normal map to {composite.shape[1]}x{composite.shape[0]}...")
        normal = normal.resize(
            (composite.shape[1], composite.shape[0]),
            Image.Resampling.LANCZOS
        )

    # Convert to grayscale for lighting
    grayscale = normal.convert('L')
    lighting = np.array(grayscale, dtype=np.float32)

    # Apply high-contrast curve
    log_info("Applying high-contrast lighting...")

    # Enhance shadows and highlights
    lighting = (lighting - 127.5) * 1.5 + 127.5  # Increase contrast
    lighting = np.clip(lighting, 0, 255)

    # Normalize to 0-1 range for blending
    lighting = lighting / 255.0

    # Apply overlay blend mode
    # Formula: if base < 0.5: 2 * base * blend, else: 1 - 2 * (1-base) * (1-blend)
    composite_float = composite.astype(np.float32) / 255.0
    result = np.zeros_like(composite_float)

    for channel in range(3):
        base = composite_float[:, :, channel]
        blend = lighting

        # Overlay blend
        mask_darken = base < 0.5
        result[:, :, channel][mask_darken] = 2 * base[mask_darken] * blend[mask_darken]
        result[:, :, channel][~mask_darken] = 1 - 2 * (1 - base[~mask_darken]) * (1 - blend[~mask_darken])

    # Convert back to uint8
    result = (result * 255).astype(np.uint8)

    log_success("Lighting applied - mountains have depth!")

    return result


def main():
    """Main shader simulation pipeline."""
    print("=" * 70)
    print("HOI4 Texture Splatting Shader Simulation")
    print("=" * 70)
    print()

    # Check dependencies
    try:
        import scipy
        import PIL
        import numpy
    except ImportError as e:
        log_error(f"Missing dependency: {e}")
        log_info("Install with: pip install Pillow numpy scipy")
        sys.exit(1)

    # Verify input files
    required_files = [TERRAIN_BMP, NORMAL_BMP]
    missing = [f for f in required_files if not f.exists()]

    if missing:
        log_error("Missing required input files:")
        for f in missing:
            print(f"  - {f}")
        sys.exit(1)

    # Create output directory
    PUBLIC_DIR.mkdir(exist_ok=True)

    try:
        # Get map dimensions
        terrain_temp = Image.open(TERRAIN_BMP)
        map_size = (terrain_temp.height, terrain_temp.width)
        terrain_temp.close()

        log_info(f"Map dimensions: {map_size[1]} x {map_size[0]}")

        # STEP 1: Separate indices and create blurred masks
        print("\n" + "─" * 70)
        print("STEP 1: Extracting Terrain Masks + Gaussian Blur (De-Dithering)")
        print("─" * 70)
        blurred_masks = create_terrain_masks(TERRAIN_BMP, map_size)

        # STEP 2: Generate procedural noise texture
        print("\n" + "─" * 70)
        print("STEP 2: Generating Procedural Noise Texture")
        print("─" * 70)
        log_info("Creating base noise layer...")
        base_noise = generate_noise_texture(map_size, seed=42)
        log_success("Noise texture generated")

        # STEP 3: Composite all textures
        print("\n" + "─" * 70)
        print("STEP 3: Compositing Terrain Textures with Blurred Masks")
        print("─" * 70)
        composite = composite_textures(blurred_masks, base_noise, map_size)

        # STEP 4: Apply lighting from normal map
        print("\n" + "─" * 70)
        print("STEP 4: Applying Lighting from Normal Map")
        print("─" * 70)
        final_composite = apply_lighting(composite, NORMAL_BMP)

        # Save final result
        print("\n" + "─" * 70)
        print("STEP 5: Saving Final Composite")
        print("─" * 70)
        log_info(f"Saving to {FINAL_MAP_COMPOSITE}...")
        final_image = Image.fromarray(final_composite, 'RGB')
        final_image.save(FINAL_MAP_COMPOSITE, 'PNG', optimize=True)
        log_success(f"Final map saved: {FINAL_MAP_COMPOSITE}")

        # Success summary
        print("\n" + "=" * 70)
        log_success("Shader simulation complete!")
        print("=" * 70)
        print("\nResult:")
        print(f"  {FINAL_MAP_COMPOSITE.name}")
        print("\nVerification:")
        print("  ✓ Grid/checkerboard pattern should be GONE")
        print("  ✓ Terrain transitions should be smooth and organic")
        print("  ✓ Mountains should have visible depth/shadows")
        print("  ✓ Overall look should be like a satellite map, not MS Paint")
        print()

    except Exception as e:
        log_error(f"Processing failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
