// /src/provinceMap.ts - REFACTORED MAIN COORDINATOR

import { provinceColorMap, Province } from './provinceData.js';
import { provinceBorders } from './provinceBorders.js';
import { Country } from './types.js';
import { CountryData } from './countryData.js';
import { CanvasManager } from './rendering/CanvasManager.js';
import { CameraController } from './camera/CameraController.js';
import { MapInteractionHandler } from './interaction/MapInteractionHandler.js';
import { MapRenderer } from './rendering/MapRenderer.js';
import { CountryLabelCalculator } from './labels/CountryLabelCalculator.js';
import { LabelRenderer } from './labels/LabelRenderer.js';
import { MapEditor } from './editor/MapEditor.js';
import { PoliticalMapBuilder } from './political/PoliticalMapBuilder.js';
import { BorderMapBuilder } from './borders/BorderMapBuilder.js';
import { CountryEditor } from './editor/CountryEditor.js';
import { ProvinceSelector } from './editor/ProvinceSelector.js';
import { BorderGenerator } from './rendering/BorderGenerator.js';
import { HOI4TerrainRenderer } from './rendering/HOI4TerrainRenderer.js';
import { ThreeJSMapRenderer } from './rendering/ThreeJSMapRenderer.js';
import { logger } from './utils/Logger.js';

const MAP_WIDTH = 5632;  // HOI4 map dimensions
const MAP_HEIGHT = 2048;

export class ProvinceMap {
    private container: HTMLElement;
    private onCountrySelect: (countryId: string) => void;
    private onMapReady?: () => void;

    private canvasManager: CanvasManager;
    private cameraController: CameraController;
    private interactionHandler: MapInteractionHandler;
    private mapRenderer: MapRenderer;
    private threeJSRenderer: ThreeJSMapRenderer | null = null;
    private labelCalculator: CountryLabelCalculator;
    private labelRenderer: LabelRenderer;
    private mapEditor: MapEditor;
    private politicalMapBuilder: PoliticalMapBuilder;
    private borderMapBuilder: BorderMapBuilder;

    // New comprehensive country editor
    private countryEditor: CountryEditor | null = null;
    private provinceSelector: ProvinceSelector | null = null;

    private terrainImage = new Image();
    private terrainAtlasImage = new Image(); // New: DDS terrain atlas
    private provinceImage = new Image();
    private riversImage = new Image();
    private waterTextureImage = new Image();

    // HOI4 Terrain renderer - uses actual HOI4 terrain atlas textures
    private hoi4TerrainRenderer: HOI4TerrainRenderer | null = null;

    private selectedProvinceId: string | null = null;
    private mapReady = false;
    private politicalMapReady = false;
    private bordersReady = false;

    private isEditorMode = false;
    private provinceOwnerMap: Map<string, string> = new Map();
    private countries: Map<string, Country> = new Map();
    private allCountryData: Map<string, CountryData> = new Map();
    
    private countryLabelCache: Map<string, { x: number; y: number }> = new Map();

    private pulseAnimationId: number | null = null;
    private pulseStartTime: number | null = null;
    private pulseOpacity: number = 0.7;
    private pulseColor: string = "255, 255, 240";

    // Render throttling to prevent lag on pan/zoom
    private renderPending: boolean = false;

    // Cache province border pixels on demand (only for selected province)
    private selectedProvinceBorderCache: Map<string, [number, number][]> = new Map();

    // Country borders - static black borders between countries
    private countryBorders: [number, number][] = [];
    private countryBordersReady: boolean = false;

