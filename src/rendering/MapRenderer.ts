// /src/rendering/MapRenderer.ts

import { CanvasManager } from './CanvasManager.js';
import { CameraController } from '../camera/CameraController.js';

export class MapRenderer {
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

        // Draw political colors on top (ONLY where we have ownership data)
        // Strong opacity for clear country colors
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.95;  // Strong political colors
        ctx.drawImage(this.canvasManager.politicalCanvas, 0, 0);
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