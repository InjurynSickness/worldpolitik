// /src/game/GameEngine.ts
export class GameEngine {
    gameState;
    lastTick;
    onUpdateCallback = () => { };
    isRunning = false;
    constructor(initialGameState) {
        this.gameState = initialGameState;
        this.lastTick = Date.now();
    }
    startGameLoop(onUpdate) {
        this.onUpdateCallback = onUpdate;
        this.lastTick = Date.now();
        this.isRunning = true;
        // Don't start the loop if the game is paused
        if (!this.gameState.isPaused) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    stopGameLoop() {
        this.isRunning = false;
    }
    gameLoop() {
        if (!this.isRunning)
            return;
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
        }
        else {
            // If paused, just reset the lastTick so delta doesn't accumulate
            this.lastTick = Date.now();
        }
        requestAnimationFrame(() => this.gameLoop());
    }
    updateGameDate() {
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
    getDaysInMonth(year, month) {
        return new Date(year, month, 0).getDate();
    }
    getCurrentMonth() {
        return this.gameState.currentDate.month;
    }
    togglePause() {
        this.gameState.isPaused = !this.gameState.isPaused;
        // If we are un-pausing, reset lastTick and start the loop
        if (!this.gameState.isPaused && this.isRunning) {
            this.lastTick = Date.now();
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    setGameSpeed(speed) {
        this.gameState.gameSpeed = speed;
    }
    getGameState() {
        return this.gameState;
    }
    // --- NEW METHOD ---
    setGameState(newGameState) {
        this.gameState = newGameState;
    }
}
//# sourceMappingURL=GameEngine.js.map