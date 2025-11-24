/**
 * HOI4-Style Map Renderer Component
 *
 * Implements the Hearts of Iron 4 visual style using CSS blend modes.
 * Uses Gemini's de-dithering approach to eliminate checkerboard grid patterns.
 *
 * Layer Stack (bottom to top):
 * 1. Water (final_water.png) - Ocean colormap base layer
 * 2. Terrain (final_terrain.png) - De-dithered land texture with transparent water
 * 3. Lighting (final_lighting.png) - High-contrast shadows with overlay blend
 * 4. Political Overlay (canvas) - Country colors with multiply blend
 * 5. Borders (SVG/PNG) - Country/province borders
 */

import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import '../styles/hoi4-map.css';

interface HOI4MapRendererProps {
  /** Map dimensions */
  width: number;
  height: number;

  /** Political overlay opacity (0-1) */
  politicalOpacity?: number;

  /** Whether to show borders */
  showBorders?: boolean;

  /** Callback when a province is clicked */
  onProvinceClick?: (provinceId: string, rgb: { r: number; g: number; b: number }) => void;

  /** Initial camera position and zoom */
  initialCamera?: {
    x: number;
    y: number;
    zoom: number;
  };
}

export interface HOI4MapRendererHandle {
  /** Get the political canvas for custom rendering */
  getPoliticalCanvas: () => HTMLCanvasElement | null;
  /** Get the provinces canvas for hit detection */
  getProvincesCanvas: () => HTMLCanvasElement | null;
}

export const HOI4MapRenderer = forwardRef<HOI4MapRendererHandle, HOI4MapRendererProps>((
  {
    width,
    height,
    politicalOpacity = 0.6,
    showBorders = true,
    onProvinceClick,
    initialCamera = { x: 0, y: 0, zoom: 1 }
  },
  ref
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const politicalCanvasRef = useRef<HTMLCanvasElement>(null);
  const provincesCanvasRef = useRef<HTMLCanvasElement>(null); // Hidden canvas for hit detection

  const [camera, setCamera] = useState(initialCamera);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Initialize canvases
  useEffect(() => {
    const politicalCanvas = politicalCanvasRef.current;
    const provincesCanvas = provincesCanvasRef.current;

    if (!politicalCanvas || !provincesCanvas) return;

    // Set canvas dimensions
    politicalCanvas.width = width;
    politicalCanvas.height = height;
    provincesCanvas.width = width;
    provincesCanvas.height = height;

    // Load provinces.png for hit detection
    const img = new Image();
    img.src = '/provinces.png';
    img.onload = () => {
      const ctx = provincesCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
      }
    };
  }, [width, height]);

  // Handle mouse down (start drag)
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - camera.x,
      y: e.clientY - camera.y
    });
  }, [camera.x, camera.y]);

  // Handle mouse move (pan camera)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    setCamera({
      ...camera,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart.x, dragStart.y, camera]);

  // Handle mouse up (end drag)
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle click (province selection)
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!onProvinceClick || !provincesCanvasRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - camera.x) / camera.zoom;
    const clickY = (e.clientY - rect.top - camera.y) / camera.zoom;

    // Get province color from hidden canvas
    const ctx = provincesCanvasRef.current.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const pixel = ctx.getImageData(Math.floor(clickX), Math.floor(clickY), 1, 1).data;
    const rgb = {
      r: pixel[0],
      g: pixel[1],
      b: pixel[2]
    };

    // Convert RGB to province ID (you can customize this based on your province mapping)
    const provinceId = `${rgb.r}-${rgb.g}-${rgb.b}`;

    onProvinceClick(provinceId, rgb);
  }, [onProvinceClick, camera.x, camera.y, camera.zoom]);

  // Handle zoom (mouse wheel)
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate zoom change
    const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(4, camera.zoom * zoomDelta));

    // Adjust camera position to zoom towards mouse
    const worldX = (mouseX - camera.x) / camera.zoom;
    const worldY = (mouseY - camera.y) / camera.zoom;

    const newX = mouseX - worldX * newZoom;
    const newY = mouseY - worldY * newZoom;

    setCamera({
      x: newX,
      y: newY,
      zoom: newZoom
    });
  }, [camera]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getPoliticalCanvas: () => politicalCanvasRef.current,
    getProvincesCanvas: () => provincesCanvasRef.current
  }));

  return (
    <div
      ref={containerRef}
      className="hoi4-map-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onWheel={handleWheel}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* Layer 1: Water Colormap (Bottom) */}
      <img
        src="/final_water.png"
        alt="Water"
        className="hoi4-map-layer hoi4-map-water"
        draggable={false}
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
          transformOrigin: '0 0'
        }}
      />

      {/* Layer 2: De-Dithered Terrain (Transparent water holes) */}
      <img
        src="/final_terrain.png"
        alt="Terrain"
        className="hoi4-map-layer hoi4-map-terrain"
        draggable={false}
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
          transformOrigin: '0 0'
        }}
      />

      {/* Layer 3: High-Contrast Lighting (Overlay blend for depth) */}
      <img
        src="/final_lighting.png"
        alt="Lighting"
        className="hoi4-map-layer hoi4-map-lighting"
        draggable={false}
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
          transformOrigin: '0 0',
          mixBlendMode: 'overlay',
          opacity: 1.0
        }}
      />

      {/* Layer 4: Political Overlay (Country colors with multiply blend) */}
      <canvas
        ref={politicalCanvasRef}
        className="hoi4-map-layer hoi4-map-political"
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
          transformOrigin: '0 0',
          mixBlendMode: 'multiply',
          opacity: politicalOpacity
        }}
      />

      {/* Layer 5: Borders (Top) */}
      {showBorders && (
        <img
          src="/border_country_0.png"
          alt="Borders"
          className="hoi4-map-layer hoi4-map-borders"
          draggable={false}
          style={{
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
            transformOrigin: '0 0'
          }}
        />
      )}

      {/* Hidden canvas for province hit detection */}
      <canvas
        ref={provincesCanvasRef}
        style={{
          display: 'none',
          position: 'absolute'
        }}
      />
    </div>
  );
});

HOI4MapRenderer.displayName = 'HOI4MapRenderer';

export default HOI4MapRenderer;
