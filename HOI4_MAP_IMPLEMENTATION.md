# HOI4-Style Map Implementation Guide

This document explains the complete HOI4-style map rendering system for web/Electron applications.

## Overview

This implementation replicates Hearts of Iron 4's visual style using **CSS blend modes** instead of proprietary game engine shaders. It solves common rendering issues (black voids, tiling artifacts) and achieves authentic terrain depth + political coloring.

## Architecture

### Two-Phase System

1. **Asset Processing (Python)** - Offline preprocessing of raw HOI4 files
2. **Frontend Rendering (React/CSS)** - Real-time rendering using CSS blend modes

## Phase 1: Asset Processing

### Script: `scripts/process_map.py`

Processes raw HOI4 BMP files into web-optimized layers.

#### What it fixes:

1. **Black Void Artifacts** (Amazon/DRC regions)
   - Issue: Indexed BMP transparency renders as black
   - Fix: Convert to RGB and fill void pixels with jungle green

2. **Normal Map Incompatibility**
   - Issue: RGB normal maps can't be used with CSS blend modes
   - Fix: Convert to grayscale hillshade with emboss filter

3. **Layer Separation**
   - Issue: HOI4 uses shader-based compositing
   - Fix: Pre-composite terrain + water into single base layer

#### Generated Assets:

```
public/
  ├── terrain_fixed.png  - Terrain without void artifacts
  ├── map_shadows.png    - Hillshade layer (for depth)
  └── map_base.png       - Base texture (terrain + water)
```

#### Running the Script:

```bash
# Install dependencies
pip install Pillow numpy

# Run processor
python scripts/process_map.py
```

## Phase 2: Frontend Rendering

### Component: `src/components/HOI4MapRenderer.tsx`

Implements the HOI4 visual style using CSS blend modes.

#### Layer Stack (bottom to top):

```
┌─────────────────────────────────────────┐
│  Layer 4: Borders (z-index: 4)          │  ← Country/province borders
│  mix-blend-mode: normal                 │     Always on top
├─────────────────────────────────────────┤
│  Layer 3: Political (z-index: 3)        │  ← Country colors (canvas)
│  mix-blend-mode: multiply               │     Terrain shows through
│  opacity: 0.6                            │     (HOI4 signature look)
├─────────────────────────────────────────┤
│  Layer 2: Shadows (z-index: 2)          │  ← Depth/lighting
│  mix-blend-mode: overlay                │     Makes mountains "pop"
│  opacity: 1.0                            │     Doesn't obscure colors
├─────────────────────────────────────────┤
│  Layer 1: Base (z-index: 1)             │  ← Terrain + water textures
│  mix-blend-mode: normal                 │     Foundation layer
└─────────────────────────────────────────┘
```

#### Key CSS Blend Modes:

**Overlay** (for shadows):
- Dark areas create shadows
- Light areas enhance highlights
- Mid-gray (128,128,128) is neutral
- **Result:** Depth perception without color distortion

**Multiply** (for political colors):
- Darker terrain darkens the country colors
- Creates natural color variation
- Mountains appear darker, plains lighter
- **Result:** "Painted nations" look with visible terrain

### Usage Example:

```tsx
import { HOI4MapRenderer } from './components/HOI4MapRenderer';

function MapView() {
  const handleProvinceClick = (provinceId: string, rgb: { r: number, g: number, b: number }) => {
    console.log('Clicked province:', provinceId, rgb);
  };

  return (
    <HOI4MapRenderer
      width={5632}
      height={2048}
      politicalOpacity={0.6}
      showBorders={true}
      onProvinceClick={handleProvinceClick}
      initialCamera={{ x: 0, y: 0, zoom: 1 }}
    />
  );
}
```

## Phase 3: Interactive Features

### Hit Detection

Uses an **off-screen canvas** with provinces.png:

1. Load provinces.bmp into hidden canvas
2. On click, read RGB pixel at mouse coordinates
3. Map RGB → Province ID using your definition system
4. Trigger province selection callback

### Camera Controls

Implemented via CSS transforms:

- **Pan:** Drag with mouse (translate)
- **Zoom:** Mouse wheel (scale)
- **Performance:** GPU-accelerated via `will-change: transform`

### Border Rendering

Separate overlay layer (z-index: 4):

- Can use SVG for vector borders (scalable)
- Or PNG for pre-rendered borders (faster)
- Toggleable via `showBorders` prop

## Comparison: Canvas vs CSS Approach

| Aspect | Canvas Approach | CSS Blend Mode Approach |
|--------|----------------|-------------------------|
| **Performance** | CPU-bound pixel operations | GPU-accelerated compositing |
| **Code Complexity** | Complex blend math in JS | Simple CSS declarations |
| **Memory Usage** | Multiple canvas buffers | Browser-optimized image layers |
| **Authenticity** | Approximates HOI4 shaders | Identical to HOI4 visuals |
| **Maintainability** | Manual pixel manipulation | Declarative layer stack |

## Solving the "Black Void" Problem

### Root Cause:

HOI4's terrain.bmp uses **indexed color mode** with palette-based colors. Some palette indices are transparent (alpha 0) or pure black, appearing as voids in jungle regions.

### Solution Steps:

1. **Load terrain.bmp** (indexed)
2. **Convert to RGB** (expands palette to full color)
3. **Detect voids:**
   ```python
   is_void = (R == 0) & (G == 0) & (B == 0) & (is_land)
   ```
4. **Fill voids:**
   ```python
   terrain[is_void] = JUNGLE_GREEN  # (59, 89, 63)
   ```

### Result:

No more black holes in the Amazon or Congo!

## Hillshade Generation Algorithm

Converts world_normal.bmp (RGB normal map) → grayscale shadow map:

```python
# 1. Convert RGB normal to grayscale
grayscale = normal.convert('L')

# 2. Enhance contrast
contrast = ImageOps.autocontrast(grayscale, cutoff=2)

# 3. Apply emboss filter (simulates light from top-left)
embossed = contrast.filter(ImageFilter.EMBOSS)

# 4. Normalize to full range (0-255)
hillshade = normalize(embossed)

# 5. Apply gamma correction for better shadows
hillshade = (255 * (hillshade / 255) ** 1.2)
```

**Result:** Realistic depth perception that works with CSS `mix-blend-mode: overlay`

## Integration Checklist

- [x] Install Python dependencies (Pillow, numpy)
- [x] Run `scripts/process_map.py` to generate assets
- [x] Verify generated files in `public/` directory
- [ ] Import `HOI4MapRenderer` component in your app
- [ ] Configure map dimensions (width, height)
- [ ] Implement province click handler
- [ ] Load political colors into canvas layer
- [ ] Test pan, zoom, and province selection
- [ ] Customize opacity and border visibility as needed

## Customization Options

### Adjust Shadow Intensity

```tsx
<img
  src="/map_shadows.png"
  style={{
    mixBlendMode: 'overlay',
    opacity: 0.8  // ← Reduce for subtler shadows
  }}
/>
```

### Adjust Political Transparency

```tsx
<HOI4MapRenderer
  politicalOpacity={0.4}  // ← 0 = terrain only, 1 = full colors
/>
```

### Custom Blend Modes

Experiment with different modes for creative effects:

- `overlay` - Best for shadows (default)
- `soft-light` - Gentler depth effect
- `multiply` - Best for political colors (default)
- `screen` - Lightens colors (good for glowing effects)
- `color-dodge` - High contrast highlights

## Performance Tips

1. **Pre-generate assets** - Don't process BMPs at runtime
2. **Use CSS transforms** - Hardware-accelerated panning/zooming
3. **Minimize canvas operations** - Only update political layer when needed
4. **Enable image caching** - Browser caches PNG layers automatically
5. **Use `will-change`** - Hint GPU to optimize transforms

## Troubleshooting

### "Black voids still appearing"

- Ensure `process_map.py` ran successfully
- Check that `terrain_fixed.png` was generated
- Verify you're using `map_base.png` (not raw `terrain.png`)

### "No depth/shadows visible"

- Check `map_shadows.png` is loaded
- Verify CSS has `mix-blend-mode: overlay` on shadow layer
- Try increasing shadow opacity

### "Political colors too dark"

- Reduce `politicalOpacity` prop
- Use `soft-light` instead of `multiply` blend mode
- Brighten country colors in canvas rendering

### "Borders not showing"

- Verify `showBorders={true}` prop is set
- Check border PNG exists in `public/` directory
- Ensure border layer has highest z-index

## Technical Notes

### Why CSS Blend Modes?

CSS blend modes are **web standards** (supported in all modern browsers) that replicate Photoshop/game engine blend operations:

- **Overlay:** `if (base < 0.5) { 2*base*blend } else { 1 - 2*(1-base)*(1-blend) }`
- **Multiply:** `base * blend`
- **Screen:** `1 - (1-base)*(1-blend)`

These run on the GPU, making them **faster than JavaScript pixel manipulation**.

### Map Coordinate Systems

- **Screen Space:** Browser viewport coordinates (pixels)
- **World Space:** Map coordinates (0-5632 width, 0-2048 height)
- **Province Space:** RGB color → Province ID mapping

Transform between spaces:

```typescript
const worldX = (screenX - camera.x) / camera.zoom;
const worldY = (screenY - camera.y) / camera.zoom;
```

## Future Enhancements

- [ ] WebGL renderer for massive maps (10k+ provinces)
- [ ] Dynamic terrain generation (procedural textures)
- [ ] Animated weather effects (rain, snow overlays)
- [ ] Day/night cycle (adjust hillshade opacity)
- [ ] Custom shader support (via WebGL)

## Credits

- **HOI4 Rendering Pipeline:** Paradox Interactive
- **CSS Blend Mode Specification:** W3C
- **Implementation Guide:** Based on Gemini's instructions

## License

See project LICENSE file.
