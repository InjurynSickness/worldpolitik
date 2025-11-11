// /src/rendering/CanvasManager.ts
export class CanvasManager {
    container;
    mapWidth;
    mapHeight;
    // Visible canvas (what user sees)
    visibleCanvas;
    visibleCtx;
    // Hidden canvas for province color-picking
    hiddenCanvas;
    hiddenCtx;
    // Political colors canvas
    politicalCanvas;
    politicalCtx;
    // Overlay canvas (hover/selection)
    overlayCanvas;
    overlayCtx;
    // Border canvas
    borderCanvas;
    borderCtx;
    // Recolored rivers canvas
    recoloredRiversCanvas;
    recoloredRiversCtx;
    // Processed terrain canvas
    processedTerrainCanvas;
    processedTerrainCtx;
    constructor(container, mapWidth, mapHeight) {
        this.container = container;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.visibleCanvas = this.createVisibleCanvas();
        this.visibleCtx = this.visibleCanvas.getContext('2d');
        this.hiddenCanvas = this.createOffscreenCanvas(true);
        this.hiddenCtx = this.hiddenCanvas.getContext('2d', { willReadFrequently: true });
        this.politicalCanvas = this.createOffscreenCanvas();
        this.politicalCtx = this.politicalCanvas.getContext('2d');
        this.overlayCanvas = this.createOffscreenCanvas();
        this.overlayCtx = this.overlayCanvas.getContext('2d');
        this.borderCanvas = this.createOffscreenCanvas();
        this.borderCtx = this.borderCanvas.getContext('2d');
        this.recoloredRiversCanvas = this.createOffscreenCanvas();
        this.recoloredRiversCtx = this.recoloredRiversCanvas.getContext('2d');
        this.processedTerrainCanvas = this.createOffscreenCanvas();
        this.processedTerrainCtx = this.processedTerrainCanvas.getContext('2d', { willReadFrequently: true });
    }
    createVisibleCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = this.container.clientWidth;
        canvas.height = this.container.clientHeight;
        canvas.style.backgroundColor = '#334a5e';
        canvas.style.cursor = 'grab';
        this.container.appendChild(canvas);
        return canvas;
    }
    createOffscreenCanvas(willReadFrequently = false) {
        const canvas = document.createElement('canvas');
        canvas.width = this.mapWidth;
        canvas.height = this.mapHeight;
        return canvas;
    }
    resizeVisibleCanvas() {
        this.visibleCanvas.width = this.container.clientWidth;
        this.visibleCanvas.height = this.container.clientHeight;
    }
    destroy() {
        if (this.visibleCanvas.parentElement) {
            this.visibleCanvas.parentElement.removeChild(this.visibleCanvas);
        }
    }
}
//# sourceMappingURL=CanvasManager.js.map