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

        // Clear canvas completely - no background
        ctx.clearRect(0, 0, this.canvasManager.visibleCanvas.width, this.canvasManager.visibleCanvas.height);

        // Apply camera transform
        ctx.translate(camera.x, camera.y);
        ctx.scale(camera.zoom, camera.zoom);

        ctx.imageSmoothingEnabled = false;

        // TEMPORARY: Draw raw provinces.png to see full HOI4 map structure
        // TODO: Generate proper province ownership data for all 13,382 provinces
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.3; // Dim so we can see it
        ctx.drawImage(this.canvasManager.hiddenCanvas, 0, 0);

        // Draw political colors on top (only 22% of map has colors currently)
        ctx.globalAlpha = 0.8;
        ctx.drawImage(this.canvasManager.politicalCanvas, 0, 0);
        ctx.globalAlpha = 1.0;

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;

        // Draw rivers
        ctx.globalAlpha = 0.8; // Slightly increased from 0.7 to 0.8
        ctx.drawImage(this.canvasManager.recoloredRiversCanvas, 0, 0);
        ctx.globalAlpha = 1.0;

        // Draw borders
        ctx.drawImage(this.canvasManager.borderCanvas, 0, 0);
        
        // Draw overlays (selection, labels)
        ctx.drawImage(this.canvasManager.overlayCanvas, 0, 0);
        
        ctx.restore();
    }
}