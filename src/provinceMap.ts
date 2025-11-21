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

    private terrainImage = new Image();
    private provinceImage = new Image();
    private riversImage = new Image();

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
            null,  // No hover callback - removed hover visual feedback
            (x, y) => this.handleClick(x, y),
            (x, y, isRightClick) => this.handlePaint(x, y, isRightClick),
            () => this.requestRender(),
            () => this.isEditorMode
        );
        
        this.loadAssets();
        window.addEventListener('resize', () => this.handleResize());
    }

    private loadAssets(): void {
        console.log('[ProvinceMap] Starting asset loading...');
        let assetsLoaded = 0;
        const totalAssets = 3;
        const loadedAssets: string[] = [];

        const onAssetLoad = (assetName: string) => {
            assetsLoaded++;
            loadedAssets.push(assetName);
            console.log(`[ProvinceMap] ✓ Asset loaded: ${assetName} (${assetsLoaded}/${totalAssets})`);

            if (assetsLoaded === totalAssets) {
                console.log('[ProvinceMap] ✓ All assets loaded:', loadedAssets);
                console.log('[ProvinceMap] Drawing province image to hidden canvas...');

                try {
                    this.canvasManager.hiddenCtx.drawImage(this.provinceImage, 0, 0);
                    console.log('[ProvinceMap] ✓ Province image drawn');
                } catch (error) {
                    console.error('[ProvinceMap] ERROR drawing province image:', error);
                }

                this.mapReady = true;

                console.log('[ProvinceMap] Processing terrain image...');
                this.processTerrainImage();

                console.log('[ProvinceMap] Building political map...');
                this.buildPoliticalMap();

                console.log('[ProvinceMap] Rendering map for first time...');
                this.render();
                console.log('[ProvinceMap] ✓ Map rendered');

                // Skip border building - old border data doesn't match new HOI4 provinces
                // TODO: Generate new border data or use a different border rendering approach
                console.log('[ProvinceMap] Skipping border generation (incompatible with HOI4 province data)');

                // Wait for browser to paint the frame before notifying map is ready
                // This ensures smooth loading screen transition and reduces perceived lag
                console.log('[ProvinceMap] Waiting for browser repaint...');
                requestAnimationFrame(() => {
                    // Wait one more frame to ensure everything is painted and interactive
                    requestAnimationFrame(() => {
                        console.log('[ProvinceMap] ✓✓✓ Browser repainted, map fully ready');
                        console.log('[ProvinceMap] Calling onMapReady callback...');
                        if (this.onMapReady) {
                            this.onMapReady();
                        } else {
                            console.warn('[ProvinceMap] WARNING: No onMapReady callback provided');
                        }
                    });
                });
            }
        };

        console.log('[ProvinceMap] Loading terrain.png...');
        this.terrainImage.onload = () => onAssetLoad('terrain.png');
        this.terrainImage.onerror = (e) => {
            console.error('[ProvinceMap] ✗ FAILED to load terrain.png:', e);
            console.error('[ProvinceMap] Attempted path: ./terrain.png');
        };
        this.terrainImage.src = './terrain.png';

        console.log('[ProvinceMap] Loading provinces.png...');
        this.provinceImage.onload = () => onAssetLoad('provinces.png');
        this.provinceImage.onerror = (e) => {
            console.error('[ProvinceMap] ✗ FAILED to load provinces.png:', e);
            console.error('[ProvinceMap] Attempted path: ./provinces.png');
        };
        this.provinceImage.src = './provinces.png';

        console.log('[ProvinceMap] Loading rivers.png...');
        this.riversImage.onload = () => {
            console.log('[ProvinceMap] Recoloring rivers...');
            try {
                this.canvasManager.recoloredRiversCtx.drawImage(this.riversImage, 0, 0);
                this.canvasManager.recoloredRiversCtx.globalCompositeOperation = 'source-in';
                this.canvasManager.recoloredRiversCtx.fillStyle = '#283a4a';
                this.canvasManager.recoloredRiversCtx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
                this.canvasManager.recoloredRiversCtx.globalCompositeOperation = 'source-over';
                console.log('[ProvinceMap] ✓ Rivers recolored');
            } catch (error) {
                console.error('[ProvinceMap] ERROR recoloring rivers:', error);
            }
            onAssetLoad('rivers.png');
        };
        this.riversImage.onerror = (e) => {
            console.error('[ProvinceMap] ✗ FAILED to load rivers.png:', e);
            console.error('[ProvinceMap] Attempted path: ./rivers.png');
        };
        this.riversImage.src = './rivers.png';
    }

    private processTerrainImage(): void {
        console.log("DEBUG: Processing terrain.png using provinces.png as a mask...");
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
        console.log("DEBUG: terrain.png processing complete. Ocean is now transparent.");
    }

    private handleClick(x: number, y: number): void {
        if (!this.mapReady) return;
        const province = this.getProvinceAt(x, y);

        console.log('[ProvinceMap] Clicked province:', province);

        // Filter out invalid provinces
        if (!province) {
            console.log('[ProvinceMap] No province found at click location');
            return;
        }

        // Filter out ocean, sea, lakes - only land provinces are clickable
        if (province.id === 'OCEAN' || province.id === '0' ||
            province.name === 'sea' || province.name === 'lake') {
            console.log('[ProvinceMap] Clicked on water province, ignoring');
            return;
        }

        // Look up which country owns this province
        const countryId = this.provinceOwnerMap.get(province.id);
        console.log('[ProvinceMap] Province owner:', countryId);

        if (countryId && this.selectedProvinceId !== province.id) {
            console.log('[ProvinceMap] Selecting country:', countryId);
            // Pass the country ID (not province ID) to the callback
            this.onCountrySelect(countryId);
            this.selectedProvinceId = province.id;
            this.startPulseAnimation();
            this.drawOverlays();
            this.requestRender();
        } else if (!countryId) {
            console.log('[ProvinceMap] Province has no owner assigned');
        }
    }

    // Hover visual feedback removed - only click shows selection now

    private handlePaint(x: number, y: number, isRightClick: boolean): void {
        if (!this.mapReady) return;
        
        const changed = this.mapEditor.paintProvince(x, y, isRightClick);
        
        if (changed) {
            this.buildPoliticalMap();
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

        if (this.selectedProvinceId && !this.isEditorMode) {
            const borders = provinceBorders.get(this.selectedProvinceId);
            if (borders) {
                this.canvasManager.overlayCtx.fillStyle = `rgba(${this.pulseColor}, ${this.pulseOpacity})`; 
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
        this.politicalMapBuilder.buildPoliticalMap(this.canvasManager.politicalCtx, this.provinceOwnerMap, this.allCountryData);
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
            console.error('CSV Import failed:', error);
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
        console.log("Loading province owner map...");
        this.provinceOwnerMap = new Map(ownerMap); 
        
        if (this.mapReady) {
            this.buildPoliticalMap();
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
}