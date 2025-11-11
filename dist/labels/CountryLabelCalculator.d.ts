import { CountryData } from '../countryData.js';
export declare class CountryLabelCalculator {
    private mapWidth;
    private mapHeight;
    private hiddenCtx;
    private allCountryData;
    private countryLabelCache;
    constructor(mapWidth: number, mapHeight: number, hiddenCtx: CanvasRenderingContext2D, allCountryData: Map<string, CountryData>);
    calculateLabelsAsync(provinceOwnerMap: Map<string, string>): Promise<Map<string, {
        x: number;
        y: number;
    }>>;
    private calculateLabelPosition;
    private findLargestInscribedRectangle;
    private largestRectangleInHistogram;
    getLabelCache(): Map<string, {
        x: number;
        y: number;
    }>;
}
