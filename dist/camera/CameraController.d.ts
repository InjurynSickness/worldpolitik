export interface Camera {
    x: number;
    y: number;
    zoom: number;
    minZoom: number;
    maxZoom: number;
}
export declare class CameraController {
    private viewportWidth;
    private viewportHeight;
    private mapWidth;
    private mapHeight;
    camera: Camera;
    constructor(viewportWidth: number, viewportHeight: number, mapWidth: number, mapHeight: number);
    resetCamera(): void;
    pan(deltaX: number, deltaY: number): void;
    zoom(mouseX: number, mouseY: number, zoomFactor: number): void;
    constrainCamera(): void;
    getMapCoordinates(screenX: number, screenY: number): {
        x: number;
        y: number;
    };
    updateViewportSize(width: number, height: number): void;
}
