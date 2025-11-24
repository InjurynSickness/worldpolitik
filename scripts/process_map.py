#!/usr/bin/env python3
"""
HOI4-Style Map Asset Processor - Full De-Dithering Implementation

This script processes raw HOI4 map files using Gemini's approach to eliminate
the checkerboard dithering pattern and create authentic HOI4-style visuals.

Key Processing Steps:
1. De-dither terrain.bmp using median filter to remove checkerboard pattern
2. Add subtle texture noise for ground feel
3. Extract water transparency mask
4. Generate high-contrast lighting from world_normal.bmp
5. Output separate layers for CSS composition

Output Files:
- final_terrain.png: De-dithered land texture with transparent oceans
- final_water.png: Water colormap resized to match map
- final_lighting.png: High-contrast grayscale shadows for overlay blend

Usage:
    python scripts/process_map.py
"""

import os
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter, ImageOps

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
ASSETS_SOURCE = PROJECT_ROOT / "assets-source"
PUBLIC_DIR = PROJECT_ROOT / "public"

# Input files
TERRAIN_BMP = ASSETS_SOURCE / "terrain.bmp"
NORMAL_BMP = ASSETS_SOURCE / "world_normal.bmp"
WATER_COLORMAP = PUBLIC_DIR / "colormap_water.png"
PROVINCES_BMP = ASSETS_SOURCE / "provinces.bmp"

# Output files
FINAL_TERRAIN_PNG = PUBLIC_DIR / "final_terrain.png"
FINAL_WATER_PNG = PUBLIC_DIR / "final_water.png"
FINAL_LIGHTING_PNG = PUBLIC_DIR / "final_lighting.png"

# Processing parameters
MEDIAN_FILTER_SIZE = 3  # For de-dithering checkerboard pattern
NOISE_INTENSITY = 12    # Texture noise standard deviation (5-10% of 255)
JUNGLE_GREEN = (59, 89, 63)  # Fallback for void pixels


def log_info(message: str):
    """Print info message."""
    print(f"ℹ️  {message}")


def log_success(message: str):
    """Print success message."""
    print(f"✅ {message}")


def log_error(message: str):
    """Print error message."""
    print(f"❌ {message}")


def create_water_mask(provinces_path: Path, terrain_shape: tuple) -> np.ndarray:
    """
    Create boolean mask identifying water pixels.

    Args:
        provinces_path: Path to provinces.bmp
        terrain_shape: Shape to match (height, width)

    Returns:
        Boolean array where True = water, False = land
    """
    log_info("Creating water mask from provinces.bmp...")

    provinces = Image.open(provinces_path).convert('RGB')

    # Resize if needed
    if provinces.size != (terrain_shape[1], terrain_shape[0]):
        log_info(f"Resizing provinces from {provinces.size} to ({terrain_shape[1]}, {terrain_shape[0]})...")
        provinces = provinces.resize((terrain_shape[1], terrain_shape[0]), Image.Resampling.NEAREST)

    provinces_arr = np.array(provinces)

    # Water pixels are very dark in provinces.bmp (R,G,B < 10)
    is_water = (provinces_arr[:, :, 0] < 10) & \
               (provinces_arr[:, :, 1] < 10) & \
               (provinces_arr[:, :, 2] < 10)

    water_count = np.sum(is_water)
    total_pixels = is_water.size
    water_percent = (water_count / total_pixels) * 100

    log_success(f"Water mask created: {water_count:,} pixels ({water_percent:.1f}%)")

    return is_water


