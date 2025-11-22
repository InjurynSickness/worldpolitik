# Country/Province Editor - Implementation Guide

## Overview

A comprehensive map editor tool that allows real-time manipulation of countries, provinces, and political boundaries. This addresses issues with disputed territories, missing countries (like Palestine), and incorrect province assignments.

## Core Features

### 1. Country Management
- **Create New Countries**
  - Input: Country tag (3-letter code), name, color
  - Example: Create "PAL" (Palestine) with custom color
  - Validation: Unique tag, valid hex color

- **Edit Existing Countries**
  - Change country name
  - Change country color (live preview)
  - Merge countries (combine two countries into one)
  - Delete countries (reassign provinces first)

### 2. Province Management
- **Assign Provinces**
  - Click province → assign to country
  - Multi-select provinces (shift-click or drag)
  - Assign multiple provinces at once

- **Unassign Provinces**
  - Remove province from current owner
  - Mark as unassigned/neutral territory

- **Transfer Provinces**
  - Drag-drop from one country to another
  - Bulk transfer by state/region

### 3. Visual Features
- **Live Map Updates**
  - Immediate color changes when editing
  - Real-time border regeneration
  - Undo/redo support

- **Selection Tools**
  - Single-click select
  - Rectangle selection (drag)
  - Magic wand (select all contiguous provinces of same country)
  - Select by state/region

## UI Design

### Main Editor Panel (Sidebar)

```
┌─────────────────────────────┐
│  MAP EDITOR                 │
├─────────────────────────────┤
│  Mode: [Country][Province]  │
├─────────────────────────────┤
│  SELECTED COUNTRY:          │
│  ┌───────────────────────┐  │
│  │ RUS - Russia          │  │
│  │ Color: #7d0d18 [■]    │  │
│  │ Provinces: 1,838      │  │
│  └───────────────────────┘  │
│  [Edit Color] [Rename]      │
│  [Delete Country]           │
├─────────────────────────────┤
│  SELECTED PROVINCE:         │
│  ┌───────────────────────┐  │
│  │ ID: 137 (Crimea)      │  │
│  │ Owner: RUS            │  │
│  │ Type: Land            │  │
│  └───────────────────────┘  │
│  [Change Owner ▼]           │
│  [Unassign]                 │
├─────────────────────────────┤
│  CREATE NEW COUNTRY         │
│  Tag: [___]  (3 letters)    │
│  Name: [____________]       │
│  Color: [______] [■]        │
│  [Create Country]           │
├─────────────────────────────┤
│  ACTIONS                    │
│  [Export Data]              │
│  [Import Data]              │
│  [Undo] [Redo]             │
└─────────────────────────────┘
```

### Province Selection Modes

**Mode 1: Single Click**
- Click province → select
- Shows province info in sidebar
- Click "Change Owner" → dropdown of all countries

**Mode 2: Multi-Select**
- Hold Shift + click → add to selection
- Ctrl/Cmd + click → toggle selection
- Show count of selected provinces
- Apply action to all selected

**Mode 3: Paint Mode**
- Select country from dropdown
- Click provinces to assign them
- Like a paintbrush - fast bulk assignment

**Mode 4: Rectangle Select**
- Drag rectangle on map
- Selects all provinces within rectangle
- Good for assigning large regions

## Data Structure

### CountryEditorState
```typescript
interface CountryEditorState {
    countries: Map<string, EditableCountry>;
    provinceOwners: Map<string, string>; // provinceId -> countryTag
    selectedCountry: string | null;
    selectedProvinces: Set<string>;
    editMode: 'country' | 'province' | 'paint';
    history: EditorAction[]; // For undo/redo
    historyIndex: number;
}

interface EditableCountry {
    tag: string;
    name: string;
    color: string;
    provinces: Set<string>;
}

interface EditorAction {
    type: 'assign' | 'unassign' | 'create' | 'delete' | 'color' | 'rename';
    data: any;
    timestamp: number;
}
```

## Implementation Files

### New Files to Create

1. **`src/editor/CountryEditor.ts`**
   - Main editor logic
   - State management
   - Undo/redo system

2. **`src/editor/ProvinceSelector.ts`**
   - Province selection logic
   - Multi-select, drag selection
   - Selection visualization

3. **`src/ui/EditorPanel.tsx`**
   - React component for editor sidebar
   - Country list, controls
   - Color picker, input fields

4. **`src/editor/EditorDataExporter.ts`**
   - Export edited data to JSON
   - Generate new provinceAssignments.ts
   - Generate new countryData.ts

5. **`src/editor/EditorDataImporter.ts`**
   - Import saved editor state
   - Load custom country configurations
   - Validation and error handling

### Modified Files

1. **`src/provinceMap.ts`**
   - Add editor mode toggle
   - Pass editor state to renderers
   - Handle editor interactions

2. **`src/App.tsx`**
   - Add editor panel component
   - Toggle editor mode button
   - Editor state provider

3. **`src/political/PoliticalMapBuilder.ts`**
   - Accept custom country data
   - Rebuild on editor changes

## User Workflows

### Workflow 1: Create Palestine
```
1. Click "CREATE NEW COUNTRY"
2. Enter Tag: "PAL"
3. Enter Name: "Palestine"
4. Pick Color: #00732f (green)
5. Click "Create Country"
6. Switch to Paint Mode
7. Select "PAL" from dropdown
8. Click provinces in West Bank and Gaza
9. Provinces turn green immediately
10. Click "Export Data" to save
```

### Workflow 2: Fix Disputed Territory
```
1. Click problematic province (e.g., Crimea)
2. See current owner: "RUS"
3. Click "Change Owner" dropdown
4. Select "UKR" (Ukraine)
5. Province color updates immediately
6. Borders regenerate
7. Export when done
```

### Workflow 3: Bulk Reassignment
```
1. Enable Rectangle Select mode
2. Drag rectangle over region
3. 15 provinces selected (shown in sidebar)
4. Click "Change Owner" dropdown
5. Select target country
6. All 15 provinces reassign at once
7. Undo button available if mistake
```

## Technical Challenges

### Challenge 1: Performance with Large Selections
**Solution**: Batch province updates, regenerate political map once after all changes

### Challenge 2: Real-time Border Updates
**Solution**: Debounce border regeneration (wait 500ms after last change)

### Challenge 3: Undo/Redo Implementation
**Solution**: Command pattern - each action is reversible, store inverse action

### Challenge 4: Export Format Compatibility
**Solution**: Generate exact same format as current provinceAssignments.ts

### Challenge 5: Color Conflicts
**Solution**: Warn if chosen color is similar to nearby country (<10% difference)

## Export Format

### provinceAssignments.ts
```typescript
// Generated by Country Editor
// Edited on: 2025-11-22T00:40:00.000Z
export const provinceToCountryMap = new Map<string, string>([
    ["137", "RUS"], // Crimea - assigned to Russia
    ["138", "PAL"], // Gaza - assigned to Palestine
    // ... all 10,240 provinces
]);
```

### countryData.ts
```typescript
// Generated by Country Editor
export const allCountryData = new Map<string, CountryData>([
    ["PAL", { name: "Palestine", color: "#00732f" }],
    ["RUS", { name: "Russia", color: "#7d0d18" }],
    // ... all countries including custom ones
]);
```

### editor_state.json (for saving/loading)
```json
{
    "version": "1.0",
    "timestamp": "2025-11-22T00:40:00.000Z",
    "countries": {
        "PAL": {
            "name": "Palestine",
            "color": "#00732f",
            "provinces": [138, 139, 140]
        }
    },
    "provinceOwners": {
        "137": "RUS",
        "138": "PAL"
    }
}
```

## Phase 1: MVP (Minimum Viable Product)

Start with the essential features:
1. ✅ Province selection (single-click)
2. ✅ Change province owner (dropdown)
3. ✅ Create new country
4. ✅ Edit country color
5. ✅ Export to provinceAssignments.ts and countryData.ts

## Phase 2: Advanced Features

Add after MVP is working:
- Multi-select provinces
- Rectangle/drag selection
- Paint mode
- Undo/redo
- Import/export JSON states
- Color conflict warnings

## Testing Checklist

- [ ] Create new country (Palestine)
- [ ] Assign 3+ provinces to new country
- [ ] See provinces change color immediately
- [ ] Change existing country color
- [ ] Transfer province between countries
- [ ] Unassign province (neutral)
- [ ] Export data
- [ ] Reload page and import data
- [ ] Verify all 10,240 provinces accounted for
- [ ] Check no duplicate province assignments
- [ ] Borders regenerate correctly
- [ ] Performance acceptable with 100+ province selection

## Notes

- This editor will be a powerful tool for resolving all territorial disputes
- Can be used for alternative history scenarios
- Can create custom country configurations for different time periods
- Export/import allows sharing custom maps
- Foundation for mod support in the future
