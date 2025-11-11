// /src/borders/BorderMapBuilder.ts
import { provinceBorders } from '../provinceBorders.js';
export class BorderMapBuilder {
    mapWidth;
    mapHeight;
    constructor(mapWidth, mapHeight) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
    }
    buildBorderMap(borderCtx, provinceOwnerMap, getProvinceAt) {
        console.log("Building static COUNTRY border map...");
        borderCtx.clearRect(0, 0, this.mapWidth, this.mapHeight);
        borderCtx.fillStyle = '#000000';
        borderCtx.globalAlpha = 0.7;
        const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (const [provinceId, borders] of provinceBorders.entries()) {
            if (provinceId === 'OCEAN')
                continue;
            const owner1 = provinceOwnerMap.get(provinceId);
            for (const [x, y] of borders) {
                let isCountryBorder = false;
                for (const [dx, dy] of neighbors) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx < 0 || nx >= this.mapWidth || ny < 0 || ny >= this.mapHeight)
                        continue;
                    const neighborProv = getProvinceAt(nx, ny);
                    if (!neighborProv || neighborProv.id === 'OCEAN')
                        continue;
                    if (neighborProv.id === provinceId)
                        continue;
                    const owner2 = provinceOwnerMap.get(neighborProv.id);
                    if (owner1 !== owner2) {
                        isCountryBorder = true;
                        break;
                    }
                }
                if (isCountryBorder) {
                    borderCtx.fillRect(x, y, 2, 2);
                }
            }
        }
        borderCtx.globalAlpha = 1.0;
        console.log("Static COUNTRY border map is built.");
    }
}
//# sourceMappingURL=BorderMapBuilder.js.map