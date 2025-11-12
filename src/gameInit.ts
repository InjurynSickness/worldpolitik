// /src/gameInit.ts
// This file handles the complete game initialization including canvas, rendering, and game loop

import { GameEngine } from './game/GameEngine.js';
import { GameStateInitializer } from './game/GameStateInitializer.js';
import { UIManager } from './ui/UIManager.js';
import { SaveLoadManager } from './game/SaveLoadManager.js';
import { ProvinceMap } from './provinceMap.js';
import { provinceToCountryMap } from './provinceAssignments.js';
import { countryData } from './countryData.js';

export function initializeFullGame(): void {
    try {
        console.log('Initializing full game...');

        // 1. Initialize game state
        const gameState = GameStateInitializer.initializeGameState();
        console.log('Game state initialized with', gameState.countries.size, 'countries');

        // 2. Create game engine
        const gameEngine = new GameEngine(gameState);
        console.log('Game engine created');

        // 3. Create game container (if it doesn't exist)
        let gameContainer = document.getElementById('game-container');
        if (!gameContainer) {
            gameContainer = document.createElement('div');
            gameContainer.id = 'game-container';
            gameContainer.style.position = 'fixed';
            gameContainer.style.top = '0';
            gameContainer.style.left = '0';
            gameContainer.style.width = '100%';
            gameContainer.style.height = '100%';
            gameContainer.style.zIndex = '1';
            gameContainer.style.backgroundColor = '#1a1a1a';
            document.body.appendChild(gameContainer);
        }
        gameContainer.style.display = 'block';
        console.log('Game container created');

        // 4. Create UI manager first (needed for province map callback)
        let uiManager: UIManager;

        // 5. Create the province map with full rendering
        const provinceMap = new ProvinceMap(
            gameContainer,
            (countryId: string) => {
                const gameState = gameEngine.getGameState();
                gameState.selectedCountryId = countryId;
                if (uiManager) {
                    uiManager.updateCountryInfo();
                }
            },
            () => {
                // Called when map is ready - this will be used by App.tsx
                console.log('Map is ready callback triggered');
                if ((window as any).onMapReady) {
                    (window as any).onMapReady();
                }
            }
        );
        console.log('Province map created, loading assets...');

        // 6. Set up the map with country data
        provinceMap.updateCountries(gameState.countries, countryData);
        provinceMap.setProvinceOwnerMap(provinceToCountryMap);
        console.log('Map configured with countries and province assignments');

        // 7. Initialize UI manager
    uiManager = new UIManager(
        () => gameEngine.getGameState(),
        (slot: number) => {
            SaveLoadManager.saveGame(gameEngine.getGameState(), slot);
            uiManager.showNotification(`Game saved to slot ${slot}`, 'success');
        },
        (slot: number) => {
            const loadedState = SaveLoadManager.loadGame(slot);
            if (loadedState) {
                // Reload the game with the loaded state
                const newEngine = new GameEngine(loadedState);
                (window as any).gameEngine = newEngine;
                newEngine.startGameLoop(() => {
                    provinceMap.forceRender();
                    uiManager.updateDisplay();
                });
                uiManager.showNotification(`Game loaded from slot ${slot}`, 'success');
            }
        },
        () => { /* Test event handler */ }
    );

        // 8. Setup UI elements (create them if they don't exist)
        createGameUI();

        // 9. Setup UI callbacks
        uiManager.setupUI(
            () => {
                gameEngine.togglePause();
                uiManager.updatePauseButton(gameEngine.getGameState().isPaused);
            },
            (speed: number) => {
                gameEngine.setGameSpeed(speed);
                uiManager.updateSpeedButtons(speed);
            },
            () => {
                // Toggle editor mode
                const currentMode = provinceMap ? !provinceMap.isMapReady() : false;
                if (provinceMap) {
                    provinceMap.setEditorMode(!currentMode);
                }
            },
            () => {
                // Return to main menu
                gameEngine.stopGameLoop();
                gameContainer!.style.display = 'none';
                const gameUI = document.getElementById('gameUI');
                if (gameUI) gameUI.style.display = 'none';
                const root = document.getElementById('root');
                if (root) root.style.display = 'block';
                // Clean up the province map
                if (provinceMap) {
                    provinceMap.destroy();
                }
            },
            (provinceId: string) => {
                // Province selection handler
                if (provinceMap && provinceId) {
                    provinceMap.setSelectedCountry(provinceId);
                }
                uiManager.updateCountryInfo(provinceId, provinceToCountryMap);
            }
        );
        console.log('UI manager setup complete');

        // 10. Start game loop
        gameEngine.startGameLoop(() => {
            if (provinceMap.isMapReady()) {
                provinceMap.forceRender();
            }
            uiManager.updateDisplay();
        });
        console.log('Game loop started');

        // 11. Initial UI update
        uiManager.updateDisplay();
        uiManager.updatePauseButton(gameState.isPaused);
        uiManager.updateSpeedButtons(gameState.gameSpeed);

        // 12. Expose game engine, province map, and UI manager globally
        (window as any).gameEngine = gameEngine;
        (window as any).provinceMap = provinceMap;
        (window as any).uiManager = uiManager;

        console.log('Game initialization complete! Map will render when assets are loaded.');
    } catch (error) {
        console.error('FATAL ERROR in initializeFullGame:', error);
        console.error('Error stack:', (error as Error).stack);
        throw error; // Re-throw so the caller can handle it
    }
}

