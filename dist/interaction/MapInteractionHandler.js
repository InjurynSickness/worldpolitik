// /src/interaction/MapInteractionHandler.ts
export class MapInteractionHandler {
    canvas;
    cameraController;
    onHover;
    onClick;
    onPaint;
    onPanOrZoom;
    isEditorMode;
    isPanning = false;
    isPainting = false;
    lastMousePos = { x: 0, y: 0 };
    dragThreshold = 5;
    constructor(canvas, cameraController, onHover, onClick, onPaint, onPanOrZoom, isEditorMode) {
        this.canvas = canvas;
        this.cameraController = cameraController;
        this.onHover = onHover;
        this.onClick = onClick;
        this.onPaint = onPaint;
        this.onPanOrZoom = onPanOrZoom;
        this.isEditorMode = isEditorMode;
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
    }
    handleMouseDown(event) {
        this.lastMousePos = { x: event.clientX, y: event.clientY };
        this.isPanning = false;
        this.isPainting = false;
        if (event.button === 0) {
            if (this.isEditorMode()) {
                this.isPainting = true;
                const { x, y } = this.cameraController.getMapCoordinates(event.offsetX, event.offsetY);
                this.onPaint(x, y, false);
            }
            else {
                this.isPanning = true;
            }
        }
        else if (event.button === 1) {
            event.preventDefault();
            this.isPanning = true;
            this.canvas.style.cursor = 'grabbing';
        }
        else if (event.button === 2) {
            event.preventDefault();
            if (this.isEditorMode()) {
                const { x, y } = this.cameraController.getMapCoordinates(event.offsetX, event.offsetY);
                this.onPaint(x, y, true);
            }
        }
    }
    handleMouseUp(event) {
        const dx = Math.abs(event.clientX - this.lastMousePos.x);
        const dy = Math.abs(event.clientY - this.lastMousePos.y);
        const isClick = dx < this.dragThreshold && dy < this.dragThreshold;
        if (event.button === 0 && isClick && !this.isEditorMode()) {
            const { x, y } = this.cameraController.getMapCoordinates(event.offsetX, event.offsetY);
            this.onClick(x, y);
        }
        this.isPanning = false;
        this.isPainting = false;
        const { x, y } = this.cameraController.getMapCoordinates(event.offsetX, event.offsetY);
        this.onHover(x, y);
    }
    handleMouseMove(event) {
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
            const { x, y } = this.cameraController.getMapCoordinates(event.offsetX, event.offsetY);
            this.onPaint(x, y, isRightButtonDown);
            return;
        }
        this.isPanning = false;
        this.isPainting = false;
        const { x, y } = this.cameraController.getMapCoordinates(event.offsetX, event.offsetY);
        this.onHover(x, y);
    }
    handleMouseLeave() {
        this.isPanning = false;
        this.isPainting = false;
        this.canvas.style.cursor = 'grab';
    }
    handleWheel(event) {
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        this.cameraController.zoom(mouseX, mouseY, zoomFactor);
        this.onPanOrZoom();
    }
    updateCursor(isPointer) {
        if (this.isEditorMode()) {
            this.canvas.style.cursor = 'crosshair';
        }
        else {
            this.canvas.style.cursor = isPointer ? 'pointer' : 'grab';
        }
    }
    destroy() {
        // Event listeners are automatically cleaned up when canvas is removed
    }
}
//# sourceMappingURL=MapInteractionHandler.js.map