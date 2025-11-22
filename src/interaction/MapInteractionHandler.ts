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

        // Left button - allow panning in all modes (including editor)
        if (event.button === 0) {
            this.isPanning = true;
        } else if (event.button === 1) {
            // Middle mouse button - always pan
            event.preventDefault();
            this.isPanning = true;
            this.canvas.style.cursor = 'grabbing';
        } else if (event.button === 2) {
            // Right click - reserved for future use in editor
            event.preventDefault();
        }
    }

    private handleMouseUp(event: MouseEvent): void {
        const dx = Math.abs(event.clientX - this.lastMousePos.x);
        const dy = Math.abs(event.clientY - this.lastMousePos.y);
        const isClick = dx < this.dragThreshold && dy < this.dragThreshold;

        // If it was a click (not a drag), trigger onClick
        if (event.button === 0 && isClick) {
            const canvasCoords = this.getCanvasCoordinates(event);
            const { x, y } = this.cameraController.getMapCoordinates(canvasCoords.x, canvasCoords.y);
            console.log('[MapInteractionHandler] Click at canvas coords:', canvasCoords, 'map coords:', {x, y});
            this.onClick(x, y);
        }

        this.isPanning = false;
        this.isPainting = false;
        this.canvas.style.cursor = this.isEditorMode() ? 'crosshair' : 'grab';
    }

    private handleMouseMove(event: MouseEvent): void {
        const isLeftButtonDown = event.buttons === 1;
        const isMiddleButtonDown = event.buttons === 4;

        // Allow panning with left or middle mouse button (in all modes including editor)
        if (isLeftButtonDown || isMiddleButtonDown) {
            const dx = Math.abs(event.clientX - this.lastMousePos.x);
            const dy = Math.abs(event.clientY - this.lastMousePos.y);

            // Start panning if drag exceeds threshold
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

        this.isPanning = false;
        this.isPainting = false;

        // Enable hover visual feedback (show province borders on hover)
        if (this.onHover) {
            const canvasCoords = this.getCanvasCoordinates(event);
            const { x, y } = this.cameraController.getMapCoordinates(canvasCoords.x, canvasCoords.y);
            this.onHover(x, y);
        }
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