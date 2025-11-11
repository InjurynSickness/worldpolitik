import { Province } from '../provinceData.js';
export declare class MapEditor {
    private provinceOwnerMap;
    private getProvinceAt;
    private currentPaintCountry;
    constructor(provinceOwnerMap: Map<string, string>, getProvinceAt: (x: number, y: number) => Province | null);
    setPaintCountry(countryId: string | null): void;
    paintProvince(x: number, y: number, isRightClick: boolean): boolean;
    importAndAutoAssignCSV(csvPath?: string): Promise<{
        assigned: number;
        unassigned: number;
        unassignedList: string[];
    }>;
    private detectCountryFromName;
    exportMapData(): string;
    getCurrentPaintCountry(): string | null;
}
