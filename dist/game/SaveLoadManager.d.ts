import { GameState, GameDate, Alliance } from '../types.js';
export interface SaveData {
    gameState: {
        currentDate: GameDate;
        isPaused: boolean;
        gameSpeed: number;
        selectedCountryId: string | null;
        countries: Array<[string, any]>;
        alliances: Array<[string, Alliance]>;
    };
    saveTime: string;
    version: string;
}
export declare class SaveLoadManager {
    private static readonly SAVE_KEY_PREFIX;
    private static readonly CURRENT_VERSION;
    static saveGame(gameState: GameState, slotNumber?: number): boolean;
    static loadGame(slotNumber?: number): GameState | null;
    static getSaveData(slotNumber: number): SaveData | null;
    static deleteSave(slotNumber: number): void;
    static hasSave(slotNumber: number): boolean;
}
