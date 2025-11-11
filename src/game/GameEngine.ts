// /src/game/GameEngine.ts

import { GameState, GameDate } from '../types.js';

export class GameEngine {
    private gameState: GameState;
    private lastTick: number;
    private onUpdateCallback: () => void = () => {};
    private isRunning: boolean = false;

    constructor(initialGameState: GameState) {
        this.gameState = initialGameState;
        this.lastTick = Date.now();
    }

    public startGameLoop(onUpdate: () => void): void {
        this.onUpdateCallback = onUpdate;
        this.lastTick = Date.now();
        this.isRunning = true;
        
        // Don't start the loop if the game is paused
        if (!this.gameState.isPaused) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    public stopGameLoop(): void {
        this.isRunning = false;
    }

    private gameLoop(): void {
        if (!this.isRunning) return;

        if (!this.gameState.isPaused) {
            const now = Date.now();
            const delta = now - this.lastTick;
            
            // 1000ms / 60fps = 16.67ms per frame
            // We adjust this by game speed.
            const timePerTick = (1000 / 60) / this.gameState.gameSpeed;

            if (delta > timePerTick) {
                this.lastTick = now - (delta % timePerTick);
                this.updateGameDate();
                this.onUpdateCallback();
            }
        } else {
            // If paused, just reset the lastTick so delta doesn't accumulate
            this.lastTick = Date.now();
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    private updateGameDate(): void {
        const date = this.gameState.currentDate;
        
        date.hour++;
        
        if (date.hour >= 24) {
            date.hour = 0;
            date.day++;
            
            const daysInMonth = this.getDaysInMonth(date.year, date.month);
            
            if (date.day > daysInMonth) {
                date.day = 1;
                date.month++;
                
                if (date.month > 12) {
                    date.month = 1;
                    date.year++;
                }
            }
        }
    }

    private getDaysInMonth(year: number, month: number): number {
        return new Date(year, month, 0).getDate();
    }
    
    public getCurrentMonth(): number {
        return this.gameState.currentDate.month;
    }

    public togglePause(): void {
        this.gameState.isPaused = !this.gameState.isPaused;
        
        // If we are un-pausing, reset lastTick and start the loop
        if (!this.gameState.isPaused && this.isRunning) {
            this.lastTick = Date.now();
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    public setGameSpeed(speed: number): void {
        this.gameState.gameSpeed = speed;
    }

    public getGameState(): GameState {
        return this.gameState;
    }

    // --- NEW METHOD ---
    public setGameState(newGameState: GameState): void {
        this.gameState = newGameState;
    }
}