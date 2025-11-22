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

        ctx.imageSmoothingEnabled = false;

        // Draw the raw provinces map
        // This shows all 13,382 HOI4 provinces with their original colors
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
        ctx.drawImage(this.canvasManager.hiddenCanvas, 0, 0);

        // Draw water texture (realistic ocean depth from HOI4 colormap_water)
        // This layer provides realistic depth variation for oceans/seas
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
        ctx.drawImage(this.canvasManager.waterTextureCanvas, 0, 0);

        // Draw political colors on top (ONLY where we have ownership data)
        // Water is transparent on this layer, so ocean texture shows through
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.95;  // Strong political colors
        ctx.drawImage(this.canvasManager.politicalCanvas, 0, 0);
        ctx.globalAlpha = 1.0;

        // Draw terrain texture AFTER political colors (processed to be transparent over water)
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

        ctx.globalCompositeOperation = 'multiply';  // Blend terrain with political colors
        ctx.globalAlpha = 0.7;  // Visible terrain overlay
        ctx.drawImage(this.canvasManager.processedTerrainCanvas, 0, 0);
        ctx.globalAlpha = 1.0;

        // Draw rivers
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.6;
        ctx.drawImage(this.canvasManager.recoloredRiversCanvas, 0, 0);
        ctx.globalAlpha = 1.0;

        // Draw overlays (selection, labels)
        ctx.drawImage(this.canvasManager.overlayCanvas, 0, 0);

        ctx.restore();
    }
}