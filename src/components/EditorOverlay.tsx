// Editor Overlay - React component for in-game editor access
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { EditorPanel } from './EditorPanel';
import type { ProvinceMap } from '../provinceMap';

interface EditorOverlayProps {
    provinceMap: ProvinceMap | null;
}

/**
 * EditorOverlay provides access to the Country/Province Editor from within the game
 * Shows a toggle button and the editor panel when active
 */
export const EditorOverlay: React.FC<EditorOverlayProps> = ({ provinceMap }) => {
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editor, setEditor] = useState<ReturnType<typeof provinceMap['getCountryEditor']> | null>(null);

    useEffect(() => {
        if (provinceMap) {
            const countryEditor = provinceMap.getCountryEditor();
            setEditor(countryEditor);
        }
    }, [provinceMap]);

    const handleToggleEditor = () => {
        if (!provinceMap || !editor) {
            console.warn('[EditorOverlay] Province map or editor not initialized');
            return;
        }

        const newState = !isEditorOpen;
        setIsEditorOpen(newState);

        // Toggle editor mode on the map
        provinceMap.setEditorMode(newState);

        console.log(`[EditorOverlay] Editor ${newState ? 'opened' : 'closed'}`);
    };

    const handleMapUpdate = () => {
        if (!provinceMap) return;
        // Rebuild the map from editor changes
        provinceMap.rebuildFromEditor();
    };

    if (!provinceMap || !editor) {
        return null;
    }

    return (
        <>
            {/* Editor Toggle Button */}
            <div className="fixed bottom-6 right-6 z-40" style={{ pointerEvents: 'auto' }}>
                <Button
                    onClick={handleToggleEditor}
                    variant={isEditorOpen ? 'default' : 'outline'}
                    size="lg"
                    className="shadow-2xl"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2"
                    >
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                    </svg>
                    Map Editor
                </Button>
            </div>

            {/* Editor Panel */}
            {isEditorOpen && (
                <EditorPanel
                    editor={editor}
                    isOpen={isEditorOpen}
                    onClose={() => {
                        setIsEditorOpen(false);
                        provinceMap.setEditorMode(false);
                    }}
                    onMapUpdate={handleMapUpdate}
                />
            )}

            {/* Keyboard Shortcut Hint */}
            {!isEditorOpen && (
                <div className="fixed bottom-20 right-6 z-30 opacity-50 hover:opacity-100 transition-opacity" style={{ pointerEvents: 'auto' }}>
                    <div className="text-xs text-white bg-black/60 px-3 py-1 rounded">
                        Press <kbd className="px-2 py-1 bg-gray-700 rounded font-mono">E</kbd> to toggle editor
                    </div>
                </div>
            )}
        </>
    );
};
