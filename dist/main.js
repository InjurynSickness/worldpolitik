import { jsx as _jsx } from "react/jsx-runtime";
import { ProvinceMap } from './provinceMap.js';
import { provinceToCountryMap } from './provinceAssignments.js';
import { countryData } from './countryData.js';
// import { MainMenu } from './mainMenu.js'; // <-- REMOVED
import { LoadingScreen } from './loadingScreen.js';
import { GameEngine } from './game/GameEngine.js';
import { GameStateInitializer } from './game/GameStateInitializer.js';
import { SaveLoadManager } from './game/SaveLoadManager.js';
import { UIManager } from './ui/UIManager.js';
import { SaveLoadUI } from './ui/SaveLoadUI.js';
import { EventManager } from './events/EventManager.js';
// --- NEW REACT IMPORTS ---
import React from 'react';
import { createRoot } from 'react-dom/client';
// Import from .js, as TS will resolve this to the compiled output
import App from './menu-ui/App.js';
// --- END NEW IMPORTS ---
class GameCoordinator {
    gameState;
    mapRenderer;
    gameEngine;
    uiManager;
    saveLoadUI;
    eventManager;
    // --- REACT STATE ---
    reactRoot = null;
    menuContainer = null;
    // ---
    // private mainMenu: MainMenu | null = null; // <-- REMOVED
    loadingScreen = null;
    isGameInitialized = false;
    lastSaveMonth = 1;
    lastSelectedProvinceId = null;
    isEditorMode = false;
    constructor() {
        this.eventManager = new EventManager();
        this.showReactMainMenu(); // <-- CHANGED
    }
    showReactMainMenu() {
        // Ensure old game UI is hidden
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.style.display = 'none';
        }
        // Create a container for the React app
        this.menuContainer = document.createElement('div');
        this.menuContainer.id = "react-menu-root";
        this.menuContainer.className = "react-menu-container"; // Add a class for styling
        document.body.appendChild(this.menuContainer);
        this.reactRoot = createRoot(this.menuContainer);
        this.reactRoot.render(_jsx(React.StrictMode, { children: _jsx(App, { gameCoordinator: this }) }));
    }
    unmountReactMenu() {
        if (this.reactRoot) {
            this.reactRoot.unmount();
        }
        if (this.menuContainer) {
            document.body.removeChild(this.menuContainer);
            this.menuContainer = null;
        }
    }
    // --- PUBLIC API FOR REACT MENU ---
    async startNewGame(countryId) {
        this.unmountReactMenu();
        // Pass countryId to the init function
        await this.initializeGame(false, 0, countryId);
    }
    async continueGame() {
        this.unmountReactMenu();
        await this.initializeGame(true, 0); // Load slot 0 (autosave)
    }
    async loadGameFromMenu(slotNumber) {
        this.unmountReactMenu();
        await this.initializeGame(true, slotNumber);
    }
    getSaveSlotsData() {
        const slots = [];
        // Check 6 slots (0 = auto, 1-5 = manual)
        for (let i = 0; i <= 5; i++) {
            const data = SaveLoadManager.getSaveData(i);
            if (data) {
                // Try to find the country data to make the save slot more descriptive
                const country = countryData.get(data.gameState.selectedCountryId || "");
                slots.push({
                    id: i.toString(),
                    name: i === 0 ? "autosave" : `Save Slot ${i}`,
                    date: new Date(data.saveTime).toLocaleString(), // Format date
                    country: country ? country.name : "Unknown",
                    flagColor: country ? country.color : "#555555"
                });
            }
        }
        return slots;
    }
    deleteSaveSlot(slotNumber) {
        SaveLoadManager.deleteSave(slotNumber);
    }
    hasAutoSave() {
        return SaveLoadManager.hasSave(0);
    }
    // --- END PUBLIC API ---
    async initializeGame(loadSave = false, slotNumber = 0, selectedCountryId = null) {
        console.log("Starting initializeGame...");
        const container = document.body;
        this.loadingScreen = new LoadingScreen(container);
        this.loadingScreen.show();
        await this.delay(100);
        console.log("Initializing game state...");
        this.loadingScreen.updateProgress(10, 'Initializing game state...');
        await this.delay(200);
        // --- REFACTORED LOGIC ---
        let initialState;
        if (loadSave) {
            const loadedState = SaveLoadManager.loadGame(slotNumber);
            if (loadedState) {
                initialState = loadedState;
                console.log("Loaded save state for slot", slotNumber);
            }
            else {
                // Failed to load save, start a new game
                console.warn(`Failed to load save slot ${slotNumber}, starting new game.`);
                initialState = GameStateInitializer.initializeGameState();
                loadSave = false; // Treat as new game
            }
        }
        else {
            // Brand new game
            initialState = GameStateInitializer.initializeGameState();
            if (selectedCountryId) {
                initialState.selectedCountryId = selectedCountryId;
            }
        }
        this.gameState = initialState;
        this.gameEngine = new GameEngine(this.gameState);
        // --- END REFACTORED LOGIC ---
        console.log("Game state initialized");
        this.loadingScreen.updateProgress(25, 'Loading map assets...');
        await this.delay(300);
        console.log("Getting map container...");
        const mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) {
            throw new Error('mapContainer element not found');
        }
        console.log("Showing game container...");
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.style.display = 'flex';
            gameContainer.style.visibility = 'hidden';
        }
        console.log("Clearing old canvases...");
        while (mapContainer.firstChild) {
            mapContainer.removeChild(mapContainer.firstChild);
        }
        console.log("Creating ProvinceMap...");
        this.mapRenderer = new ProvinceMap(mapContainer, (provinceId) => this.selectProvince(provinceId));
        console.log("ProvinceMap created");
        this.loadingScreen.updateProgress(40, 'Loading map textures...');
        console.log("Waiting for map ready...");
        await this.waitForMapReady();
        console.log("Map is ready!");
        this.loadingScreen.updateProgress(55, 'Loading countries...');
        await this.delay(300);
        console.log("Updating countries...");
        this.mapRenderer.updateCountries(this.gameState.countries, countryData);
        this.mapRenderer.setProvinceOwnerMap(provinceToCountryMap);
        console.log("Countries updated");
        this.loadingScreen.updateProgress(65, 'Calculating country labels...');
        console.log("Calculating country labels...");
        await this.mapRenderer.calculateLabels();
        console.log("Country labels calculated");
        this.loadingScreen.updateProgress(75, 'Setting up interface...');
        await this.delay(200);
        console.log("Setting up UI...");
        this.setupManagers();
        console.log("UI setup complete");
        // --- REFACTORED: This logic is now part of the initial state setup ---
        // if (loadSave) {
        //     this.loadingScreen.updateProgress(85, `Loading saved game...`);
        //     await this.delay(300);
        //     console.log("Loading save...");
        //     this.loadGame(slotNumber); // This just applies the loaded state
        //     console.log("Save loaded");
        // }
        this.loadingScreen.updateProgress(92, 'Finalizing...');
        await this.delay(200);
        console.log("Starting game loop...");
        this.gameEngine.startGameLoop(() => this.onGameUpdate());
        console.log("Updating display...");
        this.uiManager.updateDisplay(); // Update UI with loaded state
        console.log("Force rendering map...");
        this.mapRenderer.forceRender();
        this.loadingScreen.updateProgress(100, 'Ready!');
        await this.delay(300);
        console.log("Hiding loading screen...");
        this.loadingScreen.hide();
        await this.delay(500);
        console.log("Making game visible...");
        if (gameContainer) {
            gameContainer.style.visibility = 'visible';
        }
        await this.delay(100);
        this.mapRenderer.forceRender();
        this.isGameInitialized = true;
        console.log("Game initialization complete!");
    }
    setupManagers() {
        this.uiManager = new UIManager(() => this.gameState, (slot) => this.saveGame(slot), (slot) => this.loadGame(slot), // This is for in-game loading
        () => this.triggerTestEvent());
        this.saveLoadUI = new SaveLoadUI((date, includeTime) => this.uiManager.formatGameDate(date, includeTime));
        this.uiManager.setupUI(() => this.togglePause(), (speed) => this.setGameSpeed(speed), () => this.toggleEditor(), () => this.returnToMainMenu(), (provinceId) => this.selectProvince(provinceId));
        this.setupEditorUI();
    }
    setupEditorUI() {
        const editorPanel = document.getElementById('editorPanel');
        const palette = document.getElementById('countryPalette');
        const exportBtn = document.getElementById('exportBtn');
        const exportModal = document.getElementById('exportModal');
        const exportTextArea = document.getElementById('exportTextArea');
        const closeExportModal = document.getElementById('closeExportModal');
        if (!editorPanel || !palette) {
            console.warn('Editor UI elements not found, skipping editor setup');
            return;
        }
        // Check if buttons are already added to avoid duplicates on main menu return
        if (palette.querySelector('.palette-button')) {
            return;
        }
        const clearPaintBtn = document.createElement('button');
        clearPaintBtn.className = 'palette-button';
        clearPaintBtn.textContent = "Clear Paint Tool (Right-Click to unclaim)";
        clearPaintBtn.style.borderLeft = '5px solid #ff0000';
        clearPaintBtn.addEventListener('click', () => {
            this.setPaintTool(null);
        });
        palette.appendChild(clearPaintBtn);
        for (const [id, data] of countryData.entries()) {
            const btn = document.createElement('button');
            btn.className = 'palette-button';
            btn.textContent = data.name;
            btn.dataset.countryId = id;
            btn.style.borderLeft = `5px solid ${data.color}`;
            btn.addEventListener('click', () => {
                this.setPaintTool(id);
            });
            palette.appendChild(btn);
        }
        if (exportBtn && exportModal && exportTextArea && closeExportModal) {
            exportBtn.addEventListener('click', () => {
                exportTextArea.value = this.mapRenderer.exportMapData();
                exportModal.style.display = 'block';
            });
            closeExportModal.addEventListener('click', () => {
                exportModal.style.display = 'none';
            });
        }
        const autoAssignBtn = document.getElementById('autoAssignBtn');
        if (autoAssignBtn) {
            autoAssignBtn.addEventListener('click', () => {
                this.mapRenderer.importAndAutoAssignCSV();
            });
        }
        console.log("Editor UI setup completed successfully");
    }
    toggleEditor() {
        this.isEditorMode = !this.isEditorMode;
        const editorPanel = document.getElementById('editorPanel');
        const toggleBtn = document.getElementById('toggleEditorBtn');
        if (editorPanel) {
            editorPanel.classList.toggle('visible', this.isEditorMode);
        }
        this.mapRenderer.setEditorMode(this.isEditorMode);
        if (toggleBtn) {
            if (this.isEditorMode) {
                toggleBtn.textContent = 'Hide Palette';
                toggleBtn.style.backgroundColor = '#28a745';
            }
            else {
                toggleBtn.textContent = 'Show Palette';
                toggleBtn.style.backgroundColor = '#6c757d';
                this.setPaintTool(null);
            }
        }
    }
    setPaintTool(countryId) {
        this.mapRenderer.setPaintCountry(countryId);
        const paintDisplay = document.getElementById('paintCountryDisplay');
        document.querySelectorAll('.palette-button').forEach(b => b.classList.remove('selected'));
        if (countryId) {
            const country = countryData.get(countryId);
            paintDisplay.textContent = country ? country.name : 'Unknown';
            const button = document.querySelector(`.palette-button[data-country-id="${countryId}"]`);
            if (button) {
                button.classList.add('selected');
            }
        }
        else {
            paintDisplay.textContent = 'None';
        }
    }
    async waitForMapReady() {
        return new Promise((resolve) => {
            const checkReady = () => {
                if (this.mapRenderer.isMapReady()) {
                    resolve();
                }
                else {
                    setTimeout(checkReady, 100);
                }
            };
            checkReady();
        });
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    returnToMainMenu() {
        if (!confirm('Return to main menu? Your progress will be auto-saved.')) {
            return;
        }
        this.saveGame(0); // Autosave
        this.isGameInitialized = false; // Mark game as uninitialized
        this.gameEngine.stopGameLoop();
        if (this.mapRenderer && typeof this.mapRenderer.destroy === 'function') {
            this.mapRenderer.destroy();
        }
        this.showReactMainMenu();
    }
    togglePause() {
        this.gameEngine.togglePause();
        this.uiManager.updatePauseButton(this.gameState.isPaused);
    }
    setGameSpeed(speed) {
        this.gameEngine.setGameSpeed(speed);
        this.uiManager.updateSpeedButtons(speed);
    }
    selectProvince(provinceId) {
        let countryId = provinceToCountryMap.get(provinceId) || null;
        this.gameState.selectedCountryId = countryId;
        this.lastSelectedProvinceId = provinceId;
        this.mapRenderer.setSelectedCountry(provinceId);
        this.uiManager.updateCountryInfo(provinceId, provinceToCountryMap);
    }
    onGameUpdate() {
        const currentMonth = this.gameEngine.getCurrentMonth();
        if (currentMonth !== this.lastSaveMonth) {
            this.autoSave();
            this.lastSaveMonth = currentMonth;
        }
        this.uiManager.updateDisplay();
    }
    saveGame(slotNumber) {
        const success = SaveLoadManager.saveGame(this.gameState, slotNumber);
        if (success && slotNumber > 0) {
            this.uiManager.showNotification(`Game saved to slot ${slotNumber}`, 'success');
        }
        else if (!success) {
            this.uiManager.showNotification('Failed to save game', 'error');
        }
    }
    /**
     * This method is for IN-GAME loading.
     * For menu loading, see initializeGame()
     */
    loadGame(slotNumber) {
        const loadedState = SaveLoadManager.loadGame(slotNumber);
        if (!loadedState) {
            if (slotNumber > 0) {
                this.uiManager.showNotification(`Save slot ${slotNumber} is empty`, 'info');
            }
            return;
        }
        // --- REFACTORED: Just apply the state ---
        this.gameState = loadedState;
        this.gameEngine.setGameState(this.gameState); // <-- FIXED
        this.lastSaveMonth = this.gameState.currentDate.month;
        this.mapRenderer.updateCountries(this.gameState.countries, countryData);
        this.mapRenderer.setSelectedCountry(null);
        this.gameEngine.setGameSpeed(this.gameState.gameSpeed);
        this.uiManager.updateSpeedButtons(this.gameState.gameSpeed);
        this.uiManager.updatePauseButton(this.gameState.isPaused);
        this.uiManager.updateDisplay();
        if (slotNumber > 0) {
            this.uiManager.showNotification(`Game loaded from slot ${slotNumber}`, 'success');
        }
    }
    autoSave() {
        this.saveGame(0);
    }
    showSaveDialog() {
        this.saveLoadUI.showSaveDialog((slot) => this.saveGame(slot));
    }
    showLoadDialog() {
        this.saveLoadUI.showLoadDialog((slot) => this.loadGame(slot));
    }
    closeSaveLoadDialog() {
        this.saveLoadUI.closeDialog();
    }
    triggerTestEvent() {
        if (!this.gameState.selectedCountryId) {
            this.uiManager.showNotification('Please select a country first', 'error');
            return;
        }
        const country = this.gameState.countries.get(this.gameState.selectedCountryId);
        if (!country)
            return;
        if (country.gdp === 0) {
            this.uiManager.showNotification('This nation is not a major power and cannot trigger events.', 'info');
            return;
        }
        const event = this.eventManager.createTestEvent(country, (msg, type) => this.uiManager.showNotification(msg, type));
        this.eventManager.showSimpleEventPopup(event, country, () => {
            this.uiManager.updateCountryInfo(this.lastSelectedProvinceId || undefined, provinceToCountryMap);
        });
    }
}
document.addEventListener('DOMContentLoaded', () => {
    try {
        const coordinator = new GameCoordinator();
        window.gameEngine = coordinator;
    }
    catch (error) {
        console.error("Failed to initialize game:", error);
        document.body.innerHTML = `<div style="color: red; padding: 20px;">
            <h1>Critical Error</h1>
            <p>Failed to initialize game. Check console (F12) for details.</p>
            <pre>${error.message}</pre>
            <pre>${error.stack}</pre>
        </div>`;
    }
});
//# sourceMappingURL=main.js.map