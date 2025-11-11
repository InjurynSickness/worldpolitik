import { GameDate } from '../types.js';
export declare class SaveLoadUI {
    private formatGameDate;
    constructor(formatGameDate: (date: GameDate, includeTime: boolean) => string);
    showSaveDialog(onSave: (slot: number) => void): void;
    showLoadDialog(onLoad: (slot: number) => void): void;
    closeDialog(): void;
    private createSaveSlot;
}
