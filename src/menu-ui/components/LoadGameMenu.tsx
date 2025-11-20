import { useState, useEffect } from "react";
import { MenuButton } from "./MenuButton";
import { Trash2 } from "lucide-react";
import { SaveLoadManager } from "../../game/SaveLoadManager";

interface SaveGame {
  id: string;
  name: string;
  date: string;
  country: string;
  flagColor: string;
}

interface LoadGameMenuProps {
  onBack: () => void;
  onConfirmLoad: (slotNumber: number) => void;
}

// Helper to get country color for flag
function getCountryColor(countryName: string): string {
  const colorMap: Record<string, string> = {
    "Germany": "#8B0000",
    "United States": "#1f3a93",
    "United Kingdom": "#012169",
    "France": "#0055A4",
    "Italy": "#008C45",
    "Japan": "#BC002D",
    "Soviet Union": "#DA291C"
  };
  return colorMap[countryName] || "#666666";
}

export function LoadGameMenu({ onBack, onConfirmLoad }: LoadGameMenuProps) {
  const [activeTab, setActiveTab] = useState<"local" | "cloud">("local");
  const [selectedSave, setSelectedSave] = useState<SaveGame | null>(null);
  const [saves, setSaves] = useState<SaveGame[]>([]);

  // Load real saves from localStorage
  useEffect(() => {
    if (activeTab === "local") {
      const loadedSaves: SaveGame[] = [];

      // Check save slots 1-10
      for (let i = 1; i <= 10; i++) {
        const saveData = SaveLoadManager.getSaveData(i);
        if (saveData) {
          const saveDate = new Date(saveData.saveTime);
          const countryName = saveData.gameState.selectedCountryId || "Unknown";
          const dateStr = saveData.gameState.currentDate;

          loadedSaves.push({
            id: i.toString(),
            name: `${countryName} - ${dateStr.year}`,
            date: saveDate.toLocaleString(),
            country: countryName,
            flagColor: getCountryColor(countryName)
          });
        }
      }

      setSaves(loadedSaves);
      if (loadedSaves.length > 0 && !selectedSave) {
        setSelectedSave(loadedSaves[0]);
      }
    }
  }, [activeTab]);

  const handleDelete = (saveId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const slotNumber = parseInt(saveId);
    SaveLoadManager.deleteSave(slotNumber);

    // Refresh saves list
    setSaves(saves.filter(save => save.id !== saveId));
    if (selectedSave?.id === saveId) {
      setSelectedSave(null);
    }
  };

  const handleLoad = () => {
    if (selectedSave) {
      const slotNumber = parseInt(selectedSave.id);
      onConfirmLoad(slotNumber);
    }
  };

  return (
    <div className="relative w-full h-screen flex items-center justify-center">
      <div className="relative w-[420px] bg-gradient-to-b from-stone-900/95 to-black/95 border-2 border-amber-900/60 shadow-2xl">
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-700/80" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-700/80" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-700/80" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-700/80" />

        {/* Tabs */}
        <div className="flex gap-2 p-3 pb-0">
          <button
            onClick={() => setActiveTab("local")}
            className={`flex-1 py-2 px-4 border border-amber-900/60 tracking-[0.15em] uppercase text-[11px] transition-colors ${
              activeTab === "local"
                ? "bg-gradient-to-b from-amber-900/50 to-amber-950/60 text-amber-100/90 border-amber-700/80"
                : "bg-gradient-to-b from-stone-800/40 to-stone-900/50 text-amber-100/50 hover:text-amber-100/70"
            }`}
          >
            Local
          </button>
          <button
            onClick={() => setActiveTab("cloud")}
            className={`flex-1 py-2 px-4 border border-amber-900/60 tracking-[0.15em] uppercase text-[11px] transition-colors ${
              activeTab === "cloud"
                ? "bg-gradient-to-b from-amber-900/50 to-amber-950/60 text-amber-100/90 border-amber-700/80"
                : "bg-gradient-to-b from-stone-800/40 to-stone-900/50 text-amber-100/50 hover:text-amber-100/70"
            }`}
          >
            Cloud
          </button>
        </div>

        {/* Save games list */}
        <div className="p-3">
          <div
            className="relative bg-black/80 border border-amber-900/40 min-h-[380px] max-h-[380px] overflow-y-auto"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                rgba(0, 0, 0, 0.2),
                rgba(0, 0, 0, 0.2) 10px,
                rgba(0, 0, 0, 0.3) 10px,
                rgba(0, 0, 0, 0.3) 20px
              )`
            }}
          >
            {/* Corner decorations for list */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-700/40 pointer-events-none z-10" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-amber-700/40 pointer-events-none z-10" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-amber-700/40 pointer-events-none z-10" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-700/40 pointer-events-none z-10" />

            {activeTab === "local" && saves.length > 0 ? (
              <div className="p-2 space-y-1">
                {saves.map((save) => (
                  <div
                    key={save.id}
                    onClick={() => setSelectedSave(save)}
                    className={`w-full flex items-center gap-3 p-2 group transition-colors cursor-pointer ${
                      selectedSave?.id === save.id
                        ? "bg-amber-900/30 border border-amber-700/60"
                        : "bg-stone-900/60 border border-transparent hover:bg-stone-800/60 hover:border-amber-900/40"
                    }`}
                  >
                    {/* Flag placeholder */}
                    <div
                      className="w-10 h-8 border border-amber-900/60 flex-shrink-0"
                      style={{ backgroundColor: save.flagColor }}
                    />

                    {/* Save info */}
                    <div className="flex-1 text-left">
                      <div className="text-amber-100/90 tracking-wider" style={{ fontSize: '12px' }}>
                        {save.name}
                      </div>
                      <div className="text-amber-100/60 tracking-wide" style={{ fontSize: '10px' }}>
                        {save.date}
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(save.id, e)}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-900/30 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4 text-red-500/80" />
                    </button>
                  </div>
                ))}
              </div>
            ) : activeTab === "cloud" ? (
              <div className="flex items-center justify-center h-full">
                <span className="text-amber-100/40 tracking-wider text-[11px]">
                  NO CLOUD SAVES FOUND
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-amber-100/40 tracking-wider text-[11px]">
                  NO SAVES FOUND
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 px-3 pb-3">
          <div className="flex-1">
            <MenuButton onClick={onBack}>Back</MenuButton>
          </div>
          <div className="flex-1">
            <MenuButton
              onClick={handleLoad}
              disabled={!selectedSave}
            >
              Load
            </MenuButton>
          </div>
        </div>
      </div>
    </div>
  );
}
