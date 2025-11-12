// /src/ui/UIManager.ts

import { GameState, GameDate, Country } from '../types.js';
import { countryData } from '../countryData.js';

export class UIManager {
    private lastSelectedProvinceId: string | null = null;

    constructor(
        private getGameState: () => GameState,
        private onSave: (slot: number) => void,
        private onLoad: (slot: number) => void,
        private onTestEvent: () => void
    ) {}

    public setupUI(
        onTogglePause: () => void,
        onSetSpeed: (speed: number) => void,
        onToggleEditor: () => void,
        onMainMenu: () => void,
        onSelectProvince: (provinceId: string) => void
    ): void {
        const playBtn = document.getElementById('playBtn');
        if (!playBtn) {
            console.warn('UI elements not found yet');
            return;
        }

        playBtn.addEventListener('click', onTogglePause);

        for (let i = 1; i <= 5; i++) {
            const speedBtn = document.getElementById(`speed${i}`);
            if (speedBtn) {
                speedBtn.addEventListener('click', () => onSetSpeed(i));
            }
        }
        
        const toggleEditorBtn = document.getElementById('toggleEditorBtn');
        if (toggleEditorBtn) {
            toggleEditorBtn.addEventListener('click', onToggleEditor);
        }

        const mainMenuBtn = document.getElementById('mainMenuBtn');
        if (mainMenuBtn) {
            mainMenuBtn.addEventListener('click', onMainMenu);
        }
        
        this.setupKeyboardShortcuts(onTogglePause, onSetSpeed, onSelectProvince);
        
        console.log("UI setup completed successfully");
    }