function createGameUI(): void {
    // Check if UI already exists
    let gameUI = document.getElementById('gameUI');
    if (gameUI) {
        gameUI.style.display = 'block';
        return;
    }

    // Create game UI container
    gameUI = document.createElement('div');
    gameUI.id = 'gameUI';
    gameUI.style.position = 'fixed';
    gameUI.style.top = '0';
    gameUI.style.left = '0';
    gameUI.style.width = '100%';
    gameUI.style.height = '100%';
    gameUI.style.pointerEvents = 'none';
    gameUI.style.zIndex = '10';
    gameUI.style.display = 'block';

    gameUI.innerHTML = `
        <!-- Top Bar -->
        <div id="topBar" style="position: absolute; top: 0; left: 0; right: 0; height: 50px; background: rgba(0,0,0,0.8); display: flex; align-items: center; padding: 0 20px; pointer-events: auto;">
            <div style="color: #ffd700; font-size: 18px; font-weight: bold; margin-right: 30px;">
                <span id="gameDate">Jan 1, 2000</span>
            </div>
            <div style="color: #fff; font-size: 14px; margin-right: 20px;">
                Countries: <span id="totalCountries">0</span>
            </div>
            <div style="color: #fff; font-size: 14px; margin-right: 20px;">
                World GDP: <span id="worldGDP">$0T</span>
            </div>
            <div style="color: #fff; font-size: 14px; margin-right: 20px;">
                Conflicts: <span id="activeConflicts">0</span>
            </div>
            <div style="flex: 1;"></div>
            <button id="mainMenuBtn" style="padding: 8px 16px; background: #d4af37; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Main Menu</button>
        </div>

        <!-- Control Panel -->
        <div id="controlPanel" style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.9); padding: 15px; border-radius: 8px; display: flex; gap: 10px; align-items: center; pointer-events: auto;">
            <button id="playBtn" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">▶️ Play</button>
            <div style="display: flex; gap: 5px;">
                <button id="speed1" class="speed-cube" style="padding: 8px 12px; background: #555; color: white; border: none; border-radius: 4px; cursor: pointer;">1x</button>
                <button id="speed2" class="speed-cube" style="padding: 8px 12px; background: #555; color: white; border: none; border-radius: 4px; cursor: pointer;">2x</button>
                <button id="speed3" class="speed-cube" style="padding: 8px 12px; background: #555; color: white; border: none; border-radius: 4px; cursor: pointer;">3x</button>
                <button id="speed4" class="speed-cube" style="padding: 8px 12px; background: #555; color: white; border: none; border-radius: 4px; cursor: pointer;">4x</button>
                <button id="speed5" class="speed-cube" style="padding: 8px 12px; background: #555; color: white; border: none; border-radius: 4px; cursor: pointer;">5x</button>
            </div>
        </div>

        <!-- Country Info Panel -->
        <div id="countryInfo" style="position: absolute; top: 60px; right: 20px; width: 300px; background: rgba(0,0,0,0.9); padding: 20px; border-radius: 8px; color: white; pointer-events: auto; max-height: 600px; overflow-y: auto;">
            <h2>Select a Country</h2>
            <p style="color: #888;">Click on the map to view country information</p>
        </div>
    `;

    document.body.appendChild(gameUI);

    // Add CSS for active buttons
    const style = document.createElement('style');
    style.innerHTML = `
        #playBtn.active {
            background: #dc3545 !important;
        }
        .speed-cube.active {
            background: #d4af37 !important;
            color: #000 !important;
        }
        .stat-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #333;
        }
        .stat-label {
            color: #888;
        }
        .stat-value {
            color: #ffd700;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);
}