    constructor(container: HTMLElement, onCountrySelect: (countryId: string) => void, onMapReady?: () => void) {
        this.container = container;
        this.onCountrySelect = onCountrySelect;
        this.onMapReady = onMapReady;

        // Clean up any existing canvases in the container (from previous map instances)
        const existingCanvases = container.querySelectorAll('canvas');
        existingCanvases.forEach(canvas => {
            if (canvas.parentElement) {
                canvas.parentElement.removeChild(canvas);
            }
        });

        // Keep CanvasManager for UI overlays only (province selection, hover effects)
        // It will create a visible canvas on top of the Three.js canvas
        this.canvasManager = new CanvasManager(container, MAP_WIDTH, MAP_HEIGHT);

        // Initialize Three.js renderer (replaces Canvas 2D rendering)
        // This canvas should be below the CanvasManager's visible canvas
        const canvas = document.createElement('canvas');
        canvas.id = 'three-canvas';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '0';
        // Insert before the visible canvas so it's below
        container.insertBefore(canvas, this.canvasManager.visibleCanvas);

        this.threeJSRenderer = new ThreeJSMapRenderer(canvas);

        // Make the visible canvas transparent so Three.js shows through
        this.canvasManager.visibleCanvas.style.backgroundColor = 'transparent';
        this.canvasManager.visibleCanvas.style.zIndex = '1';
        this.canvasManager.visibleCanvas.style.pointerEvents = 'auto'; // Ensure mouse events work
        this.cameraController = new CameraController(
            this.canvasManager.visibleCanvas.width,
            this.canvasManager.visibleCanvas.height,
            MAP_WIDTH,
            MAP_HEIGHT
        );
        
        this.mapRenderer = new MapRenderer(this.canvasManager, this.cameraController);
        this.labelCalculator = new CountryLabelCalculator(
            MAP_WIDTH,
            MAP_HEIGHT,
            this.canvasManager.hiddenCtx,
            this.allCountryData
        );
        this.labelRenderer = new LabelRenderer(this.allCountryData);
        this.mapEditor = new MapEditor(this.provinceOwnerMap, (x, y) => this.getProvinceAt(x, y));
        this.politicalMapBuilder = new PoliticalMapBuilder(
            MAP_WIDTH,
            MAP_HEIGHT,
            this.canvasManager.hiddenCtx
        );
        this.borderMapBuilder = new BorderMapBuilder(MAP_WIDTH, MAP_HEIGHT);
        
        this.interactionHandler = new MapInteractionHandler(
            this.canvasManager.visibleCanvas,
            this.cameraController,
            (x, y) => this.handleHover(x, y),  // Enable hover to show province borders
            (x, y) => this.handleClick(x, y),
            (x, y, isRightClick) => this.handlePaint(x, y, isRightClick),
            () => this.requestRender(),
            () => this.isEditorMode,
            () => this.handleDeselect()  // ESC key handler
        );
        
        this.loadAssets();
        window.addEventListener('resize', () => this.handleResize());
    }

    private loadAssets(): void {
        logger.time('ProvinceMap', 'Total asset loading');
        logger.info('ProvinceMap', '🚀 Starting asset loading (Canvas 2D → Three.js v2.0)...');

        let assetsLoaded = 0;
        const totalAssets = 3; // terrain, provinces, rivers

        const onAssetLoad = () => {
            assetsLoaded++;
            logger.info('ProvinceMap', `Asset loaded (${assetsLoaded}/${totalAssets})`);

            if (assetsLoaded === totalAssets) {
                logger.info('ProvinceMap', '✅ All assets loaded');

                // Draw provinces to hidden canvas for pixel picking
                this.canvasManager.hiddenCtx.drawImage(this.provinceImage, 0, 0);
                logger.info('ProvinceMap', '✓ Province image drawn to hidden canvas');

                this.mapReady = true;

                // Process terrain (mask out water using provinces)
                logger.info('ProvinceMap', '🗻 Processing terrain...');
                this.processTerrainImage();

                // Build political map on Canvas 2D
                logger.info('ProvinceMap', '🗺️ Building political map...');
                this.buildPoliticalMap();

                // Build borders
                logger.info('ProvinceMap', '🔲 Building borders...');
                this.generateCountryBorders();
                this.buildBorderMap();

                // Draw initial overlays
                this.drawOverlays();

                // Initialize Three.js renderer with Canvas 2D canvases
                logger.info('ProvinceMap', '🎮 Initializing Three.js v2.0 renderer with Canvas layers...');
                if (this.threeJSRenderer) {
                    this.threeJSRenderer.initMapLayers(
                        this.canvasManager.waterTextureCanvas,
                        this.canvasManager.processedTerrainCanvas,
                        this.canvasManager.politicalCanvas,
                        this.canvasManager.recoloredRiversCanvas,
                        this.canvasManager.borderCanvas,
                        this.canvasManager.overlayCanvas
                    );
                    logger.info('ProvinceMap', '✅ Three.js layers initialized');

                    // Start animation loop for smooth camera movement
                    this.threeJSRenderer.startAnimationLoop(() => this.cameraController.camera);
                }

                // First render
                this.render();

                logger.timeEnd('ProvinceMap', 'Total asset loading');
                logger.info('ProvinceMap', '✅✅✅ Map fully ready with Three.js v2.0 rendering');

                // Notify ready
                if (this.onMapReady) {
                    this.onMapReady();
                }
            }
        };

        // Load terrain (using pre-processed final_map_composite.png)
        logger.info('ProvinceMap', '📥 Loading final_map_composite.png...');
        this.terrainImage.onload = () => {
            logger.info('ProvinceMap', '✓ Terrain loaded');
            onAssetLoad();
        };
        this.terrainImage.onerror = (e) => {
            logger.error('ProvinceMap', '❌ FAILED to load terrain', e);
            logger.showDebugPanel();
        };
        this.terrainImage.src = './final_map_composite.png';

        // Load provinces
        logger.info('ProvinceMap', '📥 Loading provinces.png...');
        this.provinceImage.onload = () => {
            logger.info('ProvinceMap', '✓ Provinces loaded');
            onAssetLoad();
        };
        this.provinceImage.onerror = (e) => {
            logger.error('ProvinceMap', '❌ FAILED to load provinces', e);
            logger.showDebugPanel();
        };
        this.provinceImage.src = './provinces.png';

        // Load and recolor rivers
        logger.info('ProvinceMap', '📥 Loading rivers.png...');
        this.riversImage.onload = () => {
            logger.info('ProvinceMap', '🎨 Recoloring rivers...');
            this.canvasManager.recoloredRiversCtx.drawImage(this.riversImage, 0, 0);
            this.canvasManager.recoloredRiversCtx.globalCompositeOperation = 'source-in';
            this.canvasManager.recoloredRiversCtx.fillStyle = '#283a4a';
            this.canvasManager.recoloredRiversCtx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
            this.canvasManager.recoloredRiversCtx.globalCompositeOperation = 'source-over';
            logger.info('ProvinceMap', '✓ Rivers recolored');
            onAssetLoad();
        };
        this.riversImage.onerror = (e) => {
            logger.error('ProvinceMap', '❌ FAILED to load rivers', e);
            logger.showDebugPanel();
        };
        this.riversImage.src = './rivers.png';
    }

    private loadImage(image: HTMLImageElement, src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = reject;
            image.src = src;
        });
    }

    // Old asset loading callback (kept for reference, but unused with Three.js)
    private loadAssetsOld(): void {
        logger.time('ProvinceMap', 'Total asset loading');
        logger.info('ProvinceMap', '🚀 Starting asset loading...');
        let assetsLoaded = 0;
        const totalAssets = 4; // provinces, rivers, water texture, HOI4 terrain atlas system
        const loadedAssets: string[] = [];

        const onAssetLoad = (assetName: string) => {
            assetsLoaded++;
            loadedAssets.push(assetName);
            logger.info('ProvinceMap', `✓ Asset loaded: ${assetName} (${assetsLoaded}/${totalAssets})`);

            if (assetsLoaded === totalAssets) {
                logger.info('ProvinceMap', '✅ All assets loaded', { loadedAssets });
                logger.info('ProvinceMap', 'Drawing province image to hidden canvas...');

                try {
                    this.canvasManager.hiddenCtx.drawImage(this.provinceImage, 0, 0);
                    logger.info('ProvinceMap', '✓ Province image drawn');
                } catch (error) {
                    logger.error('ProvinceMap', 'ERROR drawing province image', error);
                }

                this.mapReady = true;

                logger.info('ProvinceMap', '⚙️ Processing terrain image...');
                this.processTerrainImage();

                logger.info('ProvinceMap', '🗺️ Building political map...');
                this.buildPoliticalMap();

                logger.info('ProvinceMap', '🔲 Generating country borders...');
                logger.time('ProvinceMap', 'Border generation');
                this.generateCountryBorders();
                logger.timeEnd('ProvinceMap', 'Border generation');

                logger.info('ProvinceMap', '🎨 Drawing overlays...');
                this.drawOverlays();

                logger.info('ProvinceMap', '🖼️ Rendering map for first time...');
                this.render();
                logger.info('ProvinceMap', '✅ Map rendered');

                // Force another overlay redraw to ensure borders are visible
                logger.debug('ProvinceMap', 'Forcing overlay redraw to ensure borders visible');
                this.drawOverlays();
                this.render();

                // Wait for browser to paint the frame before notifying map is ready
                // This ensures smooth loading screen transition and reduces perceived lag
                logger.info('ProvinceMap', '⏳ Waiting for browser repaint...');
                requestAnimationFrame(() => {
                    // Wait one more frame to ensure everything is painted and interactive
                    requestAnimationFrame(() => {
                        logger.timeEnd('ProvinceMap', 'Total asset loading');
                        logger.info('ProvinceMap', '✅✅✅ Browser repainted, map fully ready');
                        logger.info('ProvinceMap', 'Calling onMapReady callback...');
                        if (this.onMapReady) {
                            this.onMapReady();
                        } else {
                            logger.error('ProvinceMap', '⚠️ WARNING: No onMapReady callback provided');
                        }
                    });
                });
            }
        };

        // Load final_map_composite.png - pre-processed with de-dithering and water transparency
        // This is the output from Python script process_map_v2.py
        logger.info('ProvinceMap', '📥 Loading final_map_composite.png (de-dithered)...');
        this.terrainImage.onload = () => {
            logger.info('ProvinceMap', '✓ De-dithered composite loaded');
        };
        this.terrainImage.onerror = (e) => {
            logger.error('ProvinceMap', '❌ FAILED to load final_map_composite.png', { path: './final_map_composite.png', error: e });
            logger.showDebugPanel(); // Auto-show debug panel on error
        };
        this.terrainImage.src = './final_map_composite.png';

        logger.info('ProvinceMap', '📥 Loading provinces.png...');
        this.provinceImage.onload = () => onAssetLoad('provinces.png');
        this.provinceImage.onerror = (e) => {
            logger.error('ProvinceMap', '❌ FAILED to load provinces.png', { path: './provinces.png', error: e });
            logger.showDebugPanel();
        };
        this.provinceImage.src = './provinces.png';

        logger.info('ProvinceMap', '📥 Loading rivers.png...');
        this.riversImage.onload = () => {
            logger.info('ProvinceMap', '🎨 Recoloring rivers...');
            try {
                this.canvasManager.recoloredRiversCtx.drawImage(this.riversImage, 0, 0);
                this.canvasManager.recoloredRiversCtx.globalCompositeOperation = 'source-in';
                this.canvasManager.recoloredRiversCtx.fillStyle = '#283a4a';
                this.canvasManager.recoloredRiversCtx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
                this.canvasManager.recoloredRiversCtx.globalCompositeOperation = 'source-over';
                logger.info('ProvinceMap', '✅ Rivers recolored');
            } catch (error) {
                logger.error('ProvinceMap', 'ERROR recoloring rivers', error);
            }
            onAssetLoad('rivers.png');
        };
        this.riversImage.onerror = (e) => {
            logger.error('ProvinceMap', '❌ FAILED to load rivers.png', { path: './rivers.png', error: e });
            logger.showDebugPanel();
        };
        this.riversImage.src = './rivers.png';

        logger.info('ProvinceMap', '📥 Loading water texture...');
        this.waterTextureImage.onload = () => {
            logger.info('ProvinceMap', '🎨 Drawing water texture to canvas...');
            try {
                // Draw the water colormap
                this.canvasManager.waterTextureCtx.drawImage(this.waterTextureImage, 0, 0, MAP_WIDTH, MAP_HEIGHT);

                // BRIGHTEN the water colormap (original is too dark for game maps)
                // Industry standard: water should be visible but not overwhelming
                const waterData = this.canvasManager.waterTextureCtx.getImageData(0, 0, MAP_WIDTH, MAP_HEIGHT);

                for (let i = 0; i < waterData.data.length; i += 4) {
                    // Brighten by 2.5x and add blue tint for clearer water
                    // This prevents the dark shadow effect
                    waterData.data[i] = Math.min(255, waterData.data[i] * 2.5 + 30);       // R
                    waterData.data[i + 1] = Math.min(255, waterData.data[i + 1] * 2.5 + 40); // G
                    waterData.data[i + 2] = Math.min(255, waterData.data[i + 2] * 2.5 + 60); // B (more blue)
                    // Alpha stays the same
                }

                this.canvasManager.waterTextureCtx.putImageData(waterData, 0, 0);
                logger.info('ProvinceMap', '✅ Water texture drawn and brightened (2.5x + blue tint)');
            } catch (error) {
                logger.error('ProvinceMap', 'ERROR drawing water texture', error);
            }
            onAssetLoad('colormap_water_0.png');
        };
        this.waterTextureImage.onerror = (e) => {
            logger.error('ProvinceMap', '❌ FAILED to load colormap_water.png', { path: './colormap_water.png', error: e });
            logger.showDebugPanel();
        };
        this.waterTextureImage.src = './colormap_water.png';

        // Initialize HOI4 terrain renderer with actual atlas textures
        logger.info('ProvinceMap', '🗻 Initializing HOI4 terrain atlas renderer...');
        this.hoi4TerrainRenderer = new HOI4TerrainRenderer(
            MAP_WIDTH,
            MAP_HEIGHT,
            () => {
                logger.info('ProvinceMap', '✅ HOI4 terrain renderer ready');
                onAssetLoad('HOI4 Terrain Atlas System');

                // If map has already been rendered with fallback terrain, re-process with HOI4 terrain
                if (this.mapReady) {
                    logger.info('ProvinceMap', '🔄 Switching from fallback terrain to HOI4 terrain atlas...');
                    this.processTerrainImage();
                    this.buildPoliticalMap();
                    this.drawOverlays();
                    this.requestRender();
                    logger.info('ProvinceMap', '✅ Map updated with HOI4 terrain atlas');
                }
            }
        );
        this.hoi4TerrainRenderer.load().catch((error) => {
            logger.error('ProvinceMap', '❌ FAILED to load HOI4 terrain renderer', error);
            logger.showDebugPanel();
        });

        // Borders will be generated programmatically after political map is built
        // No need to load border textures - using BorderGenerator instead
        onAssetLoad('Border System');
    }

    private processTerrainImage(): void {
        const ctx = this.canvasManager.processedTerrainCtx;

        // Use HOI4 terrain renderer if available (with actual HOI4 terrain atlas textures)
        if (this.hoi4TerrainRenderer && this.hoi4TerrainRenderer.isReady()) {
            logger.info('ProvinceMap', '🗻 Using HOI4 terrain atlas textures...');

            const terrainCanvas = this.hoi4TerrainRenderer.getTerrainCanvas();
            logger.info('ProvinceMap', `📊 Terrain canvas size: ${terrainCanvas.width}x${terrainCanvas.height}`);

            // Draw the terrain atlas (water is already masked as transparent, colormap tinting applied)
            ctx.drawImage(terrainCanvas, 0, 0);

            // Debug: Check if terrain data was actually drawn
            const checkData = ctx.getImageData(1000, 1000, 1, 1).data;
            logger.info('ProvinceMap', `🔍 Sample terrain pixel at (1000,1000): R=${checkData[0]}, G=${checkData[1]}, B=${checkData[2]}, A=${checkData[3]}`);

            logger.info('ProvinceMap', '✅ HOI4 terrain atlas rendering complete (water masked, colormap tinted)');

        } else {
            logger.warn('ProvinceMap', '⚠️ HOI4 terrain renderer NOT ready, using final_map_composite.png', {
                hasRenderer: !!this.hoi4TerrainRenderer,
                isReady: this.hoi4TerrainRenderer?.isReady()
            });
            // Use final_map_composite.png - pre-processed with Python (de-dithered, water transparency)
            logger.info('ProvinceMap', '🗻 Using final_map_composite.png (pre-processed, no pixel manipulation needed)...');

            // JUST DRAW IT - The Python script already handled:
            // 1. De-dithering (median filter eliminated checkerboard grid)
            // 2. Water layer compositing (water is visible, not opaque)
            // 3. Normal map lighting (shadows applied)
            ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
            ctx.drawImage(this.terrainImage, 0, 0, MAP_WIDTH, MAP_HEIGHT);

            logger.info('ProvinceMap', '✅ Pre-processed composite rendered (no dithering, water visible)');
        }
    }

    // ESC key handler - deselect province
    private handleDeselect(): void {
        if (this.selectedProvinceId) {
            logger.info('ProvinceMap', 'Deselecting province');
            this.selectedProvinceId = null;
            this.stopPulseAnimation();
            this.drawOverlays();
            this.requestRender();
        }
    }

    // Hover shows province borders without selecting
    private handleHover(x: number, y: number): void {
        if (!this.mapReady) return;

        const province = this.getProvinceAt(x, y);

        // Skip if no province or water
        if (!province || province.id === 'OCEAN' || province.id === '0' ||
            province.name === 'sea' || province.name === 'lake') {
            // Clear hover if hovering over water
            if (this.selectedProvinceId && !this.isEditorMode) {
                // Only clear in normal mode, not editor mode
                return;
            }
            return;
        }

        // In editor mode, show borders for hovered province
        if (this.isEditorMode) {
            // Temporarily show border for hovered province (lightweight, no selection)
            this.selectedProvinceId = province.id;
            this.drawOverlays();
            this.requestRender();
        }
    }

    private handleClick(x: number, y: number): void {
        if (!this.mapReady) return;
        const province = this.getProvinceAt(x, y);

        logger.debug('ProvinceMap', 'Clicked province', province);

        // Filter out invalid provinces
        if (!province) {
            logger.debug('ProvinceMap', 'No province found at click location');
            return;
        }

        // Filter out ocean, sea, lakes - only land provinces are clickable
        if (province.id === 'OCEAN' || province.id === '0' ||
            province.name === 'sea' || province.name === 'lake') {
            logger.debug('ProvinceMap', 'Clicked on water province, ignoring');
            return;
        }

        // If in editor mode, handle editor province selection
        if (this.isEditorMode && this.provinceSelector && this.countryEditor) {
            // Select the province
            this.countryEditor.selectProvince(province.id);

            // ALSO select the country that owns this province (for color editing)
            const ownerCountryTag = this.provinceOwnerMap.get(province.id);
            if (ownerCountryTag) {
                this.countryEditor.selectCountry(ownerCountryTag);
                logger.debug('ProvinceMap', `Editor mode: selected province ${province.id} and country ${ownerCountryTag}`);
            } else {
                this.countryEditor.selectCountry(null);
                logger.debug('ProvinceMap', `Editor mode: selected province ${province.id} (no owner)`);
            }
            return;
        }

        // Normal game mode: select country
        // Look up which country owns this province
        const countryId = this.provinceOwnerMap.get(province.id);
        logger.debug('ProvinceMap', 'Province owner', { provinceId: province.id, countryId });

        if (countryId && this.selectedProvinceId !== province.id) {
            logger.info('ProvinceMap', `Selecting country: ${countryId}`);
            // Pass the country ID (not province ID) to the callback
            this.onCountrySelect(countryId);
            this.selectedProvinceId = province.id;
            this.startPulseAnimation();
            this.drawOverlays();
            this.requestRender();
        } else if (!countryId) {
            logger.debug('ProvinceMap', 'Province has no owner assigned');
        }
    }

    // Hover visual feedback removed - only click shows selection now

    private handlePaint(x: number, y: number, isRightClick: boolean): void {
        if (!this.mapReady) return;

        const changed = this.mapEditor.paintProvince(x, y, isRightClick);

        if (changed) {
            this.buildPoliticalMap();
            this.generateCountryBorders();  // Regenerate borders when painting in editor
            this.buildBorderMap();
        }
    }

    private getProvinceAt(x: number, y: number): Province | null {
        if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
            return null;
        }
        const pixelData = this.canvasManager.hiddenCtx.getImageData(x, y, 1, 1).data;
        const colorKey = `${pixelData[0]},${pixelData[1]},${pixelData[2]}`;
        return provinceColorMap.get(colorKey) || null;
    }
    
    private startPulseAnimation(): void {
        if (this.pulseAnimationId) this.stopPulseAnimation();
        this.pulseStartTime = null;

        const pulse = (timestamp: number) => {
            if (!this.pulseStartTime) this.pulseStartTime = timestamp;
            const elapsed = timestamp - this.pulseStartTime;
            const progress = (elapsed % 1500) / 1500;
            const sinValue = Math.sin(progress * Math.PI); 
            this.pulseOpacity = (sinValue * 0.4) + 0.3;
            this.drawOverlays();
            this.render();
            this.pulseAnimationId = requestAnimationFrame(pulse);
        };
        this.pulseAnimationId = requestAnimationFrame(pulse);
    }

    private stopPulseAnimation(): void {
        if (this.pulseAnimationId) {
            cancelAnimationFrame(this.pulseAnimationId);
        }
        this.pulseAnimationId = null;
        this.pulseStartTime = null;
        this.pulseOpacity = 0.7;
    }

    private drawOverlays(): void {
        this.canvasManager.overlayCtx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

        // Draw flickering orange province selection (visible in all modes)
        if (this.selectedProvinceId) {
            // Get or generate border pixels for selected province
            let borders = this.selectedProvinceBorderCache.get(this.selectedProvinceId);

            if (!borders) {
                console.log('[ProvinceMap] Generating borders for province:', this.selectedProvinceId);
                borders = this.generateProvinceBorders(this.selectedProvinceId);
                this.selectedProvinceBorderCache.set(this.selectedProvinceId, borders);
                console.log('[ProvinceMap] Generated', borders.length, 'border pixels');
            }

            // Draw flickering orange border on top of country borders
            if (borders.length > 0) {
                this.canvasManager.overlayCtx.fillStyle = `rgba(255, 140, 0, ${this.pulseOpacity})`;
                for (const [x, y] of borders) {
                    this.canvasManager.overlayCtx.fillRect(x - 1, y - 1, 3, 3);
                }
            }
        }

        this.labelRenderer.drawLabels(
            this.canvasManager.overlayCtx,
            this.countryLabelCache,
            this.provinceOwnerMap,
            this.cameraController.camera.zoom
        );

        // Push overlay canvas to Three.js
        if (this.threeJSRenderer && this.mapReady) {
            this.threeJSRenderer.updateOverlaysTexture(this.canvasManager.overlayCanvas);
        }
    }

    // Generate border pixels for a specific province (on-demand, cached)
    private generateProvinceBorders(provinceId: string): [number, number][] {
        const imageData = this.canvasManager.hiddenCtx.getImageData(0, 0, MAP_WIDTH, MAP_HEIGHT);
        return BorderGenerator.generateProvinceBorders(provinceId, imageData, MAP_WIDTH, MAP_HEIGHT);
    }

    // Generate country borders - detects where different countries meet
    // This is regenerated when territories change (war, peace treaties, etc.)
    // NOTE: Does NOT draw borders between countries and water/ocean
    private generateCountryBorders(): void {
        this.countryBordersReady = false;

        // Get the political map image data (country colors)
        const imageData = this.canvasManager.politicalCtx.getImageData(0, 0, MAP_WIDTH, MAP_HEIGHT);

        // Use BorderGenerator to generate borders
        this.countryBorders = BorderGenerator.generateCountryBorders(imageData, MAP_WIDTH, MAP_HEIGHT);
        this.countryBordersReady = true;

        // Draw borders to border canvas
        this.drawCountryBorders();
    }

    // Draw country borders to border canvas (HOI4 style)
    // Borders are always visible and drawn in black
    private drawCountryBorders(): void {
        if (!this.countryBordersReady || this.countryBorders.length === 0) {
            return;
        }

        // Clear border canvas
        this.canvasManager.borderCtx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

        // Draw static black country borders
        this.canvasManager.borderCtx.fillStyle = '#000000';
        for (const [x, y] of this.countryBorders) {
            this.canvasManager.borderCtx.fillRect(x, y, 1, 1);
        }

        logger.info('ProvinceMap', `✓ Country borders drawn: ${this.countryBorders.length} pixels`);
    }

    // Throttled render using requestAnimationFrame to prevent lag
    private requestRender(): void {
        if (this.renderPending) return;
        this.renderPending = true;

        requestAnimationFrame(() => {
            this.renderPending = false;
            this.render();
        });
    }

    private render(): void {
        if (!this.mapReady) return;
        // OLD 2D RENDERER - DISABLED (now using Three.js WebGL renderer)
        // this.mapRenderer.render();

        // Three.js renders automatically via animation loop
        // No manual render call needed here
    }
    
    private handleResize(): void {
        this.canvasManager.resizeVisibleCanvas();
        this.cameraController.updateViewportSize(
            this.canvasManager.visibleCanvas.width,
            this.canvasManager.visibleCanvas.height
        );
        this.cameraController.constrainCamera();

        // Notify Three.js renderer of resize
        if (this.threeJSRenderer) {
            this.threeJSRenderer.resize(
                this.container.clientWidth,
                this.container.clientHeight
            );
        }

        this.requestRender();
    }

    private buildPoliticalMap(): void {
        if (!this.mapReady || !this.allCountryData) return;
        this.politicalMapBuilder.buildPoliticalMap(
            this.canvasManager.politicalCtx,
            this.provinceOwnerMap,
            this.allCountryData,
            this.canvasManager.waterTextureCtx
        );
        this.politicalMapReady = true;

        // Update Three.js political texture
        if (this.threeJSRenderer) {
            this.threeJSRenderer.updatePoliticalTexture(this.canvasManager.politicalCanvas);
        }
    }

    private buildBorderMap(): void {
        if (!this.mapReady || !this.politicalMapReady) return;
        this.borderMapBuilder.buildBorderMap(
            this.canvasManager.borderCtx,
            this.provinceOwnerMap,
            (x, y) => this.getProvinceAt(x, y)
        );
        this.bordersReady = true;

        // Push borders canvas to Three.js
        if (this.threeJSRenderer) {
            this.threeJSRenderer.updateBordersTexture(this.canvasManager.borderCanvas);
        }

        this.render();
    }

    public async importAndAutoAssignCSV(csvPath: string = './map-data/definition.csv'): Promise<void> {
        try {
            const result = await this.mapEditor.importAndAutoAssignCSV(csvPath);
            this.buildPoliticalMap();
            this.buildBorderMap();
            this.showNotification(`Auto-assigned ${result.assigned} provinces, ${result.unassigned} need manual assignment`, 'success');
        } catch (error) {
            logger.error('ProvinceMap', 'CSV Import failed', error);
            this.showNotification('Failed to import CSV', 'error');
        }
    }

    private showNotification(message: string, type: 'success' | 'error' | 'info'): void {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '80px';
        notification.style.right = '20px';
        notification.style.padding = '12px 20px';
        notification.style.borderRadius = '6px';
        notification.style.color = 'white';
        notification.style.fontWeight = 'bold';
        notification.style.zIndex = '10000';
        notification.style.backgroundColor = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    public updateCountries(countries: Map<string, Country>, allCountries: Map<string, CountryData>): void {
        this.countries = countries;
        this.allCountryData = allCountries;
    }
    
    public setProvinceOwnerMap(ownerMap: Map<string, string>): void {
        logger.info('ProvinceMap', 'Loading province owner map...');

        // Try to load saved editor state from localStorage
        let loadedFromStorage = false;
        try {
            const saved = localStorage.getItem('worldpolitik_editor_state');
            if (saved) {
                logger.info('ProvinceMap', 'Found saved editor state in localStorage, loading...');
                const { EditorDataExporter } = require('./editor/EditorDataExporter');
                const imported = EditorDataExporter.importEditorStateJSON(saved);
                if (imported) {
                    // Use saved data instead of default
                    this.allCountryData = imported.countries;
                    this.provinceOwnerMap = imported.provinceOwners;
                    loadedFromStorage = true;
                    logger.info('ProvinceMap', `Loaded saved state: ${imported.countries.size} countries, ${imported.provinceOwners.size} provinces`);
                }
            }
        } catch (error) {
            logger.error('ProvinceMap', 'Failed to load saved state', error);
        }

        // If no saved state, use default
        if (!loadedFromStorage) {
            this.provinceOwnerMap = new Map(ownerMap);
        }

        // Initialize CountryEditor with current map data
        if (this.allCountryData.size > 0) {
            logger.info('ProvinceMap', 'Initializing CountryEditor...');
            this.countryEditor = new CountryEditor(this.allCountryData, this.provinceOwnerMap);
            this.provinceSelector = new ProvinceSelector(MAP_WIDTH, MAP_HEIGHT);
            logger.info('ProvinceMap', 'CountryEditor initialized');
        }

        if (this.mapReady) {
            this.buildPoliticalMap();
            this.generateCountryBorders();  // Regenerate borders when territories change
            this.buildBorderMap();
        }
    }

    public setSelectedCountry(provinceId: string | null): void {
        this.selectedProvinceId = provinceId;
        if (provinceId === null) {
            this.stopPulseAnimation();
        }
        this.drawOverlays();
        this.requestRender();
    }
    
    public setEditorMode(enabled: boolean): void {
        this.isEditorMode = enabled;
        this.setSelectedCountry(null);
        this.drawOverlays();
        this.requestRender();
    }

    public setPaintCountry(countryId: string | null): void {
        this.mapEditor.setPaintCountry(countryId);
    }

    public exportMapData(): string {
        return this.mapEditor.exportMapData();
    }
    
    public destroy(): void {
        // Clean up Three.js renderer
        if (this.threeJSRenderer) {
            this.threeJSRenderer.dispose();
        }

        // Remove Three.js canvas from DOM
        const threeCanvas = this.container.querySelector('#three-canvas');
        if (threeCanvas && threeCanvas.parentElement) {
            threeCanvas.parentElement.removeChild(threeCanvas);
        }

        this.canvasManager.destroy();
        this.interactionHandler.destroy();
        window.removeEventListener('resize', () => this.handleResize());
    }

    public isMapReady(): boolean {
        return this.mapReady && this.politicalMapReady;
    }

    public forceRender(): void {
        this.render();
    }

    /**
     * Toggle political colors overlay (0 = terrain only, 1 = full political colors)
     */
    public togglePoliticalColors(): void {
        if (!this.threeJSRenderer) return;
        const currentOpacity = this.threeJSRenderer.getPoliticalOpacity();
        // Toggle between 0 (terrain only) and 0.65 (political overlay)
        this.threeJSRenderer.setPoliticalOpacity(currentOpacity > 0 ? 0.0 : 0.65);
    }

    /**
     * Set political colors opacity (0 = terrain only, 1 = full political colors)
     */
    public setPoliticalOpacity(opacity: number): void {
        if (this.threeJSRenderer) {
            this.threeJSRenderer.setPoliticalOpacity(opacity);
        }
    }

    /**
     * Get current political colors opacity
     */
    public getPoliticalOpacity(): number {
        if (this.threeJSRenderer) {
            return this.threeJSRenderer.getPoliticalOpacity();
        }
        return 0.65;
    }

    /**
     * Set whether country borders should be visible
     */
    public setBordersVisible(visible: boolean): void {
        if (this.threeJSRenderer) {
            this.threeJSRenderer.setBordersVisible(visible);
        }
    }

    /**
     * Get whether country borders are currently visible
     */
    public getBordersVisible(): boolean {
        // For now, borders are always visible in v2.0
        // Can be enhanced later if needed
        return true;
    }

    public async calculateLabels(): Promise<void> {
        this.countryLabelCache = await this.labelCalculator.calculateLabelsAsync(this.provinceOwnerMap);
        this.drawOverlays();
        this.requestRender();
    }

    // Country Editor integration
    public getCountryEditor(): CountryEditor | null {
        return this.countryEditor;
    }

    public getProvinceSelector(): ProvinceSelector | null {
        return this.provinceSelector;
    }

    /**
     * Rebuild the political map from the editor state
     * Call this when editor makes changes to countries or provinces
     */
    public rebuildFromEditor(): void {
        if (!this.countryEditor) {
            logger.error('ProvinceMap', 'No CountryEditor initialized');
            return;
        }

        const editorState = this.countryEditor.getState();

        // Update province owner map from editor
        this.provinceOwnerMap = new Map(editorState.provinceOwners);

        // Update country data from editor
        const updatedCountryData = new Map<string, CountryData>();
        for (const country of this.countryEditor.getAllCountries()) {
            updatedCountryData.set(country.tag, {
                name: country.name,
                color: country.color
            });
        }
        this.allCountryData = updatedCountryData;

        // Rebuild the map
        logger.info('ProvinceMap', 'Rebuilding political map from editor changes...');
        this.buildPoliticalMap();
        this.generateCountryBorders();
        this.buildBorderMap();
        this.drawOverlays();
        this.requestRender();
        logger.info('ProvinceMap', 'Map rebuilt successfully');
    }
}