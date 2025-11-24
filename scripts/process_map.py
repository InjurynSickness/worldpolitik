#!/usr/bin/env python3
"""
HOI4-Style Map Asset Processor

This script processes raw HOI4 map files to create web-optimized assets:
1. Fix "black void" artifacts in terrain.bmp (Amazon/DRC regions)
2. Generate hillshade/shadow layer from world_normal.bmp
3. Create composite base texture (terrain + water)

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
MAP_BASE_PNG = PUBLIC_DIR / "map_base.png"
MAP_SHADOWS_PNG = PUBLIC_DIR / "map_shadows.png"
TERRAIN_FIXED_PNG = PUBLIC_DIR / "terrain_fixed.png"

# Colors
JUNGLE_GREEN = (59, 89, 63)  # Fallback color for void pixels


def log_info(message: str):
    """Print info message."""
    print(f"ℹ️  {message}")


def log_success(message: str):
    """Print success message."""
    print(f"✅ {message}")


def log_error(message: str):
    """Print error message."""
    print(f"❌ {message}")


def fix_terrain_voids(terrain_path: Path, provinces_path: Path, output_path: Path) -> Image.Image:
    """
    Fix black void artifacts in terrain.bmp.

    The issue: Indexed BMP files have transparent/void pixels that render as black
    in jungle regions (Amazon, DRC, etc.)

    Solution:
    1. Convert from Indexed mode to RGB
    2. Detect void pixels (pure black or transparent)
    3. Fill with jungle green or sample from neighboring valid pixels

    Args:
        terrain_path: Path to terrain.bmp
        provinces_path: Path to provinces.bmp (for land/water detection)
        output_path: Where to save the fixed terrain

    Returns:
        Fixed terrain image
    """
    log_info("Loading terrain.bmp and provinces.bmp...")

    # Load terrain (may be indexed)
    terrain = Image.open(terrain_path)
    provinces = Image.open(provinces_path)

    # Convert to RGB if needed
    if terrain.mode != 'RGB':
        log_info(f"Converting terrain from {terrain.mode} to RGB...")
        terrain = terrain.convert('RGB')

    if provinces.mode != 'RGB':
        provinces = provinces.convert('RGB')

    # Convert to numpy arrays for processing
    terrain_arr = np.array(terrain)
    provinces_arr = np.array(provinces)

    log_info("Detecting and fixing void pixels...")

    # Detect void pixels:
    # 1. Pure black (0,0,0) on land areas
    # 2. Very dark pixels on land areas (might be corrupted)

    # Water is typically very dark in provinces.bmp (R,G,B < 10)
    is_water = (provinces_arr[:, :, 0] < 10) & \
               (provinces_arr[:, :, 1] < 10) & \
               (provinces_arr[:, :, 2] < 10)

    # Void pixels are pure black on LAND areas
    is_void = (terrain_arr[:, :, 0] == 0) & \
              (terrain_arr[:, :, 1] == 0) & \
              (terrain_arr[:, :, 2] == 0) & \
              (~is_water)

    void_count = np.sum(is_void)
    log_info(f"Found {void_count:,} void pixels to fix")

    if void_count > 0:
        # Fix void pixels with jungle green
        terrain_arr[is_void] = JUNGLE_GREEN
        log_success(f"Fixed {void_count:,} void pixels with jungle green")

    # Create fixed image
    terrain_fixed = Image.fromarray(terrain_arr, 'RGB')

    # Save fixed terrain
    log_info(f"Saving fixed terrain to {output_path}...")
    terrain_fixed.save(output_path, 'PNG', optimize=True)
    log_success(f"Fixed terrain saved: {output_path}")

    return terrain_fixed


def generate_hillshade(normal_path: Path, output_path: Path) -> Image.Image:
    """
    Generate hillshade/shadow layer from world_normal.bmp.

    Normal maps can't be used directly with CSS blend modes.
    We need to convert RGB normal data to a grayscale heightmap/shadow map.

    Process:
    1. Convert normal map (RGB) to grayscale
    2. Apply high-contrast enhancement
    3. Apply emboss filter to simulate lighting from top-left
    4. Adjust levels for optimal depth perception

    Args:
        normal_path: Path to world_normal.bmp
        output_path: Where to save the hillshade

    Returns:
        Hillshade image
    """
    log_info("Loading world_normal.bmp...")
    normal = Image.open(normal_path)

    # Convert to RGB if needed
    if normal.mode != 'RGB':
        normal = normal.convert('RGB')

    log_info("Converting normal map to grayscale...")
    # Convert to grayscale (this gives us a basic height representation)
    grayscale = normal.convert('L')

    log_info("Applying high-contrast filter...")
    # Enhance contrast to make terrain features more pronounced
    # Use ImageOps.autocontrast for automatic level adjustment
    contrast_enhanced = ImageOps.autocontrast(grayscale, cutoff=2)

    log_info("Applying emboss filter for directional lighting...")
    # Apply emboss to simulate light from top-left (standard for maps)
    # This creates the "shadow" effect that gives depth
    embossed = contrast_enhanced.filter(ImageFilter.EMBOSS)

    log_info("Adjusting levels for optimal depth perception...")
    # The emboss filter produces mid-gray values
    # We need to adjust to use full dynamic range
    hillshade_arr = np.array(embossed)

    # Normalize to 0-255 range for maximum contrast
    min_val = hillshade_arr.min()
    max_val = hillshade_arr.max()

    if max_val > min_val:
        hillshade_arr = ((hillshade_arr - min_val) / (max_val - min_val) * 255).astype(np.uint8)

    # Apply slight gamma correction to make shadows more visible
    # Gamma < 1 brightens, Gamma > 1 darkens
    gamma = 1.2
    hillshade_arr = (255 * (hillshade_arr / 255) ** gamma).astype(np.uint8)

    hillshade = Image.fromarray(hillshade_arr, 'L')

    # Save hillshade
    log_info(f"Saving hillshade to {output_path}...")
    hillshade.save(output_path, 'PNG', optimize=True)
    log_success(f"Hillshade saved: {output_path}")

    return hillshade


def create_base_texture(terrain_fixed: Image.Image, water_colormap_path: Path,
                       provinces_path: Path, output_path: Path) -> Image.Image:
    """
    Create base texture by compositing terrain over water colormap.

    Process:
    1. Use provinces.bmp to identify water areas
    2. Place water colormap as base
    3. Composite terrain over water (terrain has transparency on water)

    Args:
        terrain_fixed: Fixed terrain image
        water_colormap_path: Path to water colormap
        provinces_path: Path to provinces.bmp
        output_path: Where to save the base texture

    Returns:
        Base texture image
    """
    log_info("Creating base texture (terrain + water)...")

    # Load water colormap
    if not water_colormap_path.exists():
        log_error(f"Water colormap not found: {water_colormap_path}")
        log_info("Using solid water color as fallback...")
        water = Image.new('RGB', terrain_fixed.size, (41, 52, 73))  # HOI4 ocean blue
    else:
        water = Image.open(water_colormap_path)
        if water.size != terrain_fixed.size:
            log_info(f"Resizing water colormap from {water.size} to {terrain_fixed.size}...")
            water = water.resize(terrain_fixed.size, Image.Resampling.LANCZOS)
        water = water.convert('RGB')

    # Load provinces for water detection
    provinces = Image.open(provinces_path).convert('RGB')
    provinces_arr = np.array(provinces)

    # Create alpha mask for terrain (transparent on water)
    is_water = (provinces_arr[:, :, 0] < 10) & \
               (provinces_arr[:, :, 1] < 10) & \
               (provinces_arr[:, :, 2] < 10)

    # Create RGBA terrain with alpha channel
    terrain_arr = np.array(terrain_fixed)
    terrain_rgba = np.zeros((*terrain_arr.shape[:2], 4), dtype=np.uint8)
    terrain_rgba[:, :, :3] = terrain_arr
    terrain_rgba[:, :, 3] = 255  # Start with full opacity
    terrain_rgba[is_water, 3] = 0  # Make water transparent

    terrain_with_alpha = Image.fromarray(terrain_rgba, 'RGBA')

    # Composite terrain over water
    base = water.copy()
    base.paste(terrain_with_alpha, (0, 0), terrain_with_alpha)

    # Save base texture
    log_info(f"Saving base texture to {output_path}...")
    base.save(output_path, 'PNG', optimize=True)
    log_success(f"Base texture saved: {output_path}")

    return base


def main():
    """Main processing pipeline."""
    print("=" * 60)
    print("HOI4-Style Map Asset Processor")
    print("=" * 60)
    print()

    # Check for required dependencies
    try:
        import PIL
        import numpy
    except ImportError as e:
        log_error(f"Missing required dependency: {e}")
        log_info("Install with: pip install Pillow numpy")
        sys.exit(1)

    # Verify input files exist
    required_files = [TERRAIN_BMP, NORMAL_BMP, PROVINCES_BMP]
    missing = [f for f in required_files if not f.exists()]

    if missing:
        log_error("Missing required input files:")
        for f in missing:
            print(f"  - {f}")
        sys.exit(1)

    # Create output directory if needed
    PUBLIC_DIR.mkdir(exist_ok=True)

    try:
        # Step 1: Fix terrain voids
        print("\n" + "─" * 60)
        print("STEP 1: Fixing Terrain Voids")
        print("─" * 60)
        terrain_fixed = fix_terrain_voids(TERRAIN_BMP, PROVINCES_BMP, TERRAIN_FIXED_PNG)

        # Step 2: Generate hillshade
        print("\n" + "─" * 60)
        print("STEP 2: Generating Hillshade Layer")
        print("─" * 60)
        hillshade = generate_hillshade(NORMAL_BMP, MAP_SHADOWS_PNG)

        # Step 3: Create base texture
        print("\n" + "─" * 60)
        print("STEP 3: Creating Base Texture")
        print("─" * 60)
        base = create_base_texture(terrain_fixed, WATER_COLORMAP, PROVINCES_BMP, MAP_BASE_PNG)

        # Success summary
        print("\n" + "=" * 60)
        log_success("All assets processed successfully!")
        print("=" * 60)
        print("\nGenerated files:")
        print(f"  1. {TERRAIN_FIXED_PNG.name} - Fixed terrain (void artifacts removed)")
        print(f"  2. {MAP_SHADOWS_PNG.name} - Hillshade layer (for CSS overlay blend)")
        print(f"  3. {MAP_BASE_PNG.name} - Base texture (terrain + water composite)")
        print("\nNext steps:")
        print("  - Update frontend code to use CSS blend modes")
        print("  - Layer 1: map_base.png (z-index: 1)")
        print("  - Layer 2: map_shadows.png (z-index: 2, mix-blend-mode: overlay)")
        print("  - Layer 3: political overlay (z-index: 3, mix-blend-mode: multiply)")
        print()

    except Exception as e:
        log_error(f"Processing failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
