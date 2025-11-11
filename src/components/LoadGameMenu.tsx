import React from 'react';
import { MenuButton } from './MenuButton';
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card";

// --- Define props ---
interface LoadGameMenuProps {
  onBack: () => void;
  onConfirmLoad: () => void;
}

export function LoadGameMenu({ onBack, onConfirmLoad }: LoadGameMenuProps) {
  // Mock save slots
  const saveSlots = [
    { id: 1, name: "Save 1", date: "2025-11-10" },
    { id: 2, name: "Save 2", date: "2025-11-09" },
    { id: 3, name: "Empty Slot", date: null },
  ];

  return (
    <Card className="w-[450px] bg-black/80 border-gray-700 text-white">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Load Game</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {saveSlots.map((slot) => (
            <Button
              key={slot.id}
              variant="outline"
              className="w-full h-16 justify-between p-4 bg-gray-800/50 border-gray-600 hover:bg-gray-700/50"
              disabled={!slot.date}
              onClick={onConfirmLoad} // --- Use the new prop ---
            >
              <div className="text-left">
                <p className="font-bold">{slot.name}</p>
                <p className="text-xs text-gray-400">{slot.date ?? '---'}</p>
              </div>
              {slot.date && <span className="text-sm">Select</span>}
            </Button>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <MenuButton label="Back" onClick={onBack} />
      </CardFooter>
    </Card>
  );
}