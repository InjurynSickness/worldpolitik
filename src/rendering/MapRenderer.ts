// /src/rendering/MapRenderer.ts

import { CanvasManager } from './CanvasManager.js';
import { CameraController } from '../camera/CameraController.js';
import { logger } from '../utils/Logger.js';

export class MapRenderer {
    private terrainDebugLogged = false;
    private politicalOpacity: number = 0.65; // Default: 65% political colors, 35% terrain (optimal visibility)
    private showBorders: boolean = true; // Default: borders visible

    constructor(
        private canvasManager: CanvasManager,
        private cameraController: CameraController
    ) {}

    /**
     * Set the political colors opacity (0 = hidden/terrain only, 1 = full political colors)
     */
    public setPoliticalOpacity(opacity: number): void {
        this.politicalOpacity = Math.max(0, Math.min(1, opacity));
    }

    /**
     * Get the current political colors opacity
     */
    public getPoliticalOpacity(): number {
        return this.politicalOpacity;
    }

    /**
     * Set whether borders should be visible
     */
    public setBordersVisible(visible: boolean): void {
        this.showBorders = visible;
    }

    /**
     * Get whether borders are currently visible
     */
    public getBordersVisible(): boolean {
        return this.showBorders;
    }

    public render(): void {
        const ctx = this.canvasManager.visibleCtx;
        const camera = this.cameraController.camera;

        ctx.save();

        // Clear to black
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.canvasManager.visibleCanvas.width, this.canvasManager.visibleCanvas.height);

        // Apply camera transform
        ctx.translate(camera.x, camera.y);
        ctx.scale(camera.zoom, camera.zoom);

        // Enable high-quality image smoothing for better anti-aliasing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // LAYER 1: Draw water texture (realistic ocean depth from HOI4 colormap_water)
        // This provides realistic depth variation for oceans/seas
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
        ctx.drawImage(this.canvasManager.waterTextureCanvas, 0, 0);

        // LAYER 2: Draw terrain texture (SUBTLE BACKGROUND - reduced opacity to prevent visual noise)
        // Water areas are transparent on this layer, so water texture shows through
        // Shows geographical features like mountains, forests, plains
        if (!this.terrainDebugLogged) {
            const terrainData = this.canvasManager.processedTerrainCtx.getImageData(0, 0, 100, 100);
            let hasNonZero = false;
            for (let i = 0; i < terrainData.data.length; i++) {
                if (terrainData.data[i] !== 0) {
                    hasNonZero = true;
                    break;
                }
            }
            logger.info('MapRenderer', `🗻 Terrain canvas check: ${hasNonZero ? 'HAS DATA' : 'EMPTY'}`, {
                width: this.canvasManager.processedTerrainCanvas.width,
                height: this.canvasManager.processedTerrainCanvas.height
            });
            this.terrainDebugLogged = true;
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.35; // Reduced to 35% to prevent overwhelming tiling patterns
        ctx.drawImage(this.canvasManager.processedTerrainCanvas, 0, 0);
        ctx.globalAlpha = 1.0;

        // LAYER 3: Draw political colors (TOGGLEABLE OVERLAY)
        // Controlled by UI toggle button - terrain is always visible beneath
        // 0% opacity: pure terrain view, 100% opacity: political country colors
        if (this.politicalOpacity > 0) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = this.politicalOpacity;
            ctx.drawImage(this.canvasManager.politicalCanvas, 0, 0);
            ctx.globalAlpha = 1.0;
        }

        // LAYER 4: Draw country borders (HOI4 STYLE - TOGGLEABLE)
        // Borders can be hidden for cleaner look during nation selection
        if (this.showBorders) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1.0;
            ctx.drawImage(this.canvasManager.borderCanvas, 0, 0);
        }

        // LAYER 5: Draw rivers
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.6;
        ctx.drawImage(this.canvasManager.recoloredRiversCanvas, 0, 0);
        ctx.globalAlpha = 1.0;

        // Draw overlays (selection, labels)
        ctx.drawImage(this.canvasManager.overlayCanvas, 0, 0);

        ctx.restore();
    }
}