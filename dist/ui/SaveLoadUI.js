// /src/ui/SaveLoadUI.ts
import { SaveLoadManager } from '../game/SaveLoadManager.js';
export class SaveLoadUI {
    formatGameDate;
    constructor(formatGameDate) {
        this.formatGameDate = formatGameDate;
    }
    showSaveDialog(onSave) {
        const modal = document.getElementById('saveLoadModal');
        const title = document.getElementById('modalTitle');
        const slotsContainer = document.getElementById('saveSlots');
        title.textContent = 'Save Game';
        slotsContainer.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            slotsContainer.appendChild(this.createSaveSlot(i, 'save', onSave, null));
        }
        modal.style.display = 'block';
    }
    showLoadDialog(onLoad) {
        const modal = document.getElementById('saveLoadModal');
        const title = document.getElementById('modalTitle');
        const slotsContainer = document.getElementById('saveSlots');
        title.textContent = 'Load Game';
        slotsContainer.innerHTML = '';
        slotsContainer.appendChild(this.createSaveSlot(0, 'load', null, onLoad));
        for (let i = 1; i <= 5; i++) {
            slotsContainer.appendChild(this.createSaveSlot(i, 'load', null, onLoad));
        }
        modal.style.display = 'block';
    }
    closeDialog() {
        const modal = document.getElementById('saveLoadModal');
        if (modal)
            modal.style.display = 'none';
    }
    createSaveSlot(slotNumber, mode, onSave, onLoad) {
        const slot = document.createElement('div');
        slot.className = 'save-slot';
        const saveData = SaveLoadManager.getSaveData(slotNumber);
        if (saveData) {
            try {
                const saveDate = new Date(saveData.saveTime);
                const gameDate = saveData.gameState.currentDate;
                slot.innerHTML = `
                    <div class="save-slot-header">
                        <div class="save-slot-title">${slotNumber === 0 ? 'Auto-Save' : `Save Slot ${slotNumber}`}</div>
                        <div class="save-slot-date">${saveDate.toLocaleDateString()} ${saveDate.toLocaleTimeString()}</div>
                    </div>
                    <div class="save-slot-info">
                        <span>Game Date: ${this.formatGameDate(gameDate, true)}</span>
                        <span>Version: ${saveData.version || '1.0.0'}</span>
                    </div>
                `;
            }
            catch (error) {
                slot.innerHTML = `
                    <div class="save-slot-header"><div class="save-slot-title">${slotNumber === 0 ? 'Auto-Save' : `Save Slot ${slotNumber}`}</div></div>
                    <div style="color: #ff6b6b;">Corrupted Save</div>
                `;
                slot.className += ' empty';
            }
        }
        else {
            slot.innerHTML = `
                <div class="save-slot-header"><div class="save-slot-title">${slotNumber === 0 ? 'Auto-Save' : `Save Slot ${slotNumber}`}</div></div>
                <div>Empty Slot</div>
            `;
            slot.className += ' empty';
            if (mode === 'load') {
                slot.style.cursor = 'not-allowed';
                slot.style.opacity = '0.3';
            }
        }
        slot.addEventListener('click', () => {
            if (mode === 'save' && onSave) {
                onSave(slotNumber);
                this.closeDialog();
            }
            else if (mode === 'load' && saveData && onLoad) {
                onLoad(slotNumber);
                this.closeDialog();
            }
        });
        return slot;
    }
}
//# sourceMappingURL=SaveLoadUI.js.map