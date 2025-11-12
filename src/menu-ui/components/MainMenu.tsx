import { MenuButton } from "./MenuButton";

interface MainMenuProps {
  onSinglePlayer: () => void;
  onInstructions: () => void;
  onOptions: () => void;
  onCredits: () => void;
  onQuit: () => void;
}

export function MainMenu({ onSinglePlayer, onInstructions, onOptions, onCredits, onQuit }: MainMenuProps) {
  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-cover bg-center"
         style={{ backgroundImage: "url('/background.png')" }}>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Menu container */}
      <div className="relative z-10 w-[280px]">
        <div className="space-y-1">
          <MenuButton onClick={onSinglePlayer}>Single Player</MenuButton>
          <MenuButton onClick={onInstructions}>Instructions</MenuButton>
          <MenuButton onClick={onOptions}>Options</MenuButton>
          <MenuButton onClick={onCredits}>Credits</MenuButton>

          {/* Separator */}
          <div className="py-2">
            <div className="h-[1px] bg-gradient-to-r from-transparent via-amber-900/30 to-transparent" />
          </div>

          <MenuButton onClick={onQuit}>Quit</MenuButton>
        </div>

        {/* Version number */}
        <div className="mt-4 text-center text-amber-100/40 text-[10px] tracking-widest">
          v1.12.14 (b3f4)
        </div>
      </div>
    </div>
  );
}
