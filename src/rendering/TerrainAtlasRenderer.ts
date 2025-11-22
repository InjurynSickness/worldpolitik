// HOI4-style terrain atlas rendering
// Uses heightmap to determine terrain type, samples from texture atlases

import { logger } from '../utils/Logger.js';

export class TerrainAtlasRenderer {
    private atlasImage = new Image();
    private heightmapImage = new Image();
    private terrainCanvas: HTMLCanvasElement;
    private terrainCtx: CanvasRenderingContext2D;
    private ready = false;

    // Terrain type color indices from heightmap
    // In HOI4 heightmap, different colors = different terrain types
    private readonly TERRAIN_COLORS = {
        PLAINS: { r: 0, g: 128, b: 0 },        // Green
        FOREST: { r: 34, g: 139, b: 34 },      // Dark green
        HILLS: { r: 139, g: 69, b: 19 },       // Brown
        MOUNTAIN: { r: 128, g: 128, b: 128 },  // Gray
        DESERT: { r: 255, g: 228, b: 181 },    // Sandy
        SNOW: { r: 255, g: 255, b: 255 },      // White
        // Add more terrain types as needed
    };

    constructor(
        private mapWidth: number,
        private mapHeight: number,
        private onReady: () => void,
        private waterMaskCtx?: CanvasRenderingContext2D
    ) {
        this.terrainCanvas = document.createElement('canvas');
        this.terrainCanvas.width = mapWidth;
        this.terrainCanvas.height = mapHeight;
        this.terrainCtx = this.terrainCanvas.getContext('2d', { willReadFrequently: true })!;
    }

    public async load(): Promise<void> {
        logger.info('TerrainAtlasRenderer', 'Loading terrain atlas and heightmap...');

        await Promise.all([
            this.loadImage(this.atlasImage, './terrain_atlas0.png', 'Terrain Atlas'),
            this.loadImage(this.heightmapImage, './heightmap.png', 'Heightmap')
        ]);

        logger.info('TerrainAtlasRenderer', 'Generating terrain from atlas...');
        this.generateTerrainFromAtlas();

        this.ready = true;
        this.onReady();
        logger.info('TerrainAtlasRenderer', '✅ Terrain atlas ready');
    }

    private loadImage(img: HTMLImageElement, src: string, name: string): Promise<void> {
        return new Promise((resolve, reject) => {
            img.onload = () => {
                logger.info('TerrainAtlasRenderer', `✓ ${name} loaded: ${img.width}x${img.height}`);
                resolve();
            };
            img.onerror = (e) => {
                logger.error('TerrainAtlasRenderer', `✗ Failed to load ${name}`, e);
                reject(e);
            };
            img.src = src;
        });
    }

    /**
     * Generate terrain texture by sampling from atlas based on heightmap
     */
    private generateTerrainFromAtlas(): void {
        const startTime = performance.now();

        // Draw heightmap to temp canvas to read pixel data
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.mapWidth;
        tempCanvas.height = this.mapHeight;
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCtx.drawImage(this.heightmapImage, 0, 0, this.mapWidth, this.mapHeight);
        const heightmapData = tempCtx.getImageData(0, 0, this.mapWidth, this.mapHeight);

        // Create terrain by sampling atlas
        const terrainImageData = this.terrainCtx.createImageData(this.mapWidth, this.mapHeight);
        const atlasCanvas = document.createElement('canvas');
        atlasCanvas.width = this.atlasImage.width;
        atlasCanvas.height = this.atlasImage.height;
        const atlasCtx = atlasCanvas.getContext('2d')!;
        atlasCtx.drawImage(this.atlasImage, 0, 0);
        const atlasData = atlasCtx.getImageData(0, 0, this.atlasImage.width, this.atlasImage.height);

        // Tile size in atlas (HOI4 uses tiled terrain textures)
        const TILE_SIZE = 64; // Adjust based on actual atlas layout
        const TILES_PER_ROW = Math.floor(this.atlasImage.width / TILE_SIZE);

        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const idx = (y * this.mapWidth + x) * 4;

                // Get heightmap color to determine terrain type
                const r = heightmapData.data[idx];
                const g = heightmapData.data[idx + 1];
                const b = heightmapData.data[idx + 2];

                // Determine which atlas tile to use based on terrain type
                // Simple approach: use heightmap color to pick tile
                const tileIndex = this.getTerrainTileIndex(r, g, b);
                const tileX = (tileIndex % TILES_PER_ROW) * TILE_SIZE;
                const tileY = Math.floor(tileIndex / TILES_PER_ROW) * TILE_SIZE;

                // Sample from atlas (with tiling)
                const sampleX = tileX + (x % TILE_SIZE);
                const sampleY = tileY + (y % TILE_SIZE);
                const sampleIdx = (sampleY * this.atlasImage.width + sampleX) * 4;

                // Copy pixel from atlas to terrain
                terrainImageData.data[idx] = atlasData.data[sampleIdx];
                terrainImageData.data[idx + 1] = atlasData.data[sampleIdx + 1];
                terrainImageData.data[idx + 2] = atlasData.data[sampleIdx + 2];
                terrainImageData.data[idx + 3] = 255; // Full opacity
            }
        }

        this.terrainCtx.putImageData(terrainImageData, 0, 0);

        // Apply water mask if provided
        if (this.waterMaskCtx) {
            this.applyWaterMask();
        }

        const elapsed = performance.now() - startTime;
        logger.info('TerrainAtlasRenderer', `Terrain generated in ${elapsed.toFixed(0)}ms`);
    }

    /**
     * Make water provinces transparent so water colormap shows through
     */
    private applyWaterMask(): void {
        if (!this.waterMaskCtx) return;

        logger.info('TerrainAtlasRenderer', 'Applying water mask to terrain...');

        const terrainImageData = this.terrainCtx.getImageData(0, 0, this.mapWidth, this.mapHeight);
        const terrainData = terrainImageData.data;

        const maskImageData = this.waterMaskCtx.getImageData(0, 0, this.mapWidth, this.mapHeight);
        const maskData = maskImageData.data;

        let waterPixels = 0;
        let landPixels = 0;

        // Make water areas transparent
        for (let i = 0; i < terrainData.length; i += 4) {
            const r = maskData[i];
            const g = maskData[i + 1];
            const b = maskData[i + 2];

            // Ocean/water in provinces.png is black (0,0,0) or very dark
            if (r < 10 && g < 10 && b < 10) {
                terrainData[i + 3] = 0;  // Make water transparent
                waterPixels++;
            } else {
                landPixels++;
            }
        }

        this.terrainCtx.putImageData(terrainImageData, 0, 0);

        logger.info('TerrainAtlasRenderer', `Water mask applied - ${waterPixels} water pixels, ${landPixels} land pixels`);
    }

    /**
     * Map heightmap color to terrain tile index in atlas
     */
    private getTerrainTileIndex(r: number, g: number, b: number): number {
        // Simple mapping - customize based on your heightmap colors
        // This is a simplified version, real HOI4 has more sophisticated mapping

        // Very basic terrain detection based on color
        if (r > 200 && g > 200 && b > 200) return 5; // Snow/white
        if (r > 200 && g < 100 && b < 100) return 4; // Desert/sand
        if (r < 100 && g > 100 && b < 100) return 1; // Forest/dark green
        if (r > 100 && g < 100 && b < 100) return 2; // Hills/brown
        if (r < 150 && g < 150 && b < 150) return 3; // Mountain/gray

        return 0; // Default to plains/green
    }

    public getTerrainCanvas(): HTMLCanvasElement {
        return this.terrainCanvas;
    }

    public isReady(): boolean {
        return this.ready;
    }
}
