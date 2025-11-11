import { GameState } from '../types.js';
export declare class GameEngine {
    private gameState;
    private lastTick;
    private onUpdateCallback;
    private isRunning;
    constructor(initialGameState: GameState);
    startGameLoop(onUpdate: () => void): void;
    stopGameLoop(): void;
    private gameLoop;
    private updateGameDate;
    private getDaysInMonth;
    getCurrentMonth(): number;
    togglePause(): void;
    setGameSpeed(speed: number): void;
    getGameState(): GameState;
    setGameState(newGameState: GameState): void;
}
