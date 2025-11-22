// /src/interaction/MapInteractionHandler.ts

import { CameraController } from '../camera/CameraController.js';

export class MapInteractionHandler {
    private isPanning = false;
    private isPainting = false;
    private lastMousePos = { x: 0, y: 0 };
    private dragThreshold = 5;

    // Edge scrolling (HOI4-style)
    private edgeScrollEnabled = true;
    private edgeScrollThreshold = 20; // pixels from edge to trigger scroll
    private edgeScrollSpeed = 8; // pixels per frame
    private mouseAtEdge = { left: false, right: false, top: false, bottom: false };
    private edgeScrollAnimationId: number | null = null;

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
        this.startEdgeScrollLoop();
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

        // Update edge scroll detection (HOI4-style - detect mouse near screen edges)
        if (this.edgeScrollEnabled && !isLeftButtonDown && !isMiddleButtonDown) {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseAtEdge.left = event.clientX - rect.left < this.edgeScrollThreshold;
            this.mouseAtEdge.right = rect.right - event.clientX < this.edgeScrollThreshold;
            this.mouseAtEdge.top = event.clientY - rect.top < this.edgeScrollThreshold;
            this.mouseAtEdge.bottom = rect.bottom - event.clientY < this.edgeScrollThreshold;
        } else {
            // Disable edge scroll while dragging
            this.mouseAtEdge = { left: false, right: false, top: false, bottom: false };
        }

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
        // Reset edge scroll when mouse leaves canvas
        this.mouseAtEdge = { left: false, right: false, top: false, bottom: false };
    }

    // Edge scroll loop - runs continuously and pans camera when mouse is near edges
    private startEdgeScrollLoop(): void {
        const edgeScrollFrame = () => {
            // Check if any edge is active
            const isScrolling = this.mouseAtEdge.left || this.mouseAtEdge.right ||
                               this.mouseAtEdge.top || this.mouseAtEdge.bottom;

            if (isScrolling && !this.isPanning) {
                let deltaX = 0;
                let deltaY = 0;

                if (this.mouseAtEdge.left) deltaX = this.edgeScrollSpeed;
                if (this.mouseAtEdge.right) deltaX = -this.edgeScrollSpeed;
                if (this.mouseAtEdge.top) deltaY = this.edgeScrollSpeed;
                if (this.mouseAtEdge.bottom) deltaY = -this.edgeScrollSpeed;

                this.cameraController.pan(deltaX, deltaY);
                this.onPanOrZoom();
            }

            this.edgeScrollAnimationId = requestAnimationFrame(edgeScrollFrame);
        };

        this.edgeScrollAnimationId = requestAnimationFrame(edgeScrollFrame);
    }

    private handleWheel(event: WheelEvent): void {
        event.preventDefault();
        const canvasCoords = this.getCanvasCoordinates(event);

        // Smoother zoom feel - smaller increments for better control (HOI4-style)
        const zoomFactor = event.deltaY > 0 ? 0.95 : 1.05;
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
        // Stop edge scroll animation
        if (this.edgeScrollAnimationId !== null) {
            cancelAnimationFrame(this.edgeScrollAnimationId);
            this.edgeScrollAnimationId = null;
        }
        // Event listeners are automatically cleaned up when canvas is removed
    }
}