import { Province } from '../provinceData.js';
export declare class BorderMapBuilder {
    private mapWidth;
    private mapHeight;
    constructor(mapWidth: number, mapHeight: number);
    buildBorderMap(borderCtx: CanvasRenderingContext2D, provinceOwnerMap: Map<string, string>, getProvinceAt: (x: number, y: number) => Province | null): void;
}
