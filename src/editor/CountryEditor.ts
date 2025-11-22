// Country/Province Editor - Core State Management
// Allows real-time manipulation of countries, provinces, and political boundaries

export interface EditableCountry {
    tag: string;
    name: string;
    color: string;
    provinces: Set<string>;
}

export interface EditorAction {
    type: 'assign' | 'unassign' | 'create' | 'delete' | 'color' | 'rename';
    data: any;
    timestamp: number;
    inverse?: EditorAction; // For undo
}

export interface CountryEditorState {
    countries: Map<string, EditableCountry>;
    provinceOwners: Map<string, string>; // provinceId -> countryTag
    selectedCountry: string | null;
    selectedProvinces: Set<string>;
    editMode: 'country' | 'province' | 'paint';
    history: EditorAction[];
    historyIndex: number;
}

export class CountryEditor {
    private state: CountryEditorState;
    private listeners: Set<() => void> = new Set();

    constructor(
        initialCountries: Map<string, { name: string; color: string }>,
        initialProvinceOwners: Map<string, string>
    ) {
        // Initialize editor state from current map data
        this.state = {
            countries: new Map(),
            provinceOwners: new Map(initialProvinceOwners),
            selectedCountry: null,
            selectedProvinces: new Set(),
            editMode: 'province',
            history: [],
            historyIndex: -1
        };

        // Build country data with province sets
        for (const [tag, data] of initialCountries.entries()) {
            this.state.countries.set(tag, {
                tag,
                name: data.name,
                color: data.color,
                provinces: new Set()
            });
        }

        // Populate province sets
        for (const [provinceId, countryTag] of initialProvinceOwners.entries()) {
            const country = this.state.countries.get(countryTag);
            if (country) {
                country.provinces.add(provinceId);
            }
        }

        console.log(`[CountryEditor] Initialized with ${this.state.countries.size} countries, ${this.state.provinceOwners.size} provinces`);
    }

    // Subscribe to state changes
    public subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify(): void {
        this.listeners.forEach(listener => listener());
    }

    // Get current state (read-only)
    public getState(): Readonly<CountryEditorState> {
        return this.state;
    }

    // Create new country
    public createCountry(tag: string, name: string, color: string): boolean {
        if (this.state.countries.has(tag)) {
            console.error(`[CountryEditor] Country with tag ${tag} already exists`);
            return false;
        }

        // Validate tag (3 uppercase letters)
        if (!/^[A-Z]{3}$/.test(tag)) {
            console.error(`[CountryEditor] Invalid tag format: ${tag} (must be 3 uppercase letters)`);
            return false;
        }

        // Validate color (hex format)
        if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
            console.error(`[CountryEditor] Invalid color format: ${color} (must be hex #RRGGBB)`);
            return false;
        }

        const newCountry: EditableCountry = {
            tag,
            name,
            color,
            provinces: new Set()
        };

        const action: EditorAction = {
            type: 'create',
            data: { tag, name, color },
            timestamp: Date.now(),
            inverse: {
                type: 'delete',
                data: { tag },
                timestamp: Date.now()
            }
        };

        this.state.countries.set(tag, newCountry);
        this.addToHistory(action);
        this.notify();

        console.log(`[CountryEditor] Created country: ${tag} - ${name} (${color})`);
        return true;
    }

    // Delete country (must unassign all provinces first)
    public deleteCountry(tag: string): boolean {
        const country = this.state.countries.get(tag);
        if (!country) {
            console.error(`[CountryEditor] Country ${tag} not found`);
            return false;
        }

        if (country.provinces.size > 0) {
            console.error(`[CountryEditor] Cannot delete ${tag}: has ${country.provinces.size} assigned provinces`);
            return false;
        }

        const action: EditorAction = {
            type: 'delete',
            data: { tag },
            timestamp: Date.now(),
            inverse: {
                type: 'create',
                data: { tag, name: country.name, color: country.color },
                timestamp: Date.now()
            }
        };

        this.state.countries.delete(tag);
        this.addToHistory(action);
        this.notify();

        console.log(`[CountryEditor] Deleted country: ${tag}`);
        return true;
    }

    // Change country color
    public changeCountryColor(tag: string, newColor: string): boolean {
        const country = this.state.countries.get(tag);
        if (!country) {
            console.error(`[CountryEditor] Country ${tag} not found`);
            return false;
        }

        if (!/^#[0-9a-fA-F]{6}$/.test(newColor)) {
            console.error(`[CountryEditor] Invalid color format: ${newColor}`);
            return false;
        }

        const oldColor = country.color;

        const action: EditorAction = {
            type: 'color',
            data: { tag, newColor, oldColor },
            timestamp: Date.now(),
            inverse: {
                type: 'color',
                data: { tag, newColor: oldColor, oldColor: newColor },
                timestamp: Date.now()
            }
        };

        country.color = newColor;
        this.addToHistory(action);
        this.notify();

        console.log(`[CountryEditor] Changed ${tag} color: ${oldColor} → ${newColor}`);
        return true;
    }

    // Rename country
    public renameCountry(tag: string, newName: string): boolean {
        const country = this.state.countries.get(tag);
        if (!country) {
            console.error(`[CountryEditor] Country ${tag} not found`);
            return false;
        }

        const oldName = country.name;

        const action: EditorAction = {
            type: 'rename',
            data: { tag, newName, oldName },
            timestamp: Date.now(),
            inverse: {
                type: 'rename',
                data: { tag, newName: oldName, oldName: newName },
                timestamp: Date.now()
            }
        };

        country.name = newName;
        this.addToHistory(action);
        this.notify();

        console.log(`[CountryEditor] Renamed ${tag}: ${oldName} → ${newName}`);
        return true;
    }

    // Assign province to country
    public assignProvince(provinceId: string, countryTag: string): boolean {
        const country = this.state.countries.get(countryTag);
        if (!country) {
            console.error(`[CountryEditor] Country ${countryTag} not found`);
            return false;
        }

        // Remove from previous owner if any
        const previousOwner = this.state.provinceOwners.get(provinceId);
        if (previousOwner) {
            const prevCountry = this.state.countries.get(previousOwner);
            if (prevCountry) {
                prevCountry.provinces.delete(provinceId);
            }
        }

        const action: EditorAction = {
            type: 'assign',
            data: { provinceId, countryTag, previousOwner },
            timestamp: Date.now(),
            inverse: previousOwner ? {
                type: 'assign',
                data: { provinceId, countryTag: previousOwner, previousOwner: countryTag },
                timestamp: Date.now()
            } : {
                type: 'unassign',
                data: { provinceId, previousOwner: countryTag },
                timestamp: Date.now()
            }
        };

        this.state.provinceOwners.set(provinceId, countryTag);
        country.provinces.add(provinceId);
        this.addToHistory(action);
        this.notify();

        console.log(`[CountryEditor] Assigned province ${provinceId} to ${countryTag}${previousOwner ? ` (was ${previousOwner})` : ''}`);
        return true;
    }

    // Assign multiple provinces at once (for bulk operations)
    public assignProvinces(provinceIds: string[], countryTag: string): boolean {
        const country = this.state.countries.get(countryTag);
        if (!country) {
            console.error(`[CountryEditor] Country ${countryTag} not found`);
            return false;
        }

        let success = true;
        for (const provinceId of provinceIds) {
            if (!this.assignProvince(provinceId, countryTag)) {
                success = false;
            }
        }

        return success;
    }

    // Unassign province from current owner
    public unassignProvince(provinceId: string): boolean {
        const previousOwner = this.state.provinceOwners.get(provinceId);
        if (!previousOwner) {
            console.error(`[CountryEditor] Province ${provinceId} is not assigned to any country`);
            return false;
        }

        const country = this.state.countries.get(previousOwner);
        if (country) {
            country.provinces.delete(provinceId);
        }

        const action: EditorAction = {
            type: 'unassign',
            data: { provinceId, previousOwner },
            timestamp: Date.now(),
            inverse: {
                type: 'assign',
                data: { provinceId, countryTag: previousOwner, previousOwner: null },
                timestamp: Date.now()
            }
        };

        this.state.provinceOwners.delete(provinceId);
        this.addToHistory(action);
        this.notify();

        console.log(`[CountryEditor] Unassigned province ${provinceId} from ${previousOwner}`);
        return true;
    }

    // Selection management
    public selectCountry(tag: string | null): void {
        this.state.selectedCountry = tag;
        this.notify();
    }

    public selectProvince(provinceId: string): void {
        this.state.selectedProvinces.clear();
        this.state.selectedProvinces.add(provinceId);
        this.notify();
    }

    public addProvinceToSelection(provinceId: string): void {
        this.state.selectedProvinces.add(provinceId);
        this.notify();
    }

    public clearProvinceSelection(): void {
        this.state.selectedProvinces.clear();
        this.notify();
    }

    public setEditMode(mode: 'country' | 'province' | 'paint'): void {
        this.state.editMode = mode;
        this.notify();
    }

    // Undo/Redo
    private addToHistory(action: EditorAction): void {
        // Truncate history if we're not at the end
        if (this.state.historyIndex < this.state.history.length - 1) {
            this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
        }

        this.state.history.push(action);
        this.state.historyIndex++;

        // Limit history size to 100 actions
        if (this.state.history.length > 100) {
            this.state.history.shift();
            this.state.historyIndex--;
        }
    }

    public canUndo(): boolean {
        return this.state.historyIndex >= 0;
    }

    public canRedo(): boolean {
        return this.state.historyIndex < this.state.history.length - 1;
    }

    public undo(): boolean {
        if (!this.canUndo()) {
            return false;
        }

        const action = this.state.history[this.state.historyIndex];
        if (action.inverse) {
            this.executeAction(action.inverse, false);
        }

        this.state.historyIndex--;
        this.notify();

        console.log(`[CountryEditor] Undo: ${action.type}`);
        return true;
    }

    public redo(): boolean {
        if (!this.canRedo()) {
            return false;
        }

        this.state.historyIndex++;
        const action = this.state.history[this.state.historyIndex];
        this.executeAction(action, false);
        this.notify();

        console.log(`[CountryEditor] Redo: ${action.type}`);
        return true;
    }

    private executeAction(action: EditorAction, addToHistory: boolean): void {
        switch (action.type) {
            case 'create':
                const { tag, name, color } = action.data;
                this.state.countries.set(tag, { tag, name, color, provinces: new Set() });
                break;

            case 'delete':
                this.state.countries.delete(action.data.tag);
                break;

            case 'color':
                const country = this.state.countries.get(action.data.tag);
                if (country) {
                    country.color = action.data.newColor;
                }
                break;

            case 'rename':
                const countryToRename = this.state.countries.get(action.data.tag);
                if (countryToRename) {
                    countryToRename.name = action.data.newName;
                }
                break;

            case 'assign':
                const { provinceId, countryTag, previousOwner } = action.data;
                if (previousOwner) {
                    const prevCountry = this.state.countries.get(previousOwner);
                    if (prevCountry) {
                        prevCountry.provinces.delete(provinceId);
                    }
                }
                const targetCountry = this.state.countries.get(countryTag);
                if (targetCountry) {
                    targetCountry.provinces.add(provinceId);
                    this.state.provinceOwners.set(provinceId, countryTag);
                }
                break;

            case 'unassign':
                const ownerToRemove = this.state.countries.get(action.data.previousOwner);
                if (ownerToRemove) {
                    ownerToRemove.provinces.delete(action.data.provinceId);
                }
                this.state.provinceOwners.delete(action.data.provinceId);
                break;
        }
    }

    // Get country by tag
    public getCountry(tag: string): EditableCountry | undefined {
        return this.state.countries.get(tag);
    }

    // Get all countries as sorted array
    public getAllCountries(): EditableCountry[] {
        return Array.from(this.state.countries.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    // Get province owner
    public getProvinceOwner(provinceId: string): string | undefined {
        return this.state.provinceOwners.get(provinceId);
    }
}
