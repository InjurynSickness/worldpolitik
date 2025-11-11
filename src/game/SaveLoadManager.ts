// /src/game/SaveLoadManager.ts

import { GameState, GameDate, Country, Alliance } from '../types.js';

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

export class SaveLoadManager {
    private static readonly SAVE_KEY_PREFIX = 'geopolitical-save-';
    private static readonly CURRENT_VERSION = '1.2.0';

    public static saveGame(gameState: GameState, slotNumber: number = 1): boolean {
        try {
            // FIX: Added explicit return type [string, any] to the map callback
            const serializableCountries = Array.from(gameState.countries.entries()).map(([id, country]): [string, any] => {
                return [id, { ...country, relations: Array.from(country.relations.entries()) }];
            });
            const serializableAlliances = Array.from(gameState.alliances.entries());
            
            const saveData: SaveData = {
                gameState: {
                    currentDate: gameState.currentDate,
                    isPaused: gameState.isPaused,
                    gameSpeed: gameState.gameSpeed,
                    selectedCountryId: gameState.selectedCountryId,
                    countries: serializableCountries,
                    alliances: serializableAlliances
                },
                saveTime: new Date().toISOString(),
                version: this.CURRENT_VERSION
            };
            
            localStorage.setItem(`${this.SAVE_KEY_PREFIX}${slotNumber}`, JSON.stringify(saveData));
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }

    public static loadGame(slotNumber: number = 1): GameState | null {
        try {
            const saveData = localStorage.getItem(`${this.SAVE_KEY_PREFIX}${slotNumber}`);
            if (!saveData) {
                return null;
            }
            
            const data: SaveData = JSON.parse(saveData);
            
            const countries = new Map<string, Country>();
            if (data.gameState.countries && Array.isArray(data.gameState.countries)) {
                for (const [id, countryData] of data.gameState.countries) {
                    countries.set(id, { ...countryData, relations: new Map(countryData.relations || []) });
                }
            }
            
            const alliances = new Map<string, Alliance>(data.gameState.alliances || []);
            
            return {
                ...data.gameState,
                countries,
                alliances
            };
        } catch (error) {
            console.error('Failed to load game:', error);
            localStorage.removeItem(`${this.SAVE_KEY_PREFIX}${slotNumber}`);
            return null;
        }
    }

    public static getSaveData(slotNumber: number): SaveData | null {
        try {
            const saveData = localStorage.getItem(`${this.SAVE_KEY_PREFIX}${slotNumber}`);
            if (!saveData) return null;
            return JSON.parse(saveData);
        } catch (error) {
            console.error('Failed to read save data:', error);
            return null;
        }
    }

    public static deleteSave(slotNumber: number): void {
        localStorage.removeItem(`${this.SAVE_KEY_PREFIX}${slotNumber}`);
    }

    public static hasSave(slotNumber: number): boolean {
        return localStorage.getItem(`${this.SAVE_KEY_PREFIX}${slotNumber}`) !== null;
    }
}