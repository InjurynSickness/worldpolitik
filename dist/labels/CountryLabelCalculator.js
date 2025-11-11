// /src/labels/CountryLabelCalculator.ts
import { provinceColorMap } from '../provinceData.js';
export class CountryLabelCalculator {
    mapWidth;
    mapHeight;
    hiddenCtx;
    allCountryData;
    countryLabelCache = new Map();
    constructor(mapWidth, mapHeight, hiddenCtx, allCountryData) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.hiddenCtx = hiddenCtx;
        this.allCountryData = allCountryData;
    }
    async calculateLabelsAsync(provinceOwnerMap) {
        console.log("Calculating country label positions with largest rectangle algorithm...");
        this.countryLabelCache.clear();
        const countryProvinceMap = new Map();
        for (const [provinceId, countryId] of provinceOwnerMap.entries()) {
            if (!countryProvinceMap.has(countryId)) {
                countryProvinceMap.set(countryId, []);
            }
            countryProvinceMap.get(countryId).push(provinceId);
        }
        let processed = 0;
        for (const [countryId, provinceIds] of countryProvinceMap.entries()) {
            const countryInfo = this.allCountryData.get(countryId);
            if (!countryInfo)
                continue;
            const position = await this.calculateLabelPosition(provinceIds);
            if (position) {
                this.countryLabelCache.set(countryId, position);
            }
            processed++;
            if (processed % 5 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        console.log(`Cached ${this.countryLabelCache.size} country label positions`);
        return this.countryLabelCache;
    }
    async calculateLabelPosition(provinceIds) {
        let minX = this.mapWidth;
        let minY = this.mapHeight;
        let maxX = 0;
        let maxY = 0;
        for (const pId of provinceIds) {
            for (let y = 0; y < this.mapHeight; y += 50) {
                for (let x = 0; x < this.mapWidth; x += 50) {
                    const pixelData = this.hiddenCtx.getImageData(x, y, 1, 1).data;
                    const colorKey = `${pixelData[0]},${pixelData[1]},${pixelData[2]}`;
                    const foundProvince = provinceColorMap.get(colorKey);
                    if (foundProvince?.id === pId) {
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                    }
                }
            }
        }
        if (minX >= maxX || minY >= maxY)
            return null;
        const width = maxX - minX;
        const height = maxY - minY;
        const size = Math.min(width, height);
        let scalingFactor = 1;
        if (size < 100)
            scalingFactor = 10;
        else if (size < 250)
            scalingFactor = 20;
        else if (size < 500)
            scalingFactor = 30;
        else if (size < 1000)
            scalingFactor = 40;
        else
            scalingFactor = 50;
        const gridWidth = Math.ceil(width / scalingFactor);
        const gridHeight = Math.ceil(height / scalingFactor);
        const grid = Array(gridWidth).fill(null).map(() => Array(gridHeight).fill(false));
        for (let gy = 0; gy < gridHeight; gy++) {
            for (let gx = 0; gx < gridWidth; gx++) {
                const worldX = minX + gx * scalingFactor;
                const worldY = minY + gy * scalingFactor;
                if (worldX < this.mapWidth && worldY < this.mapHeight) {
                    const pixelData = this.hiddenCtx.getImageData(worldX, worldY, 1, 1).data;
                    const colorKey = `${pixelData[0]},${pixelData[1]},${pixelData[2]}`;
                    const foundProvince = provinceColorMap.get(colorKey);
                    if (foundProvince && provinceIds.includes(foundProvince.id)) {
                        grid[gx][gy] = true;
                    }
                }
            }
        }
        const largestRect = this.findLargestInscribedRectangle(grid);
        const rectWorldX = minX + largestRect.x * scalingFactor;
        const rectWorldY = minY + largestRect.y * scalingFactor;
        const rectWorldWidth = largestRect.width * scalingFactor;
        const rectWorldHeight = largestRect.height * scalingFactor;
        const centerX = rectWorldX + rectWorldWidth / 2;
        const centerY = rectWorldY + rectWorldHeight / 2;
        return { x: centerX, y: centerY };
    }
    findLargestInscribedRectangle(grid) {
        if (grid.length === 0 || grid[0].length === 0) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }
        const rows = grid[0].length;
        const cols = grid.length;
        const heights = new Array(cols).fill(0);
        let largestRect = { x: 0, y: 0, width: 0, height: 0 };
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (grid[col][row]) {
                    heights[col]++;
                }
                else {
                    heights[col] = 0;
                }
            }
            const rectForRow = this.largestRectangleInHistogram(heights);
            if (rectForRow.width * rectForRow.height > largestRect.width * largestRect.height) {
                largestRect = {
                    x: rectForRow.x,
                    y: row - rectForRow.height + 1,
                    width: rectForRow.width,
                    height: rectForRow.height,
                };
            }
        }
        return largestRect;
    }
    largestRectangleInHistogram(heights) {
        const stack = [];
        let maxArea = 0;
        let largestRect = { x: 0, y: 0, width: 0, height: 0 };
        for (let i = 0; i <= heights.length; i++) {
            const h = i === heights.length ? 0 : heights[i];
            while (stack.length > 0 && h < heights[stack[stack.length - 1]]) {
                const height = heights[stack.pop()];
                const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
                if (height * width > maxArea) {
                    maxArea = height * width;
                    largestRect = {
                        x: stack.length === 0 ? 0 : stack[stack.length - 1] + 1,
                        y: 0,
                        width: width,
                        height: height,
                    };
                }
            }
            stack.push(i);
        }
        return largestRect;
    }
    getLabelCache() {
        return this.countryLabelCache;
    }
}
//# sourceMappingURL=CountryLabelCalculator.js.map