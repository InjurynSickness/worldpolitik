// Border generation utilities for province and country borders
// Extracts border pixels from image data for rendering

import { logger } from '../utils/Logger.js';
import { provinceColorMap } from '../provinceColors.js';

export class BorderGenerator {
    /**
     * Generate border pixels for a specific province (edge detection)
     * Returns array of [x, y] coordinates marking province boundaries
     */
    public static generateProvinceBorders(
        provinceId: string,
        imageData: ImageData,
        mapWidth: number,
        mapHeight: number
    ): [number, number][] {
        logger.debug('BorderGenerator', `Generating borders for province: ${provinceId}`);
        const borders: [number, number][] = [];
        const data = imageData.data;

        // Find target province color
        let targetColor: string | null = null;
        for (const [colorKey, province] of provinceColorMap.entries()) {
            if (province.id === provinceId) {
                targetColor = colorKey;
                break;
            }
        }

        if (!targetColor) return borders;

        const [targetR, targetG, targetB] = targetColor.split(',').map(Number);

        // Scan pixels and find edges
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                const idx = (y * mapWidth + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                // Check if this pixel is part of our province
                if (r === targetR && g === targetG && b === targetB) {
                    // Check if any neighbor is a different province (edge detection)
                    let isEdge = false;
                    for (let dy = -1; dy <= 1 && !isEdge; dy++) {
                        for (let dx = -1; dx <= 1 && !isEdge; dx++) {
                            if (dx === 0 && dy === 0) continue;

                            const nx = x + dx;
                            const ny = y + dy;

                            if (nx >= 0 && nx < mapWidth && ny >= 0 && ny < mapHeight) {
                                const nidx = (ny * mapWidth + nx) * 4;
                                const nr = data[nidx];
                                const ng = data[nidx + 1];
                                const nb = data[nidx + 2];

                                if (nr !== targetR || ng !== targetG || nb !== targetB) {
                                    isEdge = true;
                                }
                            }
                        }
                    }

                    if (isEdge) {
                        borders.push([x, y]);
                    }
                }
            }
        }

        logger.debug('BorderGenerator', `Generated ${borders.length} border pixels for province ${provinceId}`);
        return borders;
    }

    /**
     * Generate country borders - detects where different countries meet
     * NOTE: Does NOT draw borders between countries and water/ocean
     * Returns array of [x, y] coordinates marking country boundaries
     */
    public static generateCountryBorders(
        imageData: ImageData,
        mapWidth: number,
        mapHeight: number
    ): [number, number][] {
        const startTime = performance.now();
        logger.debug('BorderGenerator', 'Generating country borders...');

        const borders: [number, number][] = [];
        const data = imageData.data;
        let borderPixels = 0;

        // Scan pixels and find where different countries meet
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                const idx = (y * mapWidth + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const a = data[idx + 3];

                // Skip transparent pixels (water/ocean - no country)
                if (a === 0) continue;

                const currentColor = `${r},${g},${b}`;

                // Check 4-directional neighbors (faster than 8-directional)
                const neighbors = [
                    [x + 1, y],  // Right
                    [x, y + 1],  // Down
                ];

                let isDifferentCountry = false;

                for (const [nx, ny] of neighbors) {
                    if (nx >= 0 && nx < mapWidth && ny >= 0 && ny < mapHeight) {
                        const nidx = (ny * mapWidth + nx) * 4;
                        const nr = data[nidx];
                        const ng = data[nidx + 1];
                        const nb = data[nidx + 2];
                        const na = data[nidx + 3];

                        // ONLY draw borders between actual countries (both have alpha > 0)
                        // Skip borders between countries and water (na === 0)
                        if (na > 0) {
                            const neighborColor = `${nr},${ng},${nb}`;
                            if (currentColor !== neighborColor) {
                                isDifferentCountry = true;
                                break;
                            }
                        }
                    }
                }

                if (isDifferentCountry) {
                    borders.push([x, y]);
                    borderPixels++;
                }
            }
        }

        const elapsed = performance.now() - startTime;
        logger.info('BorderGenerator', `✓ Country borders generated: ${borderPixels} border pixels (land-only) in ${elapsed.toFixed(0)}ms`);

        return borders;
    }
}
