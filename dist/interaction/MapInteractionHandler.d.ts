import { CameraController } from '../camera/CameraController.js';
export declare class MapInteractionHandler {
    private canvas;
    private cameraController;
    private onHover;
    private onClick;
    private onPaint;
    private onPanOrZoom;
    private isEditorMode;
    private isPanning;
    private isPainting;
    private lastMousePos;
    private dragThreshold;
    constructor(canvas: HTMLCanvasElement, cameraController: CameraController, onHover: (x: number, y: number) => void, onClick: (x: number, y: number) => void, onPaint: (x: number, y: number, isRightClick: boolean) => void, onPanOrZoom: () => void, isEditorMode: () => boolean);
    private setupEventListeners;
    private handleMouseDown;
    private handleMouseUp;
    private handleMouseMove;
    private handleMouseLeave;
    private handleWheel;
    updateCursor(isPointer: boolean): void;
    destroy(): void;
}
