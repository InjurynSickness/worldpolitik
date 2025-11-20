import { MenuButton } from "./MenuButton";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface MainMenuProps {
  onSinglePlayer: () => void;
  onInstructions: () => void;
  onOptions: () => void;
  onCredits: () => void;
  onQuit: () => void;
}

export function MainMenu({ onSinglePlayer, onInstructions, onOptions, onCredits, onQuit }: MainMenuProps) {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Background Image */}
      <div className="absolute inset-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1734547458574-62e9eb9d6e33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b3JsZCUyMHdhciUyMG1pbGl0YXJ5JTIwdmludGFnZXxlbnwxfHx8fDE3NjI3OTM2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Background"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for better contrast */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center">
        {/* Main Menu - No background, just buttons */}
        <div className="w-[280px]">
          {/* Menu Items */}
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

          {/* Version Info */}
          <div className="mt-6 text-center text-amber-100/40 text-[10px] tracking-wider">
            v1.12.14 (b3f4)
          </div>
        </div>
      </div>
    </div>
  );
}