    private setupKeyboardShortcuts(
        onTogglePause: () => void,
        onSetSpeed: (speed: number) => void,
        onSelectProvince: (provinceId: string) => void
    ): void {
        document.addEventListener('keydown', (e) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (e.key === 'Escape') {
                this.closeAllModals();
                onSelectProvince('');
            }
            
            if (e.code === 'Space') {
                e.preventDefault();
                onTogglePause();
            }
            
            if (e.code >= 'Digit1' && e.code <= 'Digit5') {
                const speed = parseInt(e.code.replace('Digit', ''));
                if (speed >= 1 && speed <= 5) {
                    onSetSpeed(speed);
                }
            }
        });
    }

    private closeAllModals(): void {
        const saveLoadModal = document.getElementById('saveLoadModal');
        const eventModal = document.getElementById('eventModal');
        const exportModal = document.getElementById('exportModal');
        
        if (saveLoadModal) saveLoadModal.style.display = 'none';
        if (eventModal) eventModal.style.display = 'none';
        if (exportModal) exportModal.style.display = 'none';
    }

    public updateDisplay(): void {
        const gameState = this.getGameState();
        
        const dateElement = document.getElementById('gameDate');
        if (dateElement) {
            dateElement.textContent = this.formatGameDate(gameState.currentDate, true);
        }
        
        const totalCountries = gameState.countries.size;
        const worldGDP = Array.from(gameState.countries.values())
            .reduce((sum, country) => sum + (country.gdp ?? 0), 0);
        
        const totalCountriesEl = document.getElementById('totalCountries');
        const worldGDPEl = document.getElementById('worldGDP');
        const activeConflictsEl = document.getElementById('activeConflicts');
        
        if (totalCountriesEl) totalCountriesEl.textContent = totalCountries.toString();
        if (worldGDPEl) worldGDPEl.textContent = `$${worldGDP.toFixed(1)}T`;
        if (activeConflictsEl) activeConflictsEl.textContent = '0';
    }

    public updateCountryInfo(provinceId?: string, provinceOwnerMap?: Map<string, string>): void {
        const gameState = this.getGameState();
        const countryInfoDiv = document.getElementById('countryInfo');
        if (!countryInfoDiv) return;
        
        const countryId = gameState.selectedCountryId;
        const provId = provinceId || this.lastSelectedProvinceId;
        
        if (provinceId) {
            this.lastSelectedProvinceId = provinceId;
        }
        
        if (!countryId) {
            countryInfoDiv.innerHTML = `
                <h2>Select a Country</h2>
                <p style="color: #888;">Click on a province to view its information</p>
            `;
            if (provId && provinceOwnerMap) {
                const owner = provinceOwnerMap.get(provId);
                if (!owner) {
                    countryInfoDiv.innerHTML = `
                        <h2>Unclaimed Territory</h2>
                        <p style="color: #888;">Province ID: ${provId}</p>
                        <p style="color: #888;">This province has no defined owner.</p>
                    `;
                }
            }
            return;
        }

        const country = gameState.countries.get(countryId);
        if (!country) {
            const data = countryData.get(countryId);
            countryInfoDiv.innerHTML = `
                <h2>${data ? data.name : 'Unknown Nation'}</h2>
                <p style="color: #888;">No data available for this country.</p>
            `;
            return;
        }

        // Show info for ALL countries (not just majors)
        const alliance = country.alliances.length > 0
            ? gameState.alliances.get(country.alliances[0])?.name || 'None'
            : 'None';

        // Show different sections based on what data is available
        let economySection = '';
        if (country.gdp > 0 || country.population > 0) {
            economySection = `
                <h3>Economy</h3>
                ${country.gdp > 0 ? `<div class="stat-row">
                    <span class="stat-label">GDP:</span>
                    <span class="stat-value">$${country.gdp.toFixed(1)}T</span>
                </div>` : ''}
                ${country.gdpPerCapita > 0 ? `<div class="stat-row">
                    <span class="stat-label">GDP per Capita:</span>
                    <span class="stat-value">$${country.gdpPerCapita.toLocaleString()}</span>
                </div>` : ''}
                ${country.population > 0 ? `<div class="stat-row">
                    <span class="stat-label">Population:</span>
                    <span class="stat-value">${country.population.toFixed(1)}M</span>
                </div>` : ''}
            `;
        }

        countryInfoDiv.innerHTML = `
            <h2>${country.name}</h2>
            <p style="font-size: 11px; color: #d4af37; margin-top: -10px; font-weight: bold;">YOUR NATION</p>

            ${economySection}

            <h3>Politics</h3>
            <div class="stat-row">
                <span class="stat-label">Government:</span>
                <span class="stat-value">${this.formatGovernmentType(country.government)}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Political Power:</span>
                <span class="stat-value">${country.politicalPower.toFixed(1)} (+${(country.politicalPowerGain/24).toFixed(2)}/hr)</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Stability:</span>
                <span class="stat-value">${Math.round(country.stability)}%</span>
            </div>
            ${alliance !== 'None' ? `<div class="stat-row">
                <span class="stat-label">Alliance:</span>
                <span class="stat-value">${alliance}</span>
            </div>` : ''}

            <h3>Military</h3>
            <div class="stat-row">
                <span class="stat-label">Strength:</span>
                <span class="stat-value">${country.militaryStrength}</span>
            </div>
            ${country.militarySpending > 0 ? `<div class="stat-row">
                <span class="stat-label">Spending:</span>
                <span class="stat-value">$${country.militarySpending.toFixed(1)}B</span>
            </div>` : ''}
        `;
    }

    public updatePauseButton(isPaused: boolean): void {
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.textContent = isPaused ? '▶️ Play' : '⏸️ Pause';
            playBtn.classList.toggle('active', !isPaused);
        }
    }

    public updateSpeedButtons(speed: number): void {
        document.querySelectorAll('.speed-cube').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`speed${speed}`)?.classList.add('active');
    }

    private formatGovernmentType(gov: string): string {
        return gov.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    public formatGameDate(gameDate: GameDate, includeTime: boolean = false): string {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (!gameDate || typeof gameDate.month !== 'number' || gameDate.month < 1 || gameDate.month > 12) return "Invalid Date";
        let dateString = `${months[gameDate.month - 1]} ${gameDate.day}, ${gameDate.year}`;
        if (includeTime) {
            const hour24 = gameDate.hour || 0;
            const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
            const ampm = hour24 < 12 ? 'AM' : 'PM';
            const hourStr = hour12 < 10 ? `0${hour12}` : hour12.toString();
            dateString += ` - ${hourStr}:00 ${ampm}`;
        }
        return dateString;
    }

    public showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
        const notification = document.createElement('div');
        notification.className = `game-notification ${type}`;
        notification.textContent = message;

        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '-300px';
        notification.style.padding = '12px 20px';
        notification.style.backgroundColor = type === 'success' ? '#28a745' : (type === 'error' ? '#dc3545' : '#17a2b8');
        notification.style.color = 'white';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '3000';
        notification.style.transition = 'right 0.5s ease-in-out';
        notification.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5)';
        
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.right = '20px';
        }, 100);

        setTimeout(() => {
            notification.style.right = '-300px';
            notification.addEventListener('transitionend', () => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            });
        }, 3000);
    }
}