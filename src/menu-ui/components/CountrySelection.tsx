import { useState } from "react";
import { CountryCard } from "./CountryCard";
import { MenuButton } from "./MenuButton";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface Country {
  id: string;
  name: string;
  leaderName: string;
  leaderImage: string;
  flagImage: string;
  ideology: string;
  government: string;
  elections: string;
  rulingParty: string;
  briefHistory: string;
}

const COUNTRIES: Country[] = [
  {
    id: "france",
    name: "France",
    leaderName: "Édouard Daladier",
    leaderImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop",
    flagImage: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=300&h=150&fit=crop",
    ideology: "Democracy",
    government: "Democratic Republic",
    elections: "1940",
    rulingParty: "Radical Socialist Party",
    briefHistory: "France stands as one of the great powers of Europe. The scars of the Great War still mark the nation, and the rising threat from across the Rhine demands vigilance."
  },
  {
    id: "usa",
    name: "United States",
    leaderName: "Franklin D. Roosevelt",
    leaderImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=400&fit=crop",
    flagImage: "https://images.unsplash.com/photo-1485711138408-dfad48f5c4e8?w=300&h=150&fit=crop",
    ideology: "Democracy",
    government: "Democratic Republic",
    elections: "1940",
    rulingParty: "Democratic Party",
    briefHistory: "The United States remains isolationist, focused on recovering from the Great Depression. Yet the winds of war may soon force a reckoning."
  },
  {
    id: "uk",
    name: "United Kingdom",
    leaderName: "Neville Chamberlain",
    leaderImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=400&fit=crop",
    flagImage: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=300&h=150&fit=crop",
    ideology: "Democracy",
    government: "Constitutional Monarchy",
    elections: "1940",
    rulingParty: "Conservative Party",
    briefHistory: "The British Empire spans the globe, but faces unprecedented challenges. The policy of appeasement has bought time, but at what cost?"
  },
  {
    id: "germany",
    name: "German Reich",
    leaderName: "Adolf Hitler",
    leaderImage: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=300&h=400&fit=crop",
    flagImage: "https://images.unsplash.com/photo-1467632499275-7a693a761056?w=300&h=150&fit=crop",
    ideology: "Fascist",
    government: "Totalitarian Regime",
    elections: "Never",
    rulingParty: "NSDAP",
    briefHistory: "A new Germany has risen. Three years have passed since the Weimar Republic was dismantled and replaced by Hitler's Third Reich. Economic stability has returned after the trying years of the Great Depression, and mass unemployment has been dealt with."
  },
  {
    id: "italy",
    name: "Italy",
    leaderName: "Benito Mussolini",
    leaderImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=400&fit=crop",
    flagImage: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=300&h=150&fit=crop",
    ideology: "Fascist",
    government: "Fascist Regime",
    elections: "Never",
    rulingParty: "Partito Nazionale Fascista",
    briefHistory: "Mussolini's Italy seeks to restore the glory of Rome. Recent conquests in Africa have emboldened the regime's imperial ambitions."
  },
  {
    id: "japan",
    name: "Japan",
    leaderName: "Hirohito",
    leaderImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=400&fit=crop",
    flagImage: "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=300&h=150&fit=crop",
    ideology: "Fascist",
    government: "Absolute Monarchy",
    elections: "Never",
    rulingParty: "Imperial Rule",
    briefHistory: "The Empire of the Rising Sun expands its control over Asia. The military holds tremendous power, driving an aggressive expansionist policy."
  },
  {
    id: "soviet",
    name: "Soviet Union",
    leaderName: "Joseph Stalin",
    leaderImage: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&h=400&fit=crop",
    flagImage: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=300&h=150&fit=crop",
    ideology: "Communist",
    government: "Communist Regime",
    elections: "Never",
    rulingParty: "Communist Party",
    briefHistory: "Stalin's iron grip controls the Soviet Union. Industrial might grows through Five-Year Plans, though at tremendous human cost."
  },
  {
    id: "other",
    name: "Other countries",
    leaderName: "Unknown",
    leaderImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop",
    flagImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=150&fit=crop",
    ideology: "Various",
    government: "Various",
    elections: "Varies",
    rulingParty: "Various",
    briefHistory: "Many other nations await your leadership. Each faces unique challenges and opportunities in the coming conflict."
  }
];

