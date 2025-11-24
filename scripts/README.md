# Map Processing Scripts

This directory contains Python scripts for processing HOI4-style map assets.

## process_map.py

Converts raw HOI4 BMP files into web-optimized PNG assets with proper layering for CSS blend modes.

### Requirements

```bash
pip install Pillow numpy
```

### Usage

```bash
python scripts/process_map.py
```

### What it does

1. **Fixes terrain void artifacts** - Converts indexed terrain.bmp to RGB and fills black void pixels (Amazon, DRC regions)
2. **Generates hillshade layer** - Converts world_normal.bmp into a grayscale shadow map for depth perception
3. **Creates base texture** - Composites terrain and water colormap into a single base layer

### Input Files (required)

- `assets-source/terrain.bmp` - Terrain index map
- `assets-source/world_normal.bmp` - Normal map for lighting
- `assets-source/provinces.bmp` - Province map (for water detection)
- `public/colormap_water.png` - Water color gradient

### Output Files

- `public/terrain_fixed.png` - Fixed terrain without void artifacts
- `public/map_shadows.png` - Hillshade layer (use with mix-blend-mode: overlay)
- `public/map_base.png` - Composite base texture (terrain + water)

### Integration

The generated assets are designed to work with the HOI4MapRenderer component:

```tsx
import { HOI4MapRenderer } from './components/HOI4MapRenderer';

<HOI4MapRenderer
  width={5632}
  height={2048}
  politicalOpacity={0.6}
  showBorders={true}
/>
```

### CSS Blend Mode Stack

```css
Layer 1: map_base.png      (z-index: 1, normal blend)
Layer 2: map_shadows.png   (z-index: 2, overlay blend)
Layer 3: political canvas  (z-index: 3, multiply blend)
Layer 4: borders           (z-index: 4, normal blend)
```

This replicates the HOI4 shader pipeline using web-standard CSS blend modes.
