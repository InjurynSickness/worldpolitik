// /src/interaction/MapInteractionHandler.ts

import { CameraController } from '../camera/CameraController.js';

export class MapInteractionHandler {
    private isPanning = false;
    private isPainting = false;
    private lastMousePos = { x: 0, y: 0 };
    private dragThreshold = 5;

    constructor(
        private canvas: HTMLCanvasElement,
        private cameraController: CameraController,
        private onHover: ((x: number, y: number) => void) | null,  // Optional, removed hover visual feedback
        private onClick: (x: number, y: number) => void,
        private onPaint: (x: number, y: number, isRightClick: boolean) => void,
        private onPanOrZoom: () => void,
        private isEditorMode: () => boolean
    ) {
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
    }

    // Get accurate mouse coordinates using getBoundingClientRect
    // This fixes coordinate bugs when canvas has CSS transforms or scaling
    private getCanvasCoordinates(event: MouseEvent): { x: number, y: number } {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    private handleMouseDown(event: MouseEvent): void {
        this.lastMousePos = { x: event.clientX, y: event.clientY };
        this.isPanning = false;
        this.isPainting = false;

        if (event.button === 0) {
            if (this.isEditorMode()) {
                this.isPainting = true;
                const canvasCoords = this.getCanvasCoordinates(event);
                const { x, y } = this.cameraController.getMapCoordinates(canvasCoords.x, canvasCoords.y);
                this.onPaint(x, y, false);
            } else {
                this.isPanning = true;
            }
        } else if (event.button === 1) {
            event.preventDefault();
            this.isPanning = true;
            this.canvas.style.cursor = 'grabbing';
        } else if (event.button === 2) {
            event.preventDefault();
            if (this.isEditorMode()) {
                const canvasCoords = this.getCanvasCoordinates(event);
                const { x, y } = this.cameraController.getMapCoordinates(canvasCoords.x, canvasCoords.y);
                this.onPaint(x, y, true);
            }
        }
    }

    private handleMouseUp(event: MouseEvent): void {
        const dx = Math.abs(event.clientX - this.lastMousePos.x);
        const dy = Math.abs(event.clientY - this.lastMousePos.y);
        const isClick = dx < this.dragThreshold && dy < this.dragThreshold;

        if (event.button === 0 && isClick && !this.isEditorMode()) {
            const canvasCoords = this.getCanvasCoordinates(event);
            const { x, y } = this.cameraController.getMapCoordinates(canvasCoords.x, canvasCoords.y);
            console.log('[MapInteractionHandler] Click at canvas coords:', canvasCoords, 'map coords:', {x, y});
            this.onClick(x, y);
        }

        this.isPanning = false;
        this.isPainting = false;
        // Removed hover call - no hover visual feedback
    }

    private handleMouseMove(event: MouseEvent): void {
        const isLeftButtonDown = event.buttons === 1;
        const isMiddleButtonDown = event.buttons === 4;
        const isRightButtonDown = event.buttons === 2;

        if ((isLeftButtonDown && !this.isEditorMode()) || isMiddleButtonDown) {
            const dx = Math.abs(event.clientX - this.lastMousePos.x);
            const dy = Math.abs(event.clientY - this.lastMousePos.y);
            if (!this.isPanning && (dx > this.dragThreshold || dy > this.dragThreshold)) {
                this.isPanning = true;
            }

            if (this.isPanning) {
                this.canvas.style.cursor = 'grabbing';
                const deltaX = event.clientX - this.lastMousePos.x;
                const deltaY = event.clientY - this.lastMousePos.y;
                this.cameraController.pan(deltaX, deltaY);
                this.lastMousePos = { x: event.clientX, y: event.clientY };
                this.onPanOrZoom();
            }
            return;
        }

        if ((isLeftButtonDown || isRightButtonDown) && this.isEditorMode()) {
            this.isPainting = true;
            const canvasCoords = this.getCanvasCoordinates(event);
            const { x, y } = this.cameraController.getMapCoordinates(canvasCoords.x, canvasCoords.y);
            this.onPaint(x, y, isRightButtonDown);
            return;
        }

        this.isPanning = false;
        this.isPainting = false;
        // Removed hover call - no hover visual feedback
    }

    private handleMouseLeave(): void {
        this.isPanning = false;
        this.isPainting = false;
        this.canvas.style.cursor = 'grab';
    }

    private handleWheel(event: WheelEvent): void {
        event.preventDefault();
        const canvasCoords = this.getCanvasCoordinates(event);

        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        this.cameraController.zoom(canvasCoords.x, canvasCoords.y, zoomFactor);
        this.onPanOrZoom();
    }

    public updateCursor(isPointer: boolean): void {
        if (this.isEditorMode()) {
            this.canvas.style.cursor = 'crosshair';
        } else {
            this.canvas.style.cursor = isPointer ? 'pointer' : 'grab';
        }
    }

    public destroy(): void {
        // Event listeners are automatically cleaned up when canvas is removed
    }
}