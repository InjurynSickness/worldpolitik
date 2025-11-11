import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { MenuButton } from "./MenuButton";
import { Trash2 } from "lucide-react"; // <-- FIXED
export function LoadGameMenu({ onBack, onLoad, gameCoordinator }) {
    const [activeTab, setActiveTab] = useState("local");
    const [selectedSave, setSelectedSave] = useState(null);
    const [saves, setSaves] = useState([]);
    useEffect(() => {
        if (activeTab === "local") {
            const realSaves = gameCoordinator.getSaveSlotsData();
            setSaves(realSaves);
            if (!selectedSave && realSaves.length > 0) {
                const autoSave = realSaves.find(s => s.id === "0");
                if (autoSave) {
                    setSelectedSave(autoSave);
                }
                else {
                    setSelectedSave(realSaves[0]);
                }
            }
        }
        else {
            setSaves([]);
            setSelectedSave(null);
        }
    }, [activeTab, gameCoordinator]);
    const handleDelete = (saveId, e) => {
        e.stopPropagation();
        gameCoordinator.deleteSaveSlot(Number(saveId));
        const newSaves = saves.filter(save => save.id !== saveId);
        setSaves(newSaves);
        if (selectedSave?.id === saveId) {
            setSelectedSave(newSaves.length > 0 ? newSaves[0] : null);
        }
    };
    return (_jsx("div", { className: "relative w-full h-screen flex items-center justify-center", children: _jsxs("div", { className: "relative w-[420px] bg-gradient-to-b from-stone-900/95 to-black/95 border-2 border-amber-900/60 shadow-2xl", children: [_jsx("div", { className: "absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-700/80" }), _jsx("div", { className: "absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-700/80" }), _jsx("div", { className: "absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-700/80" }), _jsx("div", { className: "absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-700/80" }), _jsxs("div", { className: "flex gap-2 p-3 pb-0", children: [_jsx("button", { onClick: () => setActiveTab("local"), className: `flex-1 py-2 px-4 border border-amber-900/60 tracking-[0.15em] uppercase text-[11px] transition-colors ${activeTab === "local"
                                ? "bg-gradient-to-b from-amber-900/50 to-amber-950/60 text-amber-100/90 border-amber-700/80"
                                : "bg-gradient-to-b from-stone-800/40 to-stone-900/50 text-amber-100/50 hover:text-amber-100/70"}`, children: "Local" }), _jsx("button", { onClick: () => setActiveTab("cloud"), className: `flex-1 py-2 px-4 border border-amber-900/60 tracking-[0.15em] uppercase text-[11px] transition-colors ${activeTab === "cloud"
                                ? "bg-gradient-to-b from-amber-900/50 to-amber-950/60 text-amber-100/90 border-amber-700/80"
                                : "bg-gradient-to-b from-stone-800/40 to-stone-900/50 text-amber-100/50 hover:text-amber-100/70"}`, children: "Cloud" })] }), _jsx("div", { className: "p-3", children: _jsxs("div", { className: "relative bg-black/80 border border-amber-900/40 min-h-[380px] max-h-[380px] overflow-y-auto", style: {
                            backgroundImage: `repeating-linear-gradient(
                45deg,
                rgba(0, 0, 0, 0.2),
                rgba(0, 0, 0, 0.2) 10px,
                rgba(0, 0, 0, 0.3) 10px,
                rgba(0, 0, 0, 0.3) 20px
              )`
                        }, children: [_jsx("div", { className: "absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-700/40 pointer-events-none z-10" }), _jsx("div", { className: "absolute top-0 right-0 w-3 h-3 border-t border-r border-amber-700/40 pointer-events-none z-10" }), _jsx("div", { className: "absolute bottom-0 left-0 w-3 h-3 border-b border-l border-amber-700/40 pointer-events-none z-10" }), _jsx("div", { className: "absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-700/40 pointer-events-none z-10" }), activeTab === "local" && saves.length > 0 ? (_jsx("div", { className: "p-2 space-y-1", children: saves.map((save) => (_jsxs("button", { onClick: () => setSelectedSave(save), className: `w-full flex items-center gap-3 p-2 group transition-colors ${selectedSave?.id === save.id
                                        ? "bg-amber-900/30 border border-amber-700/60"
                                        : "bg-stone-900/60 border border-transparent hover:bg-stone-800/60 hover:border-amber-900/40"}`, children: [_jsx("div", { className: "w-10 h-8 border border-amber-900/60 flex-shrink-0", style: { backgroundColor: save.flagColor } }), _jsxs("div", { className: "flex-1 text-left", children: [_jsx("div", { className: "text-amber-100/90 tracking-wider", style: { fontSize: '12px' }, children: save.name }), _jsx("div", { className: "text-amber-100/60 tracking-wide", style: { fontSize: '10px' }, children: save.date })] }), _jsx("button", { onClick: (e) => handleDelete(save.id, e), className: "p-2 opacity-0 group-hover:opacity-100 hover:bg-red-900/30 transition-opacity", children: _jsx(Trash2, { className: "w-4 h-4 text-red-500/80" }) })] }, save.id))) })) : activeTab === "cloud" ? (_jsx("div", { className: "flex items-center justify-center min-h-[364px]", children: _jsx("span", { className: "text-amber-100/40 tracking-wider text-[11px]", children: "NO CLOUD SAVES FOUND" }) })) : (_jsx("div", { className: "flex items-center justify-center min-h-[364px]", children: _jsx("span", { className: "text-amber-100/40 tracking-wider text-[11px]", children: "NO SAVES FOUND" }) }))] }) }), _jsxs("div", { className: "flex gap-2 px-3 pb-3", children: [_jsx("div", { className: "flex-1", children: _jsx(MenuButton, { onClick: onBack, children: "Back" }) }), _jsx("div", { className: "flex-1", children: _jsx(MenuButton, { onClick: () => selectedSave && onLoad(selectedSave), disabled: !selectedSave, children: "Load" }) })] })] }) }));
}
//# sourceMappingURL=LoadGameMenu.js.map