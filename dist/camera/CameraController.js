// /src/camera/CameraController.ts
export class CameraController {
    viewportWidth;
    viewportHeight;
    mapWidth;
    mapHeight;
    camera = {
        x: 0,
        y: 0,
        zoom: 1,
        minZoom: 0.1,
        maxZoom: 15
    };
    constructor(viewportWidth, viewportHeight, mapWidth, mapHeight) {
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.resetCamera();
    }
    resetCamera() {
        const initialZoomMultiplier = 2.0;
        this.camera.zoom = initialZoomMultiplier;
        const mapCenterX = this.mapWidth / 2;
        const mapCenterY = this.mapHeight / 2;
        this.camera.x = (this.viewportWidth / 2) - (mapCenterX * this.camera.zoom);
        this.camera.y = (this.viewportHeight / 2) - (mapCenterY * this.camera.zoom);
        this.constrainCamera();
    }
    pan(deltaX, deltaY) {
        this.camera.x += deltaX;
        this.camera.y += deltaY;
        this.constrainCamera();
    }
    zoom(mouseX, mouseY, zoomFactor) {
        const newZoom = Math.max(this.camera.minZoom, Math.min(this.camera.maxZoom, this.camera.zoom * zoomFactor));
        if (newZoom === this.camera.zoom)
            return;
        this.camera.x = mouseX - (mouseX - this.camera.x) * (newZoom / this.camera.zoom);
        this.camera.y = mouseY - (mouseY - this.camera.y) * (newZoom / this.camera.zoom);
        this.camera.zoom = newZoom;
        this.constrainCamera();
    }
    constrainCamera() {
        const mapWidthScaled = this.mapWidth * this.camera.zoom;
        const mapHeightScaled = this.mapHeight * this.camera.zoom;
        if (mapWidthScaled <= this.viewportWidth) {
            this.camera.x = (this.viewportWidth - mapWidthScaled) / 2;
        }
        else {
            const maxX = 0;
            const minX = this.viewportWidth - mapWidthScaled;
            this.camera.x = Math.max(minX, Math.min(maxX, this.camera.x));
        }
        if (mapHeightScaled <= this.viewportHeight) {
            this.camera.y = (this.viewportHeight - mapHeightScaled) / 2;
        }
        else {
            const maxY = 0;
            const minY = this.viewportHeight - mapHeightScaled;
            this.camera.y = Math.max(minY, Math.min(maxY, this.camera.y));
        }
    }
    getMapCoordinates(screenX, screenY) {
        const x = (screenX - this.camera.x) / this.camera.zoom;
        const y = (screenY - this.camera.y) / this.camera.zoom;
        return { x: Math.floor(x), y: Math.floor(y) };
    }
    updateViewportSize(width, height) {
        this.viewportWidth = width;
        this.viewportHeight = height;
        this.constrainCamera();
    }
}
//# sourceMappingURL=CameraController.js.map