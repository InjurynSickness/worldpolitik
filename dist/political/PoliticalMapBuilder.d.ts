import { CountryData } from '../countryData.js';
export declare class PoliticalMapBuilder {
    private mapWidth;
    private mapHeight;
    private hiddenCtx;
    private allCountryData;
    constructor(mapWidth: number, mapHeight: number, hiddenCtx: CanvasRenderingContext2D, allCountryData: Map<string, CountryData>);
    buildPoliticalMap(politicalCtx: CanvasRenderingContext2D, provinceOwnerMap: Map<string, string>): void;
    private hexToRgb;
}
