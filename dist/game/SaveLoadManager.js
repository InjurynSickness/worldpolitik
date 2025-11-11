// /src/game/SaveLoadManager.ts
export class SaveLoadManager {
    static SAVE_KEY_PREFIX = 'geopolitical-save-';
    static CURRENT_VERSION = '1.2.0';
    static saveGame(gameState, slotNumber = 1) {
        try {
            // FIX: Added explicit return type [string, any] to the map callback
            const serializableCountries = Array.from(gameState.countries.entries()).map(([id, country]) => {
                return [id, { ...country, relations: Array.from(country.relations.entries()) }];
            });
            const serializableAlliances = Array.from(gameState.alliances.entries());
            const saveData = {
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
        }
        catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }
    static loadGame(slotNumber = 1) {
        try {
            const saveData = localStorage.getItem(`${this.SAVE_KEY_PREFIX}${slotNumber}`);
            if (!saveData) {
                return null;
            }
            const data = JSON.parse(saveData);
            const countries = new Map();
            if (data.gameState.countries && Array.isArray(data.gameState.countries)) {
                for (const [id, countryData] of data.gameState.countries) {
                    countries.set(id, { ...countryData, relations: new Map(countryData.relations || []) });
                }
            }
            const alliances = new Map(data.gameState.alliances || []);
            return {
                ...data.gameState,
                countries,
                alliances
            };
        }
        catch (error) {
            console.error('Failed to load game:', error);
            localStorage.removeItem(`${this.SAVE_KEY_PREFIX}${slotNumber}`);
            return null;
        }
    }
    static getSaveData(slotNumber) {
        try {
            const saveData = localStorage.getItem(`${this.SAVE_KEY_PREFIX}${slotNumber}`);
            if (!saveData)
                return null;
            return JSON.parse(saveData);
        }
        catch (error) {
            console.error('Failed to read save data:', error);
            return null;
        }
    }
    static deleteSave(slotNumber) {
        localStorage.removeItem(`${this.SAVE_KEY_PREFIX}${slotNumber}`);
    }
    static hasSave(slotNumber) {
        return localStorage.getItem(`${this.SAVE_KEY_PREFIX}${slotNumber}`) !== null;
    }
}
//# sourceMappingURL=SaveLoadManager.js.map