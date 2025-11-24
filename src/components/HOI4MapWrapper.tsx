/**
 * HOI4 Map Wrapper Component
 *
 * Integrates the HOI4MapRenderer with the existing game state and political map logic.
 * This component handles:
 * - Political color painting on the canvas overlay
 * - Province-to-country mapping
 * - Country selection and interaction
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { HOI4MapRenderer } from './HOI4MapRenderer';
import type { GameState } from '../types/GameState';

interface HOI4MapWrapperProps {
  /** Game state containing country data */
  gameState?: GameState;

  /** Province to country mapping */
  provinceOwnerMap?: Map<string, string>;

  /** Country data with colors */
  countryData?: Map<string, { color: string; name: string }>;

  /** Callback when a country is selected */
  onCountrySelect?: (countryId: string) => void;

  /** Political overlay opacity */
  politicalOpacity?: number;

  /** Whether to show borders */
  showBorders?: boolean;
}

// Map dimensions (HOI4 standard)
const MAP_WIDTH = 5632;
const MAP_HEIGHT = 2048;

export const HOI4MapWrapper: React.FC<HOI4MapWrapperProps> = ({
  gameState,
  provinceOwnerMap = new Map(),
  countryData = new Map(),
  onCountrySelect,
  politicalOpacity = 0.6,
  showBorders = true
}) => {
  const politicalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Paint political colors on the canvas overlay
   */
  const paintPoliticalColors = useCallback(async () => {
    if (!politicalCanvasRef.current) return;

    const canvas = politicalCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Load provinces.png for province data
    const provincesImg = new Image();
    provincesImg.src = '/provinces.png';

    await new Promise<void>((resolve) => {
      provincesImg.onload = () => {
        // Draw provinces to get pixel data
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = MAP_WIDTH;
        tempCanvas.height = MAP_HEIGHT;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        if (!tempCtx) return;

        tempCtx.drawImage(provincesImg, 0, 0, MAP_WIDTH, MAP_HEIGHT);
        const provincesData = tempCtx.getImageData(0, 0, MAP_WIDTH, MAP_HEIGHT);

        // Create political overlay
        const politicalData = ctx.createImageData(MAP_WIDTH, MAP_HEIGHT);

        // Map to track province RGB to country color
        const provinceColorMap = new Map<string, { r: number; g: number; b: number }>();

        // Build color map from province assignments
        provinceOwnerMap.forEach((countryId, provinceRgb) => {
          const country = countryData.get(countryId);
          if (country && country.color) {
            // Parse country color (hex)
            const hex = country.color.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            provinceColorMap.set(provinceRgb, { r, g, b });
          }
        });

        // Paint each pixel
        for (let i = 0; i < provincesData.data.length; i += 4) {
          const r = provincesData.data[i];
          const g = provincesData.data[i + 1];
          const b = provincesData.data[i + 2];

          const provinceKey = `${r}-${g}-${b}`;
          const countryColor = provinceColorMap.get(provinceKey);

          if (countryColor) {
            // Apply country color
            politicalData.data[i] = countryColor.r;
            politicalData.data[i + 1] = countryColor.g;
            politicalData.data[i + 2] = countryColor.b;
            politicalData.data[i + 3] = 255; // Full opacity
          } else {
            // Transparent for unowned/water provinces
            politicalData.data[i + 3] = 0;
          }
        }

        // Draw political colors to canvas
        ctx.putImageData(politicalData, 0, 0);
        setIsInitialized(true);
        resolve();
      };
    });
  }, [provinceOwnerMap, countryData]);

  /**
   * Initialize political overlay when data changes
   */
  useEffect(() => {
    if (provinceOwnerMap.size > 0 && countryData.size > 0) {
      paintPoliticalColors();
    }
  }, [provinceOwnerMap, countryData, paintPoliticalColors]);

  /**
   * Handle province clicks
   */
  const handleProvinceClick = useCallback(
    (provinceId: string, rgb: { r: number; g: number; b: number }) => {
      const provinceKey = `${rgb.r}-${rgb.g}-${rgb.b}`;
      const countryId = provinceOwnerMap.get(provinceKey);

      if (countryId && onCountrySelect) {
        onCountrySelect(countryId);
      }
    },
    [provinceOwnerMap, onCountrySelect]
  );

  /**
   * Render the HOI4 map with custom political overlay ref
   */
  return (
    <HOI4MapRenderer
      width={MAP_WIDTH}
      height={MAP_HEIGHT}
      politicalOpacity={politicalOpacity}
      showBorders={showBorders}
      onProvinceClick={handleProvinceClick}
      // Pass the ref to the renderer so we can paint on it
      ref={(renderer) => {
        if (renderer) {
          // Access the political canvas ref from the renderer
          // This is a workaround - you might need to expose this via the component
          const canvas = renderer.querySelector?.('.hoi4-map-political');
          if (canvas instanceof HTMLCanvasElement) {
            politicalCanvasRef.current = canvas;
          }
        }
      }}
    />
  );
};

export default HOI4MapWrapper;
