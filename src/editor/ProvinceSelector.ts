// Province Selection Logic for Editor
// Handles single-click, multi-select, and paint mode selection

export interface ProvinceInfo {
    id: string;
    x: number;
    y: number;
    owner?: string;
}

export class ProvinceSelector {
    private selectedProvinces: Set<string> = new Set();
    private hoveredProvince: string | null = null;
    private selectionMode: 'single' | 'multi' | 'paint' = 'single';
    private paintTarget: string | null = null; // Country tag for paint mode
    private listeners: Set<() => void> = new Set();

    // Canvas for drawing selection overlay
    private overlayCanvas: HTMLCanvasElement;
    private overlayCtx: CanvasRenderingContext2D;

    constructor(width: number, height: number) {
        this.overlayCanvas = document.createElement('canvas');
        this.overlayCanvas.width = width;
        this.overlayCanvas.height = height;
        this.overlayCtx = this.overlayCanvas.getContext('2d', { willReadFrequently: true })!;
    }

    /**
     * Subscribe to selection changes
     */
    public subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify(): void {
        this.listeners.forEach(listener => listener());
    }

    /**
     * Set selection mode
     */
    public setSelectionMode(mode: 'single' | 'multi' | 'paint'): void {
        this.selectionMode = mode;
        if (mode !== 'multi') {
            // Clear selection when switching out of multi mode
            this.clearSelection();
        }
        console.log(`[ProvinceSelector] Selection mode: ${mode}`);
    }

    /**
     * Set paint target country
     */
    public setPaintTarget(countryTag: string | null): void {
        this.paintTarget = countryTag;
        console.log(`[ProvinceSelector] Paint target: ${countryTag || 'none'}`);
    }

    /**
     * Handle province click
     */
    public handleProvinceClick(
        provinceId: string,
        ctrlKey: boolean,
        shiftKey: boolean
    ): { action: 'select' | 'paint' | 'toggle'; provinceId: string } {
        switch (this.selectionMode) {
            case 'single':
                this.selectProvince(provinceId);
                return { action: 'select', provinceId };

            case 'multi':
                if (ctrlKey) {
                    // Toggle selection
                    this.toggleProvince(provinceId);
                    return { action: 'toggle', provinceId };
                } else if (shiftKey) {
                    // Add to selection
                    this.addToSelection(provinceId);
                    return { action: 'select', provinceId };
                } else {
                    // Single select
                    this.selectProvince(provinceId);
                    return { action: 'select', provinceId };
                }

            case 'paint':
                // Paint mode doesn't change selection, just returns paint action
                return { action: 'paint', provinceId };

            default:
                this.selectProvince(provinceId);
                return { action: 'select', provinceId };
        }
    }

    /**
     * Select a single province (clears previous selection)
     */
    public selectProvince(provinceId: string): void {
        this.selectedProvinces.clear();
        this.selectedProvinces.add(provinceId);
        this.notify();
        console.log(`[ProvinceSelector] Selected province: ${provinceId}`);
    }

    /**
     * Add province to selection (multi-select)
     */
    public addToSelection(provinceId: string): void {
        this.selectedProvinces.add(provinceId);
        this.notify();
        console.log(`[ProvinceSelector] Added to selection: ${provinceId} (${this.selectedProvinces.size} total)`);
    }

    /**
     * Toggle province in selection
     */
    public toggleProvince(provinceId: string): void {
        if (this.selectedProvinces.has(provinceId)) {
            this.selectedProvinces.delete(provinceId);
            console.log(`[ProvinceSelector] Removed from selection: ${provinceId}`);
        } else {
            this.selectedProvinces.add(provinceId);
            console.log(`[ProvinceSelector] Added to selection: ${provinceId}`);
        }
        this.notify();
    }

    /**
     * Clear all selections
     */
    public clearSelection(): void {
        this.selectedProvinces.clear();
        this.notify();
        console.log(`[ProvinceSelector] Cleared selection`);
    }

    /**
     * Get selected provinces
     */
    public getSelectedProvinces(): Set<string> {
        return new Set(this.selectedProvinces);
    }

    /**
     * Get selected provinces as array
     */
    public getSelectedProvincesArray(): string[] {
        return Array.from(this.selectedProvinces);
    }

    /**
     * Check if province is selected
     */
    public isSelected(provinceId: string): boolean {
        return this.selectedProvinces.has(provinceId);
    }

    /**
     * Get selection count
     */
    public getSelectionCount(): number {
        return this.selectedProvinces.size;
    }

    /**
     * Set hovered province (for visual feedback)
     */
    public setHoveredProvince(provinceId: string | null): void {
        if (this.hoveredProvince !== provinceId) {
            this.hoveredProvince = provinceId;
            this.notify();
        }
    }

    /**
     * Get hovered province
     */
    public getHoveredProvince(): string | null {
        return this.hoveredProvince;
    }

    /**
     * Draw selection overlay on the map
     */
    public drawSelectionOverlay(
        provinceMapData: ImageData,
        provinceColorToId: Map<number, string>
    ): void {
        const { width, height } = this.overlayCanvas;
        this.overlayCtx.clearRect(0, 0, width, height);

        const imageData = this.overlayCtx.createImageData(width, height);

        // Draw selection highlight
        for (let i = 0; i < provinceMapData.data.length; i += 4) {
            const r = provinceMapData.data[i];
            const g = provinceMapData.data[i + 1];
            const b = provinceMapData.data[i + 2];

            const colorKey = (r << 16) | (g << 8) | b;
            const provinceId = provinceColorToId.get(colorKey);

            if (provinceId && this.selectedProvinces.has(provinceId)) {
                // Yellow highlight for selected provinces
                imageData.data[i] = 255;     // R
                imageData.data[i + 1] = 255; // G
                imageData.data[i + 2] = 0;   // B
                imageData.data[i + 3] = 100; // A (semi-transparent)
            } else if (provinceId && provinceId === this.hoveredProvince) {
                // Light blue highlight for hovered province
                imageData.data[i] = 100;
                imageData.data[i + 1] = 150;
                imageData.data[i + 2] = 255;
                imageData.data[i + 3] = 80;
            }
        }

        this.overlayCtx.putImageData(imageData, 0, 0);
    }

    /**
     * Get overlay canvas for rendering
     */
    public getOverlayCanvas(): HTMLCanvasElement {
        return this.overlayCanvas;
    }

    /**
     * Get overlay context
     */
    public getOverlayContext(): CanvasRenderingContext2D {
        return this.overlayCtx;
    }

    /**
     * Select provinces by rectangle (for future implementation)
     */
    public selectByRectangle(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        provinceMapData: ImageData,
        provinceColorToId: Map<number, string>
    ): void {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);

        const selectedInRect = new Set<string>();

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const i = (y * provinceMapData.width + x) * 4;
                const r = provinceMapData.data[i];
                const g = provinceMapData.data[i + 1];
                const b = provinceMapData.data[i + 2];

                const colorKey = (r << 16) | (g << 8) | b;
                const provinceId = provinceColorToId.get(colorKey);

                if (provinceId) {
                    selectedInRect.add(provinceId);
                }
            }
        }

        this.selectedProvinces = selectedInRect;
        this.notify();

        console.log(`[ProvinceSelector] Rectangle selection: ${selectedInRect.size} provinces`);
    }

    /**
     * Select all provinces of the same country (magic wand)
     */
    public selectByCountry(
        countryTag: string,
        countryProvinces: Set<string>
    ): void {
        this.selectedProvinces = new Set(countryProvinces);
        this.notify();

        console.log(`[ProvinceSelector] Selected all ${countryProvinces.size} provinces of ${countryTag}`);
    }
}
