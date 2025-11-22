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
    private labelCalculator: CountryLabelCalculator;
    private labelRenderer: LabelRenderer;
    private mapEditor: MapEditor;
    private politicalMapBuilder: PoliticalMapBuilder;
    private borderMapBuilder: BorderMapBuilder;

    // New comprehensive country editor
    private countryEditor: CountryEditor | null = null;
    private provinceSelector: ProvinceSelector | null = null;

    private terrainImage = new Image();
    private provinceImage = new Image();
    private riversImage = new Image();
    private waterTextureImage = new Image();

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
        
        this.canvasManager = new CanvasManager(container, MAP_WIDTH, MAP_HEIGHT);
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
            () => this.isEditorMode
        );
        
        this.loadAssets();
        window.addEventListener('resize', () => this.handleResize());
    }

    private loadAssets(): void {
        logger.time('ProvinceMap', 'Total asset loading');
        logger.info('ProvinceMap', '🚀 Starting asset loading...');
        let assetsLoaded = 0;
        const totalAssets = 4; // terrain, provinces, rivers, water texture
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

                logger.info('ProvinceMap', '🎨 Drawing borders and overlays...');
                this.drawOverlays();

                logger.info('ProvinceMap', '🖼️ Rendering map for first time...');
                this.render();
                logger.info('ProvinceMap', '✅ Map rendered');

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

        logger.info('ProvinceMap', '📥 Loading terrain.png...');
        this.terrainImage.onload = () => onAssetLoad('terrain.png');
        this.terrainImage.onerror = (e) => {
            logger.error('ProvinceMap', '❌ FAILED to load terrain.png', { path: './terrain.png', error: e });
            logger.showDebugPanel(); // Auto-show debug panel on error
        };
        this.terrainImage.src = './terrain.png';

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
                this.canvasManager.waterTextureCtx.drawImage(this.waterTextureImage, 0, 0, MAP_WIDTH, MAP_HEIGHT);
                logger.info('ProvinceMap', '✅ Water texture drawn');
            } catch (error) {
                logger.error('ProvinceMap', 'ERROR drawing water texture', error);
            }
            onAssetLoad('colormap_water_0.png');
        };
        this.waterTextureImage.onerror = (e) => {
            logger.error('ProvinceMap', '❌ FAILED to load colormap_water_0.png', { path: './colormap_water_0.png', error: e });
            logger.showDebugPanel();
        };
        this.waterTextureImage.src = './colormap_water_0.png';
    }

    private processTerrainImage(): void {
        logger.debug('ProvinceMap', 'Processing terrain.png using provinces.png as a mask...');
        const ctx = this.canvasManager.processedTerrainCtx;

        ctx.drawImage(this.terrainImage, 0, 0);

        const terrainImageData = ctx.getImageData(0, 0, MAP_WIDTH, MAP_HEIGHT);
        const terrainData = terrainImageData.data;

        const maskImageData = this.canvasManager.hiddenCtx.getImageData(0, 0, MAP_WIDTH, MAP_HEIGHT);
        const maskData = maskImageData.data;

        // Optimized: Process all pixels at once but with simpler check
        // This is faster than chunking for this use case
        for (let i = 0; i < terrainData.length; i += 4) {
            const r = maskData[i];
            const g = maskData[i + 1];
            const b = maskData[i + 2];

            // Simple black check is faster than Map lookup
            // Ocean/water in provinces.png is mostly black (0,0,0) or very dark
            if (r < 10 && g < 10 && b < 10) {
                terrainData[i + 3] = 0;
            }
        }

        ctx.putImageData(terrainImageData, 0, 0);
        logger.debug('ProvinceMap', 'Terrain.png processing complete. Ocean is now transparent.');
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

        // Draw static black country borders (always visible)
        if (this.countryBordersReady && this.countryBorders.length > 0) {
            this.canvasManager.overlayCtx.fillStyle = '#000000';  // Static black
            for (const [x, y] of this.countryBorders) {
                this.canvasManager.overlayCtx.fillRect(x, y, 1, 1);
            }
        }

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
    }

    // Generate border pixels for a specific province (on-demand, cached)
    private generateProvinceBorders(provinceId: string): [number, number][] {
        logger.debug('ProvinceMap', `Generating borders for province: ${provinceId}`);
        const borders: [number, number][] = [];
        const imageData = this.canvasManager.hiddenCtx.getImageData(0, 0, MAP_WIDTH, MAP_HEIGHT);
        const data = imageData.data;

        // Find target province color
        let targetColor: string | null = null;
        for (const [colorKey, province] of provinceColorMap.entries()) {
            if (province.id === provinceId) {
                targetColor = colorKey;
                break;
            }
        }

        if (!targetColor) return borders;

        const [targetR, targetG, targetB] = targetColor.split(',').map(Number);

        // Scan pixels and find edges
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const idx = (y * MAP_WIDTH + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                // Check if this pixel is part of our province
                if (r === targetR && g === targetG && b === targetB) {
                    // Check if any neighbor is a different province (edge detection)
                    let isEdge = false;
                    for (let dy = -1; dy <= 1 && !isEdge; dy++) {
                        for (let dx = -1; dx <= 1 && !isEdge; dx++) {
                            if (dx === 0 && dy === 0) continue;

                            const nx = x + dx;
                            const ny = y + dy;

                            if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
                                const nidx = (ny * MAP_WIDTH + nx) * 4;
                                const nr = data[nidx];
                                const ng = data[nidx + 1];
                                const nb = data[nidx + 2];

                                if (nr !== targetR || ng !== targetG || nb !== targetB) {
                                    isEdge = true;
                                }
                            }
                        }
                    }

                    if (isEdge) {
                        borders.push([x, y]);
                    }
                }
            }
        }

        logger.debug('ProvinceMap', `Generated ${borders.length} border pixels for province ${provinceId}`);
        return borders;
    }

    // Generate country borders - detects where different countries meet
    // This is regenerated when territories change (war, peace treaties, etc.)
    // NOTE: Does NOT draw borders between countries and water/ocean
    private generateCountryBorders(): void {
        const startTime = performance.now();
        logger.debug('ProvinceMap', 'Generating country borders...');

        this.countryBorders = [];
        this.countryBordersReady = false;

        // Get the political map image data (country colors)
        const imageData = this.canvasManager.politicalCtx.getImageData(0, 0, MAP_WIDTH, MAP_HEIGHT);
        const data = imageData.data;

        let borderPixels = 0;

        // Scan pixels and find where different countries meet
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const idx = (y * MAP_WIDTH + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const a = data[idx + 3];

                // Skip transparent pixels (water/ocean - no country)
                if (a === 0) continue;

                const currentColor = `${r},${g},${b}`;

                // Check 4-directional neighbors (faster than 8-directional)
                const neighbors = [
                    [x + 1, y],  // Right
                    [x, y + 1],  // Down
                ];

                let isDifferentCountry = false;

                for (const [nx, ny] of neighbors) {
                    if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
                        const nidx = (ny * MAP_WIDTH + nx) * 4;
                        const nr = data[nidx];
                        const ng = data[nidx + 1];
                        const nb = data[nidx + 2];
                        const na = data[nidx + 3];

                        // ONLY draw borders between actual countries (both have alpha > 0)
                        // Skip borders between countries and water (na === 0)
                        if (na > 0) {
                            const neighborColor = `${nr},${ng},${nb}`;
                            if (currentColor !== neighborColor) {
                                isDifferentCountry = true;
                                break;
                            }
                        }
                    }
                }

                if (isDifferentCountry) {
                    this.countryBorders.push([x, y]);
                    borderPixels++;
                }
            }
        }

        this.countryBordersReady = true;

        const elapsed = performance.now() - startTime;
        logger.info('ProvinceMap', `✓ Country borders generated: ${borderPixels} border pixels (land-only) in ${elapsed.toFixed(0)}ms`);
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
        this.mapRenderer.render();
    }
    
    private handleResize(): void {
        this.canvasManager.resizeVisibleCanvas();
        this.cameraController.updateViewportSize(
            this.canvasManager.visibleCanvas.width,
            this.canvasManager.visibleCanvas.height
        );
        this.cameraController.constrainCamera();
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
    }

    private buildBorderMap(): void {
        if (!this.mapReady || !this.politicalMapReady) return;
        this.borderMapBuilder.buildBorderMap(
            this.canvasManager.borderCtx,
            this.provinceOwnerMap,
            (x, y) => this.getProvinceAt(x, y)
        );
        this.bordersReady = true;
        this.render();
    }

    public async importAndAutoAssignCSV(csvPath: string = './definition.csv'): Promise<void> {
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