import { CountryData } from '../countryData.js';
export declare class LabelRenderer {
    private allCountryData;
    constructor(allCountryData: Map<string, CountryData>);
    drawLabels(ctx: CanvasRenderingContext2D, labelCache: Map<string, {
        x: number;
        y: number;
    }>, provinceOwnerMap: Map<string, string>, cameraZoom: number): void;
}
