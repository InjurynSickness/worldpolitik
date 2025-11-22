// /src/camera/CameraController.ts

export interface Camera {
    x: number;
    y: number;
    zoom: number;
    minZoom: number;
    maxZoom: number;
}

export class CameraController {
    public camera: Camera = {
        x: 0,
        y: 0,
        zoom: 1,
        minZoom: 0.1,  // Will be recalculated based on viewport
        maxZoom: 15
    };

    constructor(
        private viewportWidth: number,
        private viewportHeight: number,
        private mapWidth: number,
        private mapHeight: number
    ) {
        this.calculateMinZoom();
        this.resetCamera();
    }

    // Calculate minimum zoom to ensure map always fills at least 90% of viewport
    private calculateMinZoom(): void {
        const zoomToFitWidth = this.viewportWidth / this.mapWidth;
        const zoomToFitHeight = this.viewportHeight / this.mapHeight;

        // Use the larger of the two to ensure map fills screen
        // Multiply by 0.9 to allow slight zoom out but not too much
        this.camera.minZoom = Math.max(zoomToFitWidth, zoomToFitHeight) * 0.9;

        console.log('[CameraController] Calculated minZoom:', this.camera.minZoom, {
            viewportWidth: this.viewportWidth,
            viewportHeight: this.viewportHeight,
            mapWidth: this.mapWidth,
            mapHeight: this.mapHeight,
            zoomToFitWidth,
            zoomToFitHeight
        });
    }

    public resetCamera(): void {
        const initialZoomMultiplier = 2.0;
        this.camera.zoom = initialZoomMultiplier;
        
        const mapCenterX = this.mapWidth / 2;
        const mapCenterY = this.mapHeight / 2;
        
        this.camera.x = (this.viewportWidth / 2) - (mapCenterX * this.camera.zoom);
        this.camera.y = (this.viewportHeight / 2) - (mapCenterY * this.camera.zoom);
        
        this.constrainCamera();
    }

    public pan(deltaX: number, deltaY: number): void {
        this.camera.x += deltaX;
        this.camera.y += deltaY;
        this.constrainCamera();
    }

    public zoom(mouseX: number, mouseY: number, zoomFactor: number): void {
        const newZoom = Math.max(
            this.camera.minZoom, 
            Math.min(this.camera.maxZoom, this.camera.zoom * zoomFactor)
        );

        if (newZoom === this.camera.zoom) return;

        this.camera.x = mouseX - (mouseX - this.camera.x) * (newZoom / this.camera.zoom);
        this.camera.y = mouseY - (mouseY - this.camera.y) * (newZoom / this.camera.zoom);
        this.camera.zoom = newZoom;

        this.constrainCamera();
    }

    public constrainCamera(): void {
        const mapWidthScaled = this.mapWidth * this.camera.zoom;
        const mapHeightScaled = this.mapHeight * this.camera.zoom;
        
        if (mapWidthScaled <= this.viewportWidth) {
            this.camera.x = (this.viewportWidth - mapWidthScaled) / 2;
        } else {
            const maxX = 0;
            const minX = this.viewportWidth - mapWidthScaled;
            this.camera.x = Math.max(minX, Math.min(maxX, this.camera.x));
        }
        
        if (mapHeightScaled <= this.viewportHeight) {
            this.camera.y = (this.viewportHeight - mapHeightScaled) / 2;
        } else {
            const maxY = 0;
            const minY = this.viewportHeight - mapHeightScaled;
            this.camera.y = Math.max(minY, Math.min(maxY, this.camera.y));
        }
    }

    public getMapCoordinates(screenX: number, screenY: number): { x: number, y: number } {
        const x = (screenX - this.camera.x) / this.camera.zoom;
        const y = (screenY - this.camera.y) / this.camera.zoom;
        const result = { x: Math.floor(x), y: Math.floor(y) };

        console.log('[CameraController] getMapCoordinates:', {
            screen: { x: screenX, y: screenY },
            camera: { x: this.camera.x, y: this.camera.y, zoom: this.camera.zoom },
            map: result
        });

        return result;
    }

    public updateViewportSize(width: number, height: number): void {
        this.viewportWidth = width;
        this.viewportHeight = height;
        this.calculateMinZoom();  // Recalculate min zoom for new viewport size
        this.constrainCamera();
    }
}