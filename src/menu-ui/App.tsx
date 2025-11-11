import { MenuButton } from "./components/MenuButton";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import { SinglePlayerMenu } from "./components/SinglePlayerMenu";
import { CountrySelection } from "./components/CountrySelection";
import { LoadGameMenu } from "./components/LoadGameMenu";
import { useState } from "react";

type Screen = "main" | "singleplayer" | "countryselection" | "loadgame";

// Define the prop interface
interface AppProps {
  // We can use `any` for now, or be more specific if you export GameCoordinator's type
  gameCoordinator: any; 
}

export default function App({ gameCoordinator }: AppProps) {
  const [currentScreen, setCurrentScreen] = useState<Screen>("main");

  const handleMenuClick = (option: string) => {
    // This function can be kept for buttons you haven't wired up yet
    console.log(`${option} clicked`);
  };

  const handleSelectCountry = (country: any) => {
    console.log("Selected country:", country);
    // Start the game with the selected country ID
    gameCoordinator.startNewGame(country.id);
  };

  const handleLoadGame = (saveGame: any) => {
    console.log("Loading save game:", saveGame);
    // Load the selected save game
    // Ensure saveGame.id is a number
    gameCoordinator.loadGameFromMenu(Number(saveGame.id));
  };
  
  const handleContinueGame = () => {
    console.log("Continuing game from autosave...");
    gameCoordinator.continueGame(); // This loads slot 0
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Background Image */}
      <div className="absolute inset-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1734547458574-62e9eb9d6e33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b3JsZCUyMHdhciUyMG1pbGl0YXJ5JTIwdmludGFnZXxlbnwxfHx8fDE3NjI3OTM2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Background"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for better contrast */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full">
        {currentScreen === "main" && (
          <div className="h-full flex items-center justify-center">
            {/* Main Menu - No background, just buttons */}
            <div className="w-[280px]">
              {/* Menu Items */}
              <div className="space-y-1">
                
                {/* --- ADDED CONTINUE BUTTON --- */}
                {gameCoordinator.hasAutoSave() && (
                    <MenuButton onClick={handleContinueGame}>
                      Continue
                    </MenuButton>
                )}
                
                <MenuButton onClick={() => setCurrentScreen("singleplayer")}>
                  Single Player
                </MenuButton>
                <MenuButton onClick={() => handleMenuClick("Instructions")}>
                  Instructions
                </MenuButton>
                <MenuButton onClick={() => handleMenuClick("Options")}>
                  Options
                </MenuButton>
                <MenuButton onClick={() => handleMenuClick("Credits")}>
                  Credits
                </MenuButton>
                
                {/* Separator */}
                <div className="py-2">
                  <div className="h-[1px] bg-gradient-to-r from-transparent via-amber-900/30 to-transparent" />
                </div>
                
                <MenuButton onClick={() => handleMenuClick("Quit")}>
                  Quit
                </MenuButton>
              </div>

              {/* Version Info */}
              <div className="mt-6 text-center text-amber-100/40 text-[10px] tracking-wider">
                v1.12.14 (b3f4)
              </div>
            </div>
          </div>
        )}

        {currentScreen === "singleplayer" && (
          <SinglePlayerMenu
            onBack={() => setCurrentScreen("main")}
            onNewGame={() => setCurrentScreen("countryselection")}
            onLoadGame={() => setCurrentScreen("loadgame")}
          />
        )}

        {currentScreen === "countryselection" && (
          <CountrySelection
            onBack={() => setCurrentScreen("singleplayer")}
            onSelectCountry={handleSelectCountry}
          />
        )}

        {currentScreen === "loadgame" && (
          <LoadGameMenu
            onBack={() => setCurrentScreen("singleplayer")}
            onLoad={handleLoadGame}
            gameCoordinator={gameCoordinator} // <-- Pass coordinator down
          />
        )}
      </div>
    </div>
  );
}