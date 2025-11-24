# HOI4 Map Renderer - Integration Example

This document shows how to integrate the HOI4MapRenderer into your existing application.

## Quick Start Example

```tsx
import React, { useRef, useEffect } from 'react';
import { HOI4MapRenderer, HOI4MapRendererHandle } from './components/HOI4MapRenderer';

function MapView() {
  const mapRef = useRef<HOI4MapRendererHandle>(null);

  // Paint political colors after mount
  useEffect(() => {
    const canvas = mapRef.current?.getPoliticalCanvas();
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Example: Paint a red rectangle for testing
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(100, 100, 500, 300);
  }, []);

  // Handle province clicks
  const handleProvinceClick = (provinceId: string, rgb: { r: number, g: number, b: number }) => {
    console.log('Clicked province:', provinceId, 'RGB:', rgb);
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <HOI4MapRenderer
        ref={mapRef}
        width={5632}
        height={2048}
        politicalOpacity={0.6}
        showBorders={true}
        onProvinceClick={handleProvinceClick}
      />
    </div>
  );
}

export default MapView;
```

## Advanced Example: Province Painting

```tsx
import React, { useRef, useEffect, useState } from 'react';
import { HOI4MapRenderer, HOI4MapRendererHandle } from './components/HOI4MapRenderer';

interface Province {
  id: string;
  rgb: { r: number; g: number; b: number };
  owner: string;
}

interface Country {
  id: string;
  name: string;
  color: string; // hex color like "#FF0000"
}

function AdvancedMapView() {
  const mapRef = useRef<HOI4MapRendererHandle>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Example data
  const countries: Map<string, Country> = new Map([
    ['GER', { id: 'GER', name: 'Germany', color: '#7D7D7D' }],
    ['FRA', { id: 'FRA', name: 'France', color: '#0055A4' }],
    ['GBR', { id: 'GBR', name: 'United Kingdom', color: '#C8102E' }],
    ['USA', { id: 'USA', name: 'United States', color: '#B22234' }]
  ]);

  // Map province RGB to country
  const provinceOwners: Map<string, string> = new Map([
    // Format: 'R-G-B' -> 'COUNTRY_ID'
    ['255-0-0', 'GER'],
    ['0-255-0', 'FRA'],
    ['0-0-255', 'GBR'],
    ['255-255-0', 'USA']
  ]);

  // Paint all provinces with their owner's color
  useEffect(() => {
    const politicalCanvas = mapRef.current?.getPoliticalCanvas();
    const provincesCanvas = mapRef.current?.getProvincesCanvas();

    if (!politicalCanvas || !provincesCanvas) return;

    const politicalCtx = politicalCanvas.getContext('2d');
    const provincesCtx = provincesCanvas.getContext('2d', { willReadFrequently: true });

    if (!politicalCtx || !provincesCtx) return;

    // Get province data
    const provincesData = provincesCtx.getImageData(
      0, 0,
      provincesCanvas.width,
      provincesCanvas.height
    );

    // Create political overlay
    const politicalData = politicalCtx.createImageData(
      politicalCanvas.width,
      politicalCanvas.height
    );

    // Paint each pixel
    for (let i = 0; i < provincesData.data.length; i += 4) {
      const r = provincesData.data[i];
      const g = provincesData.data[i + 1];
      const b = provincesData.data[i + 2];

      // Create province key
      const provinceKey = `${r}-${g}-${b}`;
      const countryId = provinceOwners.get(provinceKey);

      if (countryId) {
        const country = countries.get(countryId);
        if (country) {
          // Parse hex color
          const hex = country.color.replace('#', '');
          const cr = parseInt(hex.substring(0, 2), 16);
          const cg = parseInt(hex.substring(2, 4), 16);
          const cb = parseInt(hex.substring(4, 6), 16);

          // Apply country color
          politicalData.data[i] = cr;
          politicalData.data[i + 1] = cg;
          politicalData.data[i + 2] = cb;
          politicalData.data[i + 3] = 255; // Full opacity
        }
      } else {
        // Transparent for unowned provinces
        politicalData.data[i + 3] = 0;
      }
    }

    // Draw to canvas
    politicalCtx.putImageData(politicalData, 0, 0);
  }, [countries, provinceOwners]);

  // Handle province clicks
  const handleProvinceClick = (provinceId: string, rgb: { r: number, g: number, b: number }) => {
    const provinceKey = `${rgb.r}-${rgb.g}-${rgb.b}`;
    const countryId = provinceOwners.get(provinceKey);

    if (countryId) {
      setSelectedCountry(countryId);
      console.log('Selected country:', countries.get(countryId)?.name);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <HOI4MapRenderer
        ref={mapRef}
        width={5632}
        height={2048}
        politicalOpacity={0.6}
        showBorders={true}
        onProvinceClick={handleProvinceClick}
      />

      {/* Country info overlay */}
      {selectedCountry && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '15px',
            borderRadius: '5px',
            fontFamily: 'monospace'
          }}
        >
          <h3>{countries.get(selectedCountry)?.name}</h3>
          <div>ID: {selectedCountry}</div>
          <div style={{
            width: 50,
            height: 50,
            backgroundColor: countries.get(selectedCountry)?.color,
            marginTop: 10,
            border: '2px solid white'
          }} />
        </div>
      )}
    </div>
  );
}

export default AdvancedMapView;
```

## Customization Examples

### Adjust Terrain Visibility

```tsx
// More terrain visible (lighter political colors)
<HOI4MapRenderer politicalOpacity={0.4} />

// Less terrain visible (stronger political colors)
<HOI4MapRenderer politicalOpacity={0.8} />

// Pure terrain view (no political colors)
<HOI4MapRenderer politicalOpacity={0} />
```

### Toggle Borders

```tsx
const [showBorders, setShowBorders] = useState(true);

<HOI4MapRenderer
  showBorders={showBorders}
/>

<button onClick={() => setShowBorders(!showBorders)}>
  Toggle Borders
</button>
```

### Custom Initial Camera Position

```tsx
// Start zoomed in on Europe
<HOI4MapRenderer
  initialCamera={{
    x: -1500,  // Pan left
    y: -400,   // Pan up
    zoom: 2.0  // 2x zoom
  }}
/>
```

## Integration with Existing Game State

If you have an existing game state structure:

```tsx
import { GameState } from './types/GameState';

function IntegratedMapView({ gameState }: { gameState: GameState }) {
  const mapRef = useRef<HOI4MapRendererHandle>(null);

  // Update political colors when game state changes
  useEffect(() => {
    const canvas = mapRef.current?.getPoliticalCanvas();
    if (!canvas) return;

    // Your existing political map painting logic here
    paintPoliticalMap(canvas, gameState);
  }, [gameState]);

  return (
    <HOI4MapRenderer
      ref={mapRef}
      width={5632}
      height={2048}
      onProvinceClick={(provinceId, rgb) => {
        // Your existing province selection logic
        handleProvinceSelection(provinceId, rgb, gameState);
      }}
    />
  );
}
```

## Performance Tips

1. **Memoize painting operations**
   ```tsx
   const paintPoliticalColors = useCallback(() => {
     // ... painting logic
   }, [dependencies]);
   ```

2. **Use Web Workers for heavy processing**
   ```tsx
   const worker = new Worker('province-painter.worker.js');
   worker.postMessage({ provincesData, colors });
   worker.onmessage = (e) => {
     ctx.putImageData(e.data.politicalData, 0, 0);
   };
   ```

3. **Debounce camera updates**
   ```tsx
   import { debounce } from 'lodash';

   const debouncedCameraUpdate = debounce((camera) => {
     // Update camera-dependent UI
   }, 100);
   ```

## Troubleshooting

### Province clicks not working
- Ensure provinces.png is in the public/ directory
- Check that the provinces.png dimensions match the map dimensions
- Verify the province RGB mapping is correct

### Political colors not showing
- Make sure you're painting to the political canvas after it's initialized
- Check the useEffect dependencies
- Verify politicalOpacity is > 0

### Shadows too strong/weak
- Edit the shadow layer opacity in HOI4MapRenderer.tsx (line ~201)
- Adjust the gamma correction in process_map.py
- Regenerate map_shadows.png with different settings

### Performance issues
- Reduce map resolution (downsample assets)
- Use lower quality blend modes
- Implement viewport culling for large maps
- Consider using WebGL renderer for very large maps
