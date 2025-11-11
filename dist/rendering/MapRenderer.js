// /src/rendering/MapRenderer.ts
export class MapRenderer {
    canvasManager;
    cameraController;
    constructor(canvasManager, cameraController) {
        this.canvasManager = canvasManager;
        this.cameraController = cameraController;
    }
    render() {
        const ctx = this.canvasManager.visibleCtx;
        const camera = this.cameraController.camera;
        ctx.save();
        // Ocean background
        ctx.fillStyle = '#334a5e';
        ctx.fillRect(0, 0, this.canvasManager.visibleCanvas.width, this.canvasManager.visibleCanvas.height);
        // Apply camera transform
        ctx.translate(camera.x, camera.y);
        ctx.scale(camera.zoom, camera.zoom);
        ctx.imageSmoothingEnabled = false;
        // Draw terrain at reduced opacity
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.4;
        ctx.drawImage(this.canvasManager.processedTerrainCanvas, 0, 0);
        // Draw political colors
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.85;
        ctx.drawImage(this.canvasManager.politicalCanvas, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
        // Draw rivers
        ctx.globalAlpha = 0.7;
        ctx.drawImage(this.canvasManager.recoloredRiversCanvas, 0, 0);
        ctx.globalAlpha = 1.0;
        // Draw borders
        ctx.drawImage(this.canvasManager.borderCanvas, 0, 0);
        // Draw overlays (selection, labels)
        ctx.drawImage(this.canvasManager.overlayCanvas, 0, 0);
        ctx.restore();
    }
}
//# sourceMappingURL=MapRenderer.js.map