export declare class CanvasManager {
    private container;
    private mapWidth;
    private mapHeight;
    visibleCanvas: HTMLCanvasElement;
    visibleCtx: CanvasRenderingContext2D;
    hiddenCanvas: HTMLCanvasElement;
    hiddenCtx: CanvasRenderingContext2D;
    politicalCanvas: HTMLCanvasElement;
    politicalCtx: CanvasRenderingContext2D;
    overlayCanvas: HTMLCanvasElement;
    overlayCtx: CanvasRenderingContext2D;
    borderCanvas: HTMLCanvasElement;
    borderCtx: CanvasRenderingContext2D;
    recoloredRiversCanvas: HTMLCanvasElement;
    recoloredRiversCtx: CanvasRenderingContext2D;
    processedTerrainCanvas: HTMLCanvasElement;
    processedTerrainCtx: CanvasRenderingContext2D;
    constructor(container: HTMLElement, mapWidth: number, mapHeight: number);
    private createVisibleCanvas;
    private createOffscreenCanvas;
    resizeVisibleCanvas(): void;
    destroy(): void;
}
