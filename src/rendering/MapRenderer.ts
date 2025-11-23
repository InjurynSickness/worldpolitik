// /src/rendering/MapRenderer.ts

import { CanvasManager } from './CanvasManager.js';
import { CameraController } from '../camera/CameraController.js';
import { logger } from '../utils/Logger.js';

export class MapRenderer {
    private terrainDebugLogged = false;

    constructor(
        private canvasManager: CanvasManager,
        private cameraController: CameraController
    ) {}

    /**
     * Calculate political color opacity based on zoom level (HOI4 style)
     * - Zoomed in (high zoom): 0% opacity (only borders visible, terrain primary)
     * - Zoomed out (low zoom): High opacity (political overview)
     */
    private calculatePoliticalOpacity(): number {
        const camera = this.cameraController.camera;
        const zoom = camera.zoom;
        const minZoom = camera.minZoom;
        const maxZoom = camera.maxZoom;

        // Define zoom thresholds for political color visibility
        // At max zoom (zoomed in): completely transparent (0.0)
        // At min zoom (zoomed out): highly visible (0.7)
        const zoomFadeStart = minZoom * 3; // Start fading in political colors
        const zoomFadeEnd = minZoom * 1.2;   // Fully visible political colors

        if (zoom >= zoomFadeStart) {
            // Zoomed in: no political colors, only terrain + borders
            return 0.0;
        } else if (zoom <= zoomFadeEnd) {
            // Zoomed out: full political color tint (light overlay)
            return 1.0;
        } else {
            // Interpolate between zoomed in and zoomed out
            const t = (zoom - zoomFadeEnd) / (zoomFadeStart - zoomFadeEnd);
            return 1.0 * (1 - t); // Fade from 1.0 to 0.0
        }
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

        // LAYER 2: Draw terrain texture (PRIMARY VISUAL - always 100% visible like HOI4)
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
        ctx.globalAlpha = 1.0;
        ctx.drawImage(this.canvasManager.processedTerrainCanvas, 0, 0);

        // LAYER 3: Draw political colors (HOI4 ZOOM-BASED RENDERING)
        // Zoomed in: 0% opacity (invisible, only borders visible)
        // Zoomed out: 100% opacity (political overview with light tint)
        // Using source-over instead of multiply to avoid darkening/fog effect
        const politicalOpacity = this.calculatePoliticalOpacity();
        if (politicalOpacity > 0) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = politicalOpacity;
            ctx.drawImage(this.canvasManager.politicalCanvas, 0, 0);
            ctx.globalAlpha = 1.0;
        }

        // LAYER 4: Draw country borders (HOI4 STYLE - ALWAYS VISIBLE)
        // Borders are drawn at all zoom levels to distinguish countries
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
        ctx.drawImage(this.canvasManager.borderCanvas, 0, 0);

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