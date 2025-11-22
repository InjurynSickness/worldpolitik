// Country/Province Editor Panel - React UI Component
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import type { CountryEditor, EditableCountry } from '../editor/CountryEditor';
import { EditorDataExporter } from '../editor/EditorDataExporter';

interface EditorPanelProps {
    editor: CountryEditor;
    isOpen: boolean;
    onClose: () => void;
    onMapUpdate: () => void; // Called when map needs to redraw
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
    editor,
    isOpen,
    onClose,
    onMapUpdate
}) => {
    const [state, setState] = useState(editor.getState());
    const [countries, setCountries] = useState<EditableCountry[]>([]);

    // New country form state
    const [newCountryTag, setNewCountryTag] = useState('');
    const [newCountryName, setNewCountryName] = useState('');
    const [newCountryColor, setNewCountryColor] = useState('#7d0d18');

    // Selected province owner change
    const [selectedOwnerChange, setSelectedOwnerChange] = useState('');

    // Country search filter for performance
    const [countrySearchFilter, setCountrySearchFilter] = useState('');

    // Filtered countries list (memoized for performance)
    const filteredCountries = React.useMemo(() => {
        if (!countrySearchFilter) return countries;
        const search = countrySearchFilter.toLowerCase();
        return countries.filter(c =>
            c.tag.toLowerCase().includes(search) ||
            c.name.toLowerCase().includes(search)
        );
    }, [countries, countrySearchFilter]);

    // Update state when editor changes
    // NOTE: Don't call onMapUpdate() here - it causes lag by rebuilding the entire map
    // on every state change (including province selection). Only rebuild when data actually changes.
    useEffect(() => {
        const unsubscribe = editor.subscribe(() => {
            setState(editor.getState());
            setCountries(editor.getAllCountries());
        });

        setCountries(editor.getAllCountries());

        return unsubscribe;
    }, [editor]);

    if (!isOpen) {
        return null;
    }

    const selectedProvince = state.selectedProvinces.size === 1
        ? Array.from(state.selectedProvinces)[0]
        : null;

    const selectedProvinceOwner = selectedProvince
        ? editor.getProvinceOwner(selectedProvince)
        : undefined;

    const selectedCountryData = state.selectedCountry
        ? editor.getCountry(state.selectedCountry)
        : undefined;

    const handleCreateCountry = () => {
        if (newCountryTag.length !== 3) {
            alert('Country tag must be exactly 3 uppercase letters');
            return;
        }

        if (!newCountryName.trim()) {
            alert('Country name is required');
            return;
        }

        if (!/^#[0-9a-fA-F]{6}$/.test(newCountryColor)) {
            alert('Invalid color format (must be #RRGGBB)');
            return;
        }

        const success = editor.createCountry(
            newCountryTag.toUpperCase(),
            newCountryName.trim(),
            newCountryColor
        );

        if (success) {
            setNewCountryTag('');
            setNewCountryName('');
            setNewCountryColor('#7d0d18');
        }
    };

    const handleChangeProvinceOwner = (newOwner: string) => {
        if (!selectedProvince) return;

        editor.assignProvince(selectedProvince, newOwner);
        setSelectedOwnerChange('');
        setCountrySearchFilter(''); // Clear search after selection
        onMapUpdate(); // Rebuild map after province assignment
    };

    const handleBulkChangeOwner = (newOwner: string) => {
        const provinces = Array.from(state.selectedProvinces);
        editor.assignProvinces(provinces, newOwner);
        setSelectedOwnerChange('');
        setCountrySearchFilter(''); // Clear search after selection
        onMapUpdate(); // Rebuild map after bulk assignment
    };

    const handleExportData = () => {
        const countries = new Map<string, EditableCountry>();
        for (const country of editor.getAllCountries()) {
            countries.set(country.tag, country);
        }

        const provinceOwners = new Map(state.provinceOwners);

        // Validate before export
        const validation = EditorDataExporter.validateState(countries, provinceOwners);
        if (!validation.valid) {
            const proceed = confirm(
                `Export validation warnings:\n${validation.errors.join('\n')}\n\nProceed with export?`
            );
            if (!proceed) return;
        }

        // Export all files
        EditorDataExporter.exportAll(countries, provinceOwners);

        alert('Export complete! Check your downloads folder for:\n- provinceAssignments.ts\n- countryData.ts\n- editor_state.json');
    };

    const handleColorChange = (tag: string, color: string) => {
        editor.changeCountryColor(tag, color);
        onMapUpdate(); // Rebuild map after color change
    };

    const handleUnassignProvince = (provinceId: string) => {
        editor.unassignProvince(provinceId);
        onMapUpdate(); // Rebuild map after unassigning province
    };

    const handleDeleteCountry = (tag: string) => {
        editor.deleteCountry(tag);
        // No map update needed - country has no provinces
    };

    const handleRenameCountry = (tag: string, newName: string) => {
        if (!newName.trim()) {
            alert('Country name cannot be empty');
            return;
        }
        editor.renameCountry(tag, newName.trim());
        // No map update needed - names don't affect rendering
    };

    // Debounced color change to prevent lag when dragging color picker
    const colorChangeTimeoutRef = useRef<number | null>(null);
    const handleColorChangeDebounced = useCallback((tag: string, color: string) => {
        // Clear previous timeout
        if (colorChangeTimeoutRef.current) {
            clearTimeout(colorChangeTimeoutRef.current);
        }

        // Debounce the map rebuild (wait 150ms after user stops dragging)
        colorChangeTimeoutRef.current = window.setTimeout(() => {
            handleColorChange(tag, color);
        }, 150);
    }, []);

    return (
        <div
            className="fixed right-0 top-0 h-full w-96 bg-slate-900 text-white shadow-2xl z-50 flex flex-col"
            style={{ fontFamily: 'monospace', pointerEvents: 'auto' }}
        >
            {/* Header */}
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                <h2 className="text-xl font-bold">MAP EDITOR</h2>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    ✕
                </Button>
            </div>

            <ScrollArea className="flex-1" style={{ pointerEvents: 'auto' }}>
                <div className="p-4 space-y-4" style={{ pointerEvents: 'auto' }}>
                    {/* Mode Selection */}
                    <Card className="bg-slate-800 border-slate-700" style={{ pointerEvents: 'auto' }}>
                        <CardHeader>
                            <CardTitle className="text-sm">Edit Mode</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex gap-2" style={{ pointerEvents: 'auto' }}>
                                <Button
                                    size="sm"
                                    variant={state.editMode === 'province' ? 'default' : 'outline'}
                                    onClick={() => editor.setEditMode('province')}
                                    className="flex-1"
                                    style={{ pointerEvents: 'auto' }}
                                >
                                    Province
                                </Button>
                                <Button
                                    size="sm"
                                    variant={state.editMode === 'country' ? 'default' : 'outline'}
                                    onClick={() => editor.setEditMode('country')}
                                    className="flex-1"
                                    style={{ pointerEvents: 'auto' }}
                                >
                                    Country
                                </Button>
                                <Button
                                    size="sm"
                                    variant={state.editMode === 'paint' ? 'default' : 'outline'}
                                    onClick={() => editor.setEditMode('paint')}
                                    className="flex-1"
                                    style={{ pointerEvents: 'auto' }}
                                >
                                    Paint
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Selected Province */}
                    {selectedProvince && (
                        <Card className="bg-slate-800 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-sm">Selected Province</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <Label className="text-xs text-slate-400">Province ID</Label>
                                    <div className="font-mono text-lg">{selectedProvince}</div>
                                </div>

                                {selectedProvinceOwner && (
                                    <div>
                                        <Label className="text-xs text-slate-400">Current Owner</Label>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded"
                                                style={{
                                                    backgroundColor: editor.getCountry(selectedProvinceOwner)?.color
                                                }}
                                            />
                                            <span className="font-mono">
                                                {selectedProvinceOwner} - {editor.getCountry(selectedProvinceOwner)?.name}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <Separator />

                                <div>
                                    <Label className="text-sm mb-2">Change Owner</Label>
                                    <Input
                                        placeholder="Search countries..."
                                        value={countrySearchFilter}
                                        onChange={(e) => setCountrySearchFilter(e.target.value)}
                                        className="mb-2 bg-slate-700 border-slate-600"
                                    />
                                    <Select value={selectedOwnerChange} onValueChange={handleChangeProvinceOwner}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select country..." />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            {filteredCountries.slice(0, 50).map(country => (
                                                <SelectItem key={country.tag} value={country.tag}>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded"
                                                            style={{ backgroundColor: country.color }}
                                                        />
                                                        {country.tag} - {country.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                            {filteredCountries.length > 50 && (
                                                <div className="text-xs text-slate-400 p-2 text-center">
                                                    Showing 50 of {filteredCountries.length} - refine search
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => handleUnassignProvince(selectedProvince)}
                                >
                                    Unassign Province
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Multiple Provinces Selected */}
                    {state.selectedProvinces.size > 1 && (
                        <Card className="bg-slate-800 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-sm">
                                    Multiple Provinces Selected
                                    <Badge className="ml-2">{state.selectedProvinces.size}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <Label className="text-sm mb-2">Assign All To</Label>
                                    <Input
                                        placeholder="Search countries..."
                                        value={countrySearchFilter}
                                        onChange={(e) => setCountrySearchFilter(e.target.value)}
                                        className="mb-2 bg-slate-700 border-slate-600"
                                    />
                                    <Select value={selectedOwnerChange} onValueChange={handleBulkChangeOwner}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select country..." />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            {filteredCountries.slice(0, 50).map(country => (
                                                <SelectItem key={country.tag} value={country.tag}>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded"
                                                            style={{ backgroundColor: country.color }}
                                                        />
                                                        {country.tag} - {country.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                            {filteredCountries.length > 50 && (
                                                <div className="text-xs text-slate-400 p-2 text-center">
                                                    Showing 50 of {filteredCountries.length} - refine search
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Selected Country */}
                    {selectedCountryData && (
                        <Card className="bg-slate-800 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-sm">Selected Country</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <Label className="text-xs text-slate-400">Tag</Label>
                                    <div className="font-mono text-lg">{selectedCountryData.tag}</div>
                                </div>

                                <div>
                                    <Label className="text-xs text-slate-400">Name</Label>
                                    <Input
                                        value={selectedCountryData.name}
                                        onChange={(e) => handleRenameCountry(selectedCountryData.tag, e.target.value)}
                                        className="bg-slate-700 border-slate-600"
                                        placeholder="Country name"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs text-slate-400">Color</Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={selectedCountryData.color}
                                            onChange={(e) => handleColorChangeDebounced(selectedCountryData.tag, e.target.value)}
                                            className="w-12 h-8 rounded cursor-pointer"
                                        />
                                        <span className="font-mono">{selectedCountryData.color}</span>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs text-slate-400">Provinces</Label>
                                    <div className="font-mono text-lg">{selectedCountryData.provinces.size}</div>
                                </div>

                                <Separator />

                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => {
                                        if (selectedCountryData.provinces.size > 0) {
                                            alert('Cannot delete country with assigned provinces. Unassign all provinces first.');
                                        } else if (confirm(`Delete ${selectedCountryData.name}?`)) {
                                            handleDeleteCountry(selectedCountryData.tag);
                                        }
                                    }}
                                    disabled={selectedCountryData.provinces.size > 0}
                                >
                                    Delete Country
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Create New Country */}
                    <Card className="bg-slate-800 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-sm">Create New Country</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <Label className="text-xs">Tag (3 letters)</Label>
                                <Input
                                    value={newCountryTag}
                                    onChange={(e) => setNewCountryTag(e.target.value.toUpperCase().slice(0, 3))}
                                    placeholder="PAL"
                                    maxLength={3}
                                    className="font-mono bg-slate-700 border-slate-600"
                                />
                            </div>

                            <div>
                                <Label className="text-xs">Name</Label>
                                <Input
                                    value={newCountryName}
                                    onChange={(e) => setNewCountryName(e.target.value)}
                                    placeholder="Palestine"
                                    className="bg-slate-700 border-slate-600"
                                />
                            </div>

                            <div>
                                <Label className="text-xs">Color</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={newCountryColor}
                                        onChange={(e) => setNewCountryColor(e.target.value)}
                                        className="w-12 h-8 rounded cursor-pointer"
                                    />
                                    <Input
                                        value={newCountryColor}
                                        onChange={(e) => setNewCountryColor(e.target.value)}
                                        placeholder="#7d0d18"
                                        className="font-mono bg-slate-700 border-slate-600"
                                    />
                                </div>
                            </div>

                            <Button
                                className="w-full"
                                onClick={handleCreateCountry}
                                disabled={!newCountryTag || !newCountryName || newCountryTag.length !== 3}
                            >
                                Create Country
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card className="bg-slate-800 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-sm">Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                className="w-full"
                                onClick={handleExportData}
                                variant="default"
                            >
                                Export Data
                            </Button>

                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => editor.undo()}
                                    disabled={!editor.canUndo()}
                                >
                                    Undo
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => editor.redo()}
                                    disabled={!editor.canRedo()}
                                >
                                    Redo
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Statistics */}
                    <Card className="bg-slate-800 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-sm">Statistics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Countries:</span>
                                <span className="font-mono">{state.countries.size}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Provinces:</span>
                                <span className="font-mono">{state.provinceOwners.size}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Selected:</span>
                                <span className="font-mono">{state.selectedProvinces.size}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </ScrollArea>
        </div>
    );
};
