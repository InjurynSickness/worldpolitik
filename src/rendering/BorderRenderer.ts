// HOI4-style border rendering using actual border texture assets
// Loads border_country_0.png and renders it on the border canvas

import { logger } from '../utils/Logger.js';

export class BorderRenderer {
    private borderImage = new Image();
    private ready = false;

    constructor(
        private mapWidth: number,
        private mapHeight: number,
        private borderCtx: CanvasRenderingContext2D,
        private onReady: () => void
    ) {}

    public async load(): Promise<void> {
        logger.info('BorderRenderer', '🗺️ Loading border textures...');

        try {
            await this.loadImage(this.borderImage, './border_country_0.png', 'Country Borders');

            // Draw borders to canvas
            this.borderCtx.clearRect(0, 0, this.mapWidth, this.mapHeight);
            this.borderCtx.drawImage(this.borderImage, 0, 0, this.mapWidth, this.mapHeight);

            this.ready = true;
            this.onReady();
            logger.info('BorderRenderer', '✅ Border textures loaded and rendered');
        } catch (error) {
            logger.error('BorderRenderer', '❌ Failed to load border textures', error);
            throw error;
        }
    }

    private loadImage(img: HTMLImageElement, src: string, name: string): Promise<void> {
        return new Promise((resolve, reject) => {
            img.onload = () => {
                logger.info('BorderRenderer', `✓ ${name} loaded: ${img.width}x${img.height}`);
                resolve();
            };
            img.onerror = (e) => {
                logger.error('BorderRenderer', `✗ Failed to load ${name}`, e);
                reject(e);
            };
            img.src = src;
        });
    }

    public isReady(): boolean {
        return this.ready;
    }
}
