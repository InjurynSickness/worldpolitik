import React from 'react';
import { MenuButton } from './MenuButton';
import { CountryCard } from './CountryCard';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";

// --- Define props ---
interface CountrySelectionProps {
  onBack: () => void;
  onStartGame: () => void;
}

export function CountrySelection({ onBack, onStartGame }: CountrySelectionProps) {
  const [selectedCountry, setSelectedCountry] = React.useState<string | null>(null);

  // Mock country data
  const countries = [
    { id: 'USA', name: 'United States', flag: '🇺🇸' },
    { id: 'CHN', name: 'China', flag: '🇨🇳' },
    { id: 'RUS', name: 'Russia', flag: '🇷🇺' },
    { id: 'DEU', name: 'Germany', flag: '🇩🇪' },
    { id: 'GBR', name: 'United Kingdom', flag: '🇬🇧' },
  ];

  return (
    <Card className="w-[600px] bg-black/80 border-gray-700 text-white">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Select Country</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] p-4">
          <div className="grid grid-cols-2 gap-4">
            {countries.map((country) => (
              <CountryCard
                key={country.id}
                country={country}
                isSelected={selectedCountry === country.id}
                onClick={() => setSelectedCountry(country.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-between">
        <MenuButton label="Back" onClick={onBack} />
        <MenuButton 
          label="Start Game" 
          onClick={onStartGame} // --- Use the new prop ---
          disabled={!selectedCountry} 
        />
      </CardFooter>
    </Card>
  );
}