import { MenuButton } from "./MenuButton";

interface SinglePlayerMenuProps {
  onBack: () => void;
  onNewGame: () => void;
  onLoadGame: () => void;
}

export function SinglePlayerMenu({ onBack, onNewGame, onLoadGame }: SinglePlayerMenuProps) {
  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-cover bg-center"
         style={{ backgroundImage: "url('/background.png')" }}>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Menu container */}
      <div className="relative z-10 w-[280px]">
        <div className="space-y-1">
          <MenuButton onClick={onNewGame}>New Game</MenuButton>
          <MenuButton onClick={onLoadGame}>Load Game</MenuButton>

          {/* Separator */}
          <div className="py-2">
            <div className="h-[1px] bg-gradient-to-r from-transparent via-amber-900/30 to-transparent" />
          </div>

          <MenuButton onClick={onBack}>Back</MenuButton>
        </div>
      </div>
    </div>
  );
}