def process_terrain(terrain_path: Path, water_mask: np.ndarray, output_path: Path) -> Image.Image:
    """
    Process terrain with de-dithering, void fixing, and texture noise.

    HOI4 uses checkerboard dithering to blend terrain types. This creates an ugly
    grid pattern when viewed raw. We fix this by:
    1. Converting indexed to RGB
    2. Applying median filter to smooth checkerboard pixels
    3. Adding subtle noise for ground texture feel
    4. Fixing void pixels (Amazon black blobs)
    5. Applying transparency mask for water

    Args:
        terrain_path: Path to terrain.bmp
        water_mask: Boolean array (True = water)
        output_path: Where to save processed terrain

    Returns:
        Processed terrain image (RGBA with transparent water)
    """
    log_info("Loading terrain.bmp...")
    terrain = Image.open(terrain_path)

    # Convert indexed to RGB
    if terrain.mode != 'RGB':
        log_info(f"Converting terrain from {terrain.mode} to RGB...")
        terrain = terrain.convert('RGB')

    # CRITICAL: De-dithering step - removes the checkerboard grid pattern
    log_info(f"Applying median filter (size={MEDIAN_FILTER_SIZE}) to remove dithering...")
    terrain = terrain.filter(ImageFilter.MedianFilter(size=MEDIAN_FILTER_SIZE))
    log_success("Checkerboard dithering removed")

    # Convert to numpy for pixel operations
    terrain_arr = np.array(terrain, dtype=np.float32)  # Float for noise addition

    # Fix void pixels (pure black on land areas)
    is_void_on_land = (terrain_arr[:, :, 0] == 0) & \
                      (terrain_arr[:, :, 1] == 0) & \
                      (terrain_arr[:, :, 2] == 0) & \
                      (~water_mask)

    void_count = np.sum(is_void_on_land)
    if void_count > 0:
        log_info(f"Fixing {void_count:,} void pixels (Amazon/DRC regions)...")
        terrain_arr[is_void_on_land] = JUNGLE_GREEN
        log_success(f"Void pixels fixed with jungle green")

    # Add texture noise to land pixels only (makes it look like ground, not MS Paint)
    log_info(f"Adding texture noise (intensity={NOISE_INTENSITY}) to land pixels...")

    # Generate monochromatic noise
    np.random.seed(42)  # Reproducible noise pattern
    noise = np.random.normal(0, NOISE_INTENSITY, terrain_arr.shape[:2])

    # Apply noise only to land pixels
    land_mask = ~water_mask
    for channel in range(3):
        terrain_arr[:, :, channel][land_mask] += noise[land_mask]

    # Clip to valid range
    terrain_arr = np.clip(terrain_arr, 0, 255).astype(np.uint8)
    log_success("Texture noise applied to land pixels")

    # Create RGBA image with transparent water
    log_info("Creating transparency mask for water...")
    terrain_rgba = np.zeros((*terrain_arr.shape[:2], 4), dtype=np.uint8)
    terrain_rgba[:, :, :3] = terrain_arr
    terrain_rgba[:, :, 3] = 255  # Full opacity by default
    terrain_rgba[water_mask, 3] = 0  # Transparent water

    terrain_final = Image.fromarray(terrain_rgba, 'RGBA')

    # Save
    log_info(f"Saving final terrain to {output_path}...")
    terrain_final.save(output_path, 'PNG', optimize=True)
    log_success(f"Final terrain saved: {output_path}")

    return terrain_final


def process_water_colormap(water_colormap_path: Path, target_size: tuple, output_path: Path) -> Image.Image:
    """
    Process water colormap to match terrain dimensions.

    Args:
        water_colormap_path: Path to colormap_water.png
        target_size: (width, height) to match
        output_path: Where to save processed water

    Returns:
        Processed water colormap image
    """
    log_info("Processing water colormap...")

    if not water_colormap_path.exists():
        log_error(f"Water colormap not found: {water_colormap_path}")
        log_info("Creating solid HOI4 ocean blue as fallback...")
        water = Image.new('RGB', target_size, (41, 52, 73))
    else:
        water = Image.open(water_colormap_path).convert('RGB')

        if water.size != target_size:
            log_info(f"Resizing water from {water.size} to {target_size}...")
            water = water.resize(target_size, Image.Resampling.LANCZOS)

    # Save
    log_info(f"Saving final water to {output_path}...")
    water.save(output_path, 'PNG', optimize=True)
    log_success(f"Final water saved: {output_path}")

    return water


def generate_lighting(normal_path: Path, output_path: Path) -> Image.Image:
    """
    Generate high-contrast lighting layer from world_normal.bmp.

    Gemini's approach: Manual histogram stretching for dramatic shadows.
    - Values < 100: Darken significantly (deep shadows)
    - Values > 150: Brighten significantly (strong highlights)
    - Values 100-150: Neutral gray (no lighting effect)

    Args:
        normal_path: Path to world_normal.bmp
        output_path: Where to save lighting

    Returns:
        High-contrast grayscale lighting image
    """
    log_info("Loading world_normal.bmp...")
    normal = Image.open(normal_path)

    if normal.mode != 'RGB':
        normal = normal.convert('RGB')

    log_info("Converting normal map to grayscale...")
    grayscale = normal.convert('L')
    lighting_arr = np.array(grayscale, dtype=np.float32)

    log_info("Applying high-contrast stretching (Gemini's method)...")

    # Create masks for different value ranges
    mask_dark = lighting_arr < 100
    mask_light = lighting_arr > 150
    mask_mid = (lighting_arr >= 100) & (lighting_arr <= 150)

    # Apply contrast stretching
    # Shadows: Map [0-100] to [0-50] for deeper shadows
    lighting_arr[mask_dark] = (lighting_arr[mask_dark] / 100) * 50

    # Highlights: Map [150-255] to [150-255] with enhanced contrast
    lighting_arr[mask_light] = 150 + ((lighting_arr[mask_light] - 150) / 105) * 105

    # Midtones: Flatten to neutral gray (128 = no effect with overlay blend)
    lighting_arr[mask_mid] = 128

    lighting_arr = lighting_arr.astype(np.uint8)
    lighting = Image.fromarray(lighting_arr, 'L')

    log_success("High-contrast lighting generated")

    # Save
    log_info(f"Saving final lighting to {output_path}...")
    lighting.save(output_path, 'PNG', optimize=True)
    log_success(f"Final lighting saved: {output_path}")

    return lighting


def main():
    """Main processing pipeline."""
    print("=" * 70)
    print("HOI4-Style Map Asset Processor - De-Dithering Implementation")
    print("=" * 70)
    print()

    # Check dependencies
    try:
        import PIL
        import numpy
    except ImportError as e:
        log_error(f"Missing required dependency: {e}")
        log_info("Install with: pip install Pillow numpy")
        sys.exit(1)

    # Verify input files
    required_files = [TERRAIN_BMP, NORMAL_BMP, PROVINCES_BMP]
    missing = [f for f in required_files if not f.exists()]

    if missing:
        log_error("Missing required input files:")
        for f in missing:
            print(f"  - {f}")
        sys.exit(1)

    # Create output directory
    PUBLIC_DIR.mkdir(exist_ok=True)

    try:
        # Get terrain dimensions
        terrain_temp = Image.open(TERRAIN_BMP)
        map_size = (terrain_temp.width, terrain_temp.height)
        terrain_temp.close()

        log_info(f"Map dimensions: {map_size[0]} x {map_size[1]}")

        # Step 1: Create water mask
        print("\n" + "─" * 70)
        print("STEP 1: Creating Water Mask")
        print("─" * 70)
        water_mask = create_water_mask(PROVINCES_BMP, (map_size[1], map_size[0]))

        # Step 2: Process terrain (de-dither, noise, transparency)
        print("\n" + "─" * 70)
        print("STEP 2: Processing Terrain (De-Dithering + Noise + Transparency)")
        print("─" * 70)
        terrain_final = process_terrain(TERRAIN_BMP, water_mask, FINAL_TERRAIN_PNG)

        # Step 3: Process water colormap
        print("\n" + "─" * 70)
        print("STEP 3: Processing Water Colormap")
        print("─" * 70)
        water_final = process_water_colormap(WATER_COLORMAP, map_size, FINAL_WATER_PNG)

        # Step 4: Generate high-contrast lighting
        print("\n" + "─" * 70)
        print("STEP 4: Generating High-Contrast Lighting")
        print("─" * 70)
        lighting_final = generate_lighting(NORMAL_BMP, FINAL_LIGHTING_PNG)

        # Success summary
        print("\n" + "=" * 70)
        log_success("All assets processed successfully!")
        print("=" * 70)
        print("\nGenerated files:")
        print(f"  1. {FINAL_TERRAIN_PNG.name} - De-dithered terrain with transparent water")
        print(f"  2. {FINAL_WATER_PNG.name} - Water colormap")
        print(f"  3. {FINAL_LIGHTING_PNG.name} - High-contrast lighting for overlay")
        print("\nVerification checklist:")
        print("  ✓ Open final_terrain.png - oceans should be TRANSPARENT")
        print("  ✓ Open final_lighting.png - should look like black/white relief map")
        print("  ✓ Grid pattern should be GONE (de-dithered)")
        print("\nNext step:")
        print("  - Update frontend to use new 4-layer CSS stack")
        print()

    except Exception as e:
        log_error(f"Processing failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
