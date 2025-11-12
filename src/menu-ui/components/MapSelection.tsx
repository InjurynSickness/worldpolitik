import { useState } from "react";
import { MenuButton } from "./MenuButton";

interface MapSelectionProps {
  onBack: () => void;
  onSelectCountry: (countryId: string) => void;
}

export function MapSelection({ onBack, onSelectCountry }: MapSelectionProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  return (
    <div className="relative w-full h-screen bg-cover bg-center"
         style={{ backgroundImage: "url('/background.png')" }}>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Header */}
        <div className="p-6 text-center">
          <h1 className="text-amber-100/90 tracking-[0.3em] uppercase text-[16px]">
            Select a Country
          </h1>
          <p className="text-amber-100/60 tracking-wider text-[11px] mt-2">
            Click on the map to choose your nation
          </p>
        </div>

        {/* Map placeholder - will be replaced with actual game map */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-[800px] h-[500px] bg-gradient-to-b from-stone-900/90 to-black/90 border-2 border-amber-900/60 flex items-center justify-center">
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-amber-700/80" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-amber-700/80" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-amber-700/80" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-amber-700/80" />

              {/* Map canvas will go here */}
              <div className="text-amber-100/40 tracking-wider text-[13px]">
                <p className="mb-4">Interactive map coming soon!</p>
                <p className="text-[11px]">For now, please select a country from the main selection screen.</p>
              </div>
            </div>

            {hoveredCountry && (
              <div className="mt-4 text-amber-100/80 tracking-wider text-[12px]">
                {hoveredCountry}
              </div>
            )}
          </div>
        </div>

        {/* Back button */}
        <div className="p-6 flex justify-center">
          <div className="w-[200px]">
            <MenuButton onClick={onBack}>Back to Selection</MenuButton>
          </div>
        </div>
      </div>
    </div>
  );
}