interface CountrySelectionProps {
  onBack: () => void;
  onSelectCountry: (country: Country) => void;
}

export function CountrySelection({ onBack, onSelectCountry }: CountrySelectionProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(COUNTRIES[3]); // Default to Germany

  return (
    <div className="relative w-full h-screen bg-black/90 p-4">
      {/* Top row - Major powers */}
      <div className="flex justify-center gap-3 mb-3">
        {COUNTRIES.slice(0, 8).map((country) => (
          <CountryCard
            key={country.id}
            name={country.name}
            leaderImage={country.leaderImage}
            flagImage={country.flagImage}
            isSelected={selectedCountry?.id === country.id}
            onClick={() => setSelectedCountry(country)}
          />
        ))}
      </div>

      {/* Selected country details */}
      {selectedCountry && (
        <div className="mt-8 max-w-6xl mx-auto">
          {/* Country name header */}
          <div className="text-center mb-6">
            <h2 className="text-amber-100/80 tracking-[0.3em] uppercase text-[13px]">
              {selectedCountry.name}
            </h2>
          </div>

          {/* Main info panel */}
          <div className="flex gap-6 justify-center items-start">
            {/* Information panel */}
            <div className="relative w-[280px] bg-gradient-to-b from-amber-100/95 to-amber-50/95 border-2 border-amber-900/80 p-4">
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-900" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-900" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-900" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-900" />
              
              <h3 className="text-center tracking-[0.2em] uppercase mb-4 text-stone-900 text-[12px]">
                Information
              </h3>
              
              <div className="space-y-2 text-stone-900" style={{ fontSize: '11px' }}>
                <div>
                  <span className="block tracking-wider">Leader</span>
                  <span className="block ml-2">{selectedCountry.leaderName}</span>
                </div>
                <div>
                  <span className="block tracking-wider">Ideology</span>
                  <span className="block ml-2">{selectedCountry.ideology}</span>
                </div>
                <div>
                  <span className="block tracking-wider">Government</span>
                  <span className="block ml-2">{selectedCountry.government}</span>
                </div>
                <div>
                  <span className="block tracking-wider">Elections</span>
                  <span className="block ml-2">{selectedCountry.elections}</span>
                </div>
                <div>
                  <span className="block tracking-wider">Ruling Party</span>
                  <span className="block ml-2">{selectedCountry.rulingParty}</span>
                </div>
              </div>
            </div>

            {/* Center - Leader portrait and emblems */}
            <div className="flex flex-col items-center gap-4">
              {/* Leader portrait */}
              <div className="relative w-[140px] h-[180px] bg-gradient-to-b from-stone-800 to-stone-900 border-2 border-amber-900/80">
                <ImageWithFallback
                  src={selectedCountry.leaderImage}
                  alt={selectedCountry.leaderName}
                  className="w-full h-full object-cover"
                />
                {/* Corner decorations */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-700" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-700" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-700" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-700" />
              </div>

              {/* Placeholder emblems/achievements */}
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-16 h-16 bg-gradient-to-b from-stone-800 to-stone-900 border border-amber-900/60 flex items-center justify-center"
                  >
                    <span className="text-amber-700/50 text-[20px]">★</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Brief History panel */}
            <div className="relative w-[340px] bg-gradient-to-b from-amber-100/95 to-amber-50/95 border-2 border-amber-900/80 p-4">
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-900" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-900" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-900" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-900" />
              
              <h3 className="text-center tracking-[0.2em] uppercase mb-4 text-stone-900 text-[12px]">
                Brief History
              </h3>
              
              <p className="text-stone-900 leading-relaxed" style={{ fontSize: '11px' }}>
                {selectedCountry.briefHistory}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-center gap-6 mt-8">
            <div className="w-[160px]">
              <MenuButton onClick={onBack}>Back</MenuButton>
            </div>
            <div className="w-[160px]">
              <MenuButton onClick={() => onSelectCountry(selectedCountry)}>
                Select Country
              </MenuButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
