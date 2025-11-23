// /src/political/PoliticalMapBuilder.ts

import { provinceColorMap } from '../provinceData.js';
import { CountryData } from '../countryData.js';
import { Color } from '../types.js';
import { waterProvinceIds } from '../waterProvinces.js';

export class PoliticalMapBuilder {
    // Ocean/sea color (standard blue)
    private static readonly WATER_COLOR: Color = [30, 77, 139]; // #1e4d8b

    constructor(
        private mapWidth: number,
        private mapHeight: number,
        private hiddenCtx: CanvasRenderingContext2D
    ) {}

    public buildPoliticalMap(
        politicalCtx: CanvasRenderingContext2D,
        provinceOwnerMap: Map<string, string>,
        allCountryData: Map<string, CountryData>,
        waterTextureCtx?: CanvasRenderingContext2D
    ): void {
        console.log("Building political map texture...");
        console.log("Country data size:", allCountryData.size);

        politicalCtx.clearRect(0, 0, this.mapWidth, this.mapHeight);

        const imageData = this.hiddenCtx.getImageData(0, 0, this.mapWidth, this.mapHeight);
        const data = imageData.data;

        const politicalImageData = politicalCtx.createImageData(this.mapWidth, this.mapHeight);
        const polData = politicalImageData.data;

        // Pre-compute color cache: province color -> country RGB color
        // This avoids repeated Map lookups and hex-to-RGB conversions
        const colorCache = new Map<string, [number, number, number] | null>();

        // Pre-fetch water texture if available
        let waterTextureData: ImageData | null = null;
        if (waterTextureCtx) {
            console.log("Using water texture for realistic ocean rendering");
            waterTextureData = waterTextureCtx.getImageData(0, 0, this.mapWidth, this.mapHeight);
        }

        let pixelsColored = 0;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            if (data[i+3] === 0) continue;

            const colorKey = `${r},${g},${b}`;

            // Check cache first
            let countryRgb = colorCache.get(colorKey);

            if (countryRgb === undefined) {
                // Not in cache, compute it
                const province = provinceColorMap.get(colorKey);

                if (province && province.id !== 'OCEAN') {
                    // Check if this is a water province first
                    if (waterProvinceIds.has(province.id)) {
                        // Water province - render as TRANSPARENT on political map
                        // (water texture will be rendered separately)
                        // This prevents borders from being drawn between water provinces
                        countryRgb = null;
                    } else {
                        // Land province - get country color
                        const ownerCountryId = provinceOwnerMap.get(province.id);
                        if (ownerCountryId) {
                            const country = allCountryData.get(ownerCountryId);
                            if (country) {
                                countryRgb = this.hexToRgb(country.color);
                            } else {
                                countryRgb = null;
                            }
                        } else {
                            countryRgb = null;
                        }
                    }
                } else {
                    countryRgb = null;
                }

                colorCache.set(colorKey, countryRgb);
            }

            if (countryRgb) {
                polData[i] = countryRgb[0];
                polData[i + 1] = countryRgb[1];
                polData[i + 2] = countryRgb[2];
                polData[i + 3] = 102; // 40% opacity for light tinting instead of full color
                pixelsColored++;
            }
        }

        politicalCtx.putImageData(politicalImageData, 0, 0);

        // Apply edge smoothing to reduce jagged boundaries
        this.smoothPoliticalEdges(politicalCtx);

        console.log("Political map texture is built. Pixels colored:", pixelsColored);
    }

    /**
     * Apply a subtle smoothing filter to political color boundaries
     * This reduces the jagged appearance while maintaining border visibility
     */
    private smoothPoliticalEdges(ctx: CanvasRenderingContext2D): void {
        // DISABLED: Blur causes color bleeding across borders
        // HOI4 uses sharp, clean borders without blur
        // The border textures provide the visual separation
        console.log("Edge smoothing disabled for HOI4-style sharp borders");
    }

    private hexToRgb(hex: string): Color {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return [0, 0, 0];

        let r = parseInt(result[1], 16);
        let g = parseInt(result[2], 16);
        let b = parseInt(result[3], 16);

        // Slight saturation boost for clearer political colors with light tint
        [r, g, b] = this.boostSaturation(r, g, b, 1.05); // 5% saturation boost

        return [r, g, b];
    }

    /**
     * Boost saturation of RGB color
     * @param r Red (0-255)
     * @param g Green (0-255)
     * @param b Blue (0-255)
     * @param factor Saturation multiplier (1.0 = no change, >1.0 = more saturated)
     */
    private boostSaturation(r: number, g: number, b: number, factor: number): Color {
        // Convert RGB to HSL
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        // Boost saturation
        s = Math.min(1, s * factor);

        // Convert HSL back to RGB
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        let r2, g2, b2;
        if (s === 0) {
            r2 = g2 = b2 = l;
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r2 = hue2rgb(p, q, h + 1/3);
            g2 = hue2rgb(p, q, h);
            b2 = hue2rgb(p, q, h - 1/3);
        }

        return [
            Math.round(r2 * 255),
            Math.round(g2 * 255),
            Math.round(b2 * 255)
        ];
    }
}