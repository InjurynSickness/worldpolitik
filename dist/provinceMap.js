// /src/provinceMap.ts - REFACTORED MAIN COORDINATOR
import { provinceColorMap } from './provinceData.js';
import { provinceBorders } from './provinceBorders.js';
import { CanvasManager } from './rendering/CanvasManager.js';
import { CameraController } from './camera/CameraController.js';
import { MapInteractionHandler } from './interaction/MapInteractionHandler.js';
import { MapRenderer } from './rendering/MapRenderer.js';
import { CountryLabelCalculator } from './labels/CountryLabelCalculator.js';
import { LabelRenderer } from './labels/LabelRenderer.js';
import { MapEditor } from './editor/MapEditor.js';
import { PoliticalMapBuilder } from './political/PoliticalMapBuilder.js';
import { BorderMapBuilder } from './borders/BorderMapBuilder.js';
const MAP_WIDTH = 5616;
const MAP_HEIGHT = 2160;
export class ProvinceMap {
    container;
    onCountrySelect;
    canvasManager;
    cameraController;
    interactionHandler;
    mapRenderer;
    labelCalculator;
    labelRenderer;
    mapEditor;
    politicalMapBuilder;
    borderMapBuilder;
    terrainImage = new Image();
    provinceImage = new Image();
    riversImage = new Image();
    lastHoveredProvince = null;
    selectedProvinceId = null;
    mapReady = false;
    politicalMapReady = false;
    bordersReady = false;
    isEditorMode = false;
    provinceOwnerMap = new Map();
    countries = new Map();
    allCountryData = new Map();
    countryLabelCache = new Map();
    pulseAnimationId = null;
    pulseStartTime = null;
    pulseOpacity = 0.7;
    pulseColor = "255, 255, 240";
    constructor(container, onCountrySelect) {
        this.container = container;
        this.onCountrySelect = onCountrySelect;
        this.canvasManager = new CanvasManager(container, MAP_WIDTH, MAP_HEIGHT);
        this.cameraController = new CameraController(this.canvasManager.visibleCanvas.width, this.canvasManager.visibleCanvas.height, MAP_WIDTH, MAP_HEIGHT);
        this.mapRenderer = new MapRenderer(this.canvasManager, this.cameraController);
        this.labelCalculator = new CountryLabelCalculator(MAP_WIDTH, MAP_HEIGHT, this.canvasManager.hiddenCtx, this.allCountryData);
        this.labelRenderer = new LabelRenderer(this.allCountryData);
        this.mapEditor = new MapEditor(this.provinceOwnerMap, (x, y) => this.getProvinceAt(x, y));
        this.politicalMapBuilder = new PoliticalMapBuilder(MAP_WIDTH, MAP_HEIGHT, this.canvasManager.hiddenCtx, this.allCountryData);
        this.borderMapBuilder = new BorderMapBuilder(MAP_WIDTH, MAP_HEIGHT);
        this.interactionHandler = new MapInteractionHandler(this.canvasManager.visibleCanvas, this.cameraController, (x, y) => this.handleHover(x, y), (x, y) => this.handleClick(x, y), (x, y, isRightClick) => this.handlePaint(x, y, isRightClick), () => this.render(), () => this.isEditorMode);
        this.loadAssets();
        window.addEventListener('resize', () => this.handleResize());
    }
    loadAssets() {
        let assetsLoaded = 0;
        const totalAssets = 3;
        const onAssetLoad = () => {
            assetsLoaded++;
            if (assetsLoaded === totalAssets) {
                console.log("All map assets loaded.");
                this.canvasManager.hiddenCtx.drawImage(this.provinceImage, 0, 0);
                this.mapReady = true;
                this.processTerrainImage();
                this.buildPoliticalMap();
                this.buildBorderMap();
            }
        };
        this.terrainImage.onload = onAssetLoad;
        this.terrainImage.src = './terrain.png';
        this.provinceImage.onload = onAssetLoad;
        this.provinceImage.src = './provinces.png';
        this.riversImage.onload = () => {
            console.log("Recoloring rivers...");
            this.canvasManager.recoloredRiversCtx.drawImage(this.riversImage, 0, 0);
            this.canvasManager.recoloredRiversCtx.globalCompositeOperation = 'source-in';
            this.canvasManager.recoloredRiversCtx.fillStyle = '#283a4a';
            this.canvasManager.recoloredRiversCtx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
            this.canvasManager.recoloredRiversCtx.globalCompositeOperation = 'source-over';
            console.log("Rivers recolored.");
            onAssetLoad();
        };
        this.riversImage.src = './rivers.png';
    }
    processTerrainImage() {
        console.log("DEBUG: Processing terrain.png using provinces.png as a mask...");
        const ctx = this.canvasManager.processedTerrainCtx;
        ctx.drawImage(this.terrainImage, 0, 0);
        const terrainImageData = ctx.getImageData(0, 0, MAP_WIDTH, MAP_HEIGHT);
        const terrainData = terrainImageData.data;
        const maskImageData = this.canvasManager.hiddenCtx.getImageData(0, 0, MAP_WIDTH, MAP_HEIGHT);
        const maskData = maskImageData.data;
        for (let i = 0; i < terrainData.length; i += 4) {
            const r = maskData[i];
            const g = maskData[i + 1];
            const b = maskData[i + 2];
            const colorKey = `${r},${g},${b}`;
            if (!provinceColorMap.has(colorKey) || (r < 10 && g < 10 && b < 10)) {
                terrainData[i + 3] = 0;
            }
        }
        ctx.putImageData(terrainImageData, 0, 0);
        console.log("DEBUG: terrain.png processing complete. Ocean is now transparent.");
    }
    handleClick(x, y) {
        if (!this.mapReady)
            return;
        const province = this.getProvinceAt(x, y);
        if (province && province.id !== 'OCEAN') {
            if (this.selectedProvinceId !== province.id) {
                this.onCountrySelect(province.id);
                this.selectedProvinceId = province.id;
                this.startPulseAnimation();
                this.drawOverlays();
                this.render();
            }
        }
    }
    handleHover(x, y) {
        if (!this.mapReady)
            return;
        const province = this.getProvinceAt(x, y);
        if (province?.id !== this.lastHoveredProvince?.id) {
            this.lastHoveredProvince = province;
            this.drawOverlays();
            this.render();
        }
        this.interactionHandler.updateCursor(province !== null && province.id !== 'OCEAN');
    }
    handlePaint(x, y, isRightClick) {
        if (!this.mapReady)
            return;
        const changed = this.mapEditor.paintProvince(x, y, isRightClick);
        if (changed) {
            this.buildPoliticalMap();
            this.buildBorderMap();
        }
    }
    getProvinceAt(x, y) {
        if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
            return null;
        }
        const pixelData = this.canvasManager.hiddenCtx.getImageData(x, y, 1, 1).data;
        const colorKey = `${pixelData[0]},${pixelData[1]},${pixelData[2]}`;
        return provinceColorMap.get(colorKey) || null;
    }
    startPulseAnimation() {
        if (this.pulseAnimationId)
            this.stopPulseAnimation();
        this.pulseStartTime = null;
        const pulse = (timestamp) => {
            if (!this.pulseStartTime)
                this.pulseStartTime = timestamp;
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
    stopPulseAnimation() {
        if (this.pulseAnimationId) {
            cancelAnimationFrame(this.pulseAnimationId);
        }
        this.pulseAnimationId = null;
        this.pulseStartTime = null;
        this.pulseOpacity = 0.7;
    }
    drawOverlays() {
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
        this.labelRenderer.drawLabels(this.canvasManager.overlayCtx, this.countryLabelCache, this.provinceOwnerMap, this.cameraController.camera.zoom);
    }
    render() {
        if (!this.mapReady)
            return;
        this.mapRenderer.render();
    }
    handleResize() {
        this.canvasManager.resizeVisibleCanvas();
        this.cameraController.updateViewportSize(this.canvasManager.visibleCanvas.width, this.canvasManager.visibleCanvas.height);
        this.cameraController.constrainCamera();
        this.render();
    }
    buildPoliticalMap() {
        if (!this.mapReady || !this.allCountryData)
            return;
        this.politicalMapBuilder.buildPoliticalMap(this.canvasManager.politicalCtx, this.provinceOwnerMap);
        this.politicalMapReady = true;
    }
    buildBorderMap() {
        if (!this.mapReady || !this.politicalMapReady)
            return;
        this.borderMapBuilder.buildBorderMap(this.canvasManager.borderCtx, this.provinceOwnerMap, (x, y) => this.getProvinceAt(x, y));
        this.bordersReady = true;
        this.render();
    }
    async importAndAutoAssignCSV(csvPath = './definition.csv') {
        try {
            const result = await this.mapEditor.importAndAutoAssignCSV(csvPath);
            this.buildPoliticalMap();
            this.buildBorderMap();
            this.showNotification(`Auto-assigned ${result.assigned} provinces, ${result.unassigned} need manual assignment`, 'success');
        }
        catch (error) {
            console.error('CSV Import failed:', error);
            this.showNotification('Failed to import CSV', 'error');
        }
    }
    showNotification(message, type) {
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
    updateCountries(countries, allCountries) {
        this.countries = countries;
        this.allCountryData = allCountries;
    }
    setProvinceOwnerMap(ownerMap) {
        console.log("Loading province owner map...");
        this.provinceOwnerMap = new Map(ownerMap);
        if (this.mapReady) {
            this.buildPoliticalMap();
            this.buildBorderMap();
        }
    }
    setSelectedCountry(provinceId) {
        this.selectedProvinceId = provinceId;
        if (provinceId === null) {
            this.stopPulseAnimation();
        }
        this.drawOverlays();
        this.render();
    }
    setEditorMode(enabled) {
        this.isEditorMode = enabled;
        this.setSelectedCountry(null);
        this.lastHoveredProvince = null;
        this.drawOverlays();
        this.render();
    }
    setPaintCountry(countryId) {
        this.mapEditor.setPaintCountry(countryId);
    }
    exportMapData() {
        return this.mapEditor.exportMapData();
    }
    destroy() {
        this.canvasManager.destroy();
        this.interactionHandler.destroy();
        window.removeEventListener('resize', () => this.handleResize());
    }
    isMapReady() {
        return this.mapReady && this.politicalMapReady;
    }
    forceRender() {
        this.render();
    }
    async calculateLabels() {
        this.countryLabelCache = await this.labelCalculator.calculateLabelsAsync(this.provinceOwnerMap);
        this.drawOverlays();
        this.render();
    }
}
//# sourceMappingURL=provinceMap.js.map