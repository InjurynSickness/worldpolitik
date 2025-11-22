// Game loop - drives all simulation and time progression
// Handles pause, speed controls, and tick-based updates

import { eventBus } from './EventBus.js';
import { timeSystem } from './TimeSystem.js';
import { logger } from '../utils/Logger.js';

export enum GameSpeed {
    PAUSED = 0,
    SLOW = 1,      // 1 day per 2 seconds
    NORMAL = 2,    // 1 day per 1 second
    FAST = 3,      // 2 days per 1 second
    VERY_FAST = 4  // 4 days per 1 second
}

export class GameLoop {
    private static instance: GameLoop;

    private running = false;
    private speed: GameSpeed = GameSpeed.PAUSED;
    private lastTickTime = 0;
    private animationFrameId: number | null = null;

    // Tick rate configuration
    private readonly BASE_TICK_RATE = 1000; // 1 second in milliseconds
    private tickAccumulator = 0;

    // Keyboard event handler reference for cleanup
    private keyboardHandler: ((e: KeyboardEvent) => void) | null = null;

    private constructor() {
        logger.info('GameLoop', 'Game loop initialized');
        this.setupKeyboardControls();
    }

    public static getInstance(): GameLoop {
        if (!GameLoop.instance) {
            GameLoop.instance = new GameLoop();
        }
        return GameLoop.instance;
    }

    /**
     * Start the game loop
     */
    public start(): void {
        if (this.running) {
            logger.warn('GameLoop', 'Game loop already running');
            return;
        }

        this.running = true;
        this.lastTickTime = performance.now();
        logger.info('GameLoop', 'Game loop started');
        eventBus.emit('game_loop_started');

        this.loop();
    }

    /**
     * Stop the game loop
     */
    public stop(): void {
        if (!this.running) return;

        this.running = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        logger.info('GameLoop', 'Game loop stopped');
        eventBus.emit('game_loop_stopped');
    }

    /**
     * Main game loop
     */
    private loop = (): void => {
        if (!this.running) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTickTime;
        this.lastTickTime = currentTime;

        if (this.speed !== GameSpeed.PAUSED) {
            this.update(deltaTime);
        }

        this.animationFrameId = requestAnimationFrame(this.loop);
    };

    /**
     * Update game logic
     */
    private update(deltaTime: number): void {
        // Accumulate time based on game speed
        const tickInterval = this.getTickInterval();
        this.tickAccumulator += deltaTime;

        // Process ticks
        while (this.tickAccumulator >= tickInterval) {
            this.tick();
            this.tickAccumulator -= tickInterval;
        }
    }

    /**
     * Single game tick - advances one day
     */
    private tick(): void {
        // Advance time by one day
        timeSystem.advanceDay();

        // Emit tick event for other systems to update
        eventBus.emit('game_tick', {
            date: timeSystem.getDate(),
            speed: this.speed
        });
    }

    /**
     * Get tick interval in milliseconds based on current speed
     */
    private getTickInterval(): number {
        switch (this.speed) {
            case GameSpeed.PAUSED:
                return Infinity;
            case GameSpeed.SLOW:
                return this.BASE_TICK_RATE * 2;  // 2 seconds per day
            case GameSpeed.NORMAL:
                return this.BASE_TICK_RATE;      // 1 second per day
            case GameSpeed.FAST:
                return this.BASE_TICK_RATE / 2;  // 0.5 seconds per day
            case GameSpeed.VERY_FAST:
                return this.BASE_TICK_RATE / 4;  // 0.25 seconds per day
            default:
                return this.BASE_TICK_RATE;
        }
    }

    /**
     * Set game speed
     */
    public setSpeed(speed: GameSpeed): void {
        const oldSpeed = this.speed;
        this.speed = speed;

        logger.info('GameLoop', `Speed changed: ${GameSpeed[oldSpeed]} → ${GameSpeed[speed]}`);
        eventBus.emit('speed_changed', { oldSpeed, newSpeed: speed });
    }

    /**
     * Pause the game
     */
    public pause(): void {
        this.setSpeed(GameSpeed.PAUSED);
    }

    /**
     * Unpause (resume at normal speed)
     */
    public unpause(): void {
        if (this.speed === GameSpeed.PAUSED) {
            this.setSpeed(GameSpeed.NORMAL);
        }
    }

    /**
     * Toggle pause
     */
    public togglePause(): void {
        if (this.speed === GameSpeed.PAUSED) {
            this.unpause();
        } else {
            this.pause();
        }
    }

    /**
     * Increase speed
     */
    public increaseSpeed(): void {
        if (this.speed < GameSpeed.VERY_FAST) {
            this.setSpeed(this.speed + 1);
        }
    }

    /**
     * Decrease speed
     */
    public decreaseSpeed(): void {
        if (this.speed > GameSpeed.PAUSED) {
            this.setSpeed(this.speed - 1);
        }
    }

    /**
     * Get current speed
     */
    public getSpeed(): GameSpeed {
        return this.speed;
    }

    /**
     * Check if game is paused
     */
    public isPaused(): boolean {
        return this.speed === GameSpeed.PAUSED;
    }

    /**
     * Setup keyboard controls for speed
     */
    private setupKeyboardControls(): void {
        this.keyboardHandler = (e: KeyboardEvent) => {
            // Space = pause/unpause
            if (e.code === 'Space' && !e.repeat) {
                e.preventDefault();
                this.togglePause();
            }
            // + = increase speed
            else if (e.code === 'Equal' || e.code === 'NumpadAdd') {
                e.preventDefault();
                this.increaseSpeed();
            }
            // - = decrease speed
            else if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
                e.preventDefault();
                this.decreaseSpeed();
            }
            // 1-4 = set specific speed
            else if (e.code >= 'Digit1' && e.code <= 'Digit4') {
                e.preventDefault();
                const speedNum = parseInt(e.code.slice(-1));
                this.setSpeed(speedNum as GameSpeed);
            }
        };

        window.addEventListener('keydown', this.keyboardHandler);
        logger.debug('GameLoop', 'Keyboard controls setup: Space=pause, +/-=speed, 1-4=specific speed');
    }

    /**
     * Clean up resources (remove event listeners)
     */
    public cleanup(): void {
        this.stop();

        if (this.keyboardHandler) {
            window.removeEventListener('keydown', this.keyboardHandler);
            this.keyboardHandler = null;
            logger.debug('GameLoop', 'Keyboard controls cleaned up');
        }
    }
}

// Export singleton instance
export const gameLoop = GameLoop.getInstance();
