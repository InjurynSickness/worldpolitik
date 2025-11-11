import { GameState, GameDate } from '../types.js';
export declare class UIManager {
    private getGameState;
    private onSave;
    private onLoad;
    private onTestEvent;
    private lastSelectedProvinceId;
    constructor(getGameState: () => GameState, onSave: (slot: number) => void, onLoad: (slot: number) => void, onTestEvent: () => void);
    setupUI(onTogglePause: () => void, onSetSpeed: (speed: number) => void, onToggleEditor: () => void, onMainMenu: () => void, onSelectProvince: (provinceId: string) => void): void;
    private setupKeyboardShortcuts;
    private closeAllModals;
    updateDisplay(): void;
    updateCountryInfo(provinceId?: string, provinceOwnerMap?: Map<string, string>): void;
    updatePauseButton(isPaused: boolean): void;
    updateSpeedButtons(speed: number): void;
    private formatGovernmentType;
    formatGameDate(gameDate: GameDate, includeTime?: boolean): string;
    showNotification(message: string, type?: 'success' | 'error' | 'info'): void;
}
