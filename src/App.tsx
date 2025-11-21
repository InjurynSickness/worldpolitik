import React from 'react';
import { MainMenu } from './menu-ui/components/MainMenu';
import { SinglePlayerMenu } from './menu-ui/components/SinglePlayerMenu';
import { LoadGameMenu } from './menu-ui/components/LoadGameMenu';
import { CountrySelection } from './menu-ui/components/CountrySelection';
import { InteractiveCountrySelection } from './menu-ui/components/InteractiveCountrySelection';
import { ImageWithFallback } from './menu-ui/components/figma/ImageWithFallback';
import { FigmaLoadingScreen } from './menu-ui/components/FigmaLoadingScreen';
// --- IMPORT GAME TYPES ---
import { LoadingScreen } from './loadingScreen.js';

// --- Define the props App will receive from main.tsx ---
interface AppProps {
  initializeGame: () => void;
  loadingScreen: LoadingScreen;
}

// --- App component ---
export default function App({ initializeGame, loadingScreen }: AppProps) {
  const [currentView, setCurrentView] = React.useState('main-menu');
  const [showFigmaLoading, setShowFigmaLoading] = React.useState(false);
  const [loadingProgress, setLoadingProgress] = React.useState(0);
  const [loadingMessage, setLoadingMessage] = React.useState('');

  const onSinglePlayer = () => {
    setCurrentView('single-player');
  };

  const onNewGame = () => {
    // Show portrait selection screen (8 major nations)
    setCurrentView('portrait-select');
  };

  // Called when user selects a country from the portrait screen
  const onSelectFromPortraits = (country: any) => {
    if (country.id === 'other') {
      // User wants to select from all 192 countries - show interactive map
      setShowFigmaLoading(true);
      setLoadingProgress(0);
      setLoadingMessage("LOADING SPRITES");
      setCurrentView('country-select');

      // Smooth VISUAL progress 0-90% (not tied to actual loading)
      // Map will report 100% when actually ready
      setTimeout(() => { setLoadingProgress(15); setLoadingMessage("INITIALIZING MAP"); }, 200);
      setTimeout(() => { setLoadingProgress(30); setLoadingMessage("LOADING PROVINCES"); }, 500);
      setTimeout(() => { setLoadingProgress(45); setLoadingMessage("LOADING TERRAIN"); }, 900);
      setTimeout(() => { setLoadingProgress(60); setLoadingMessage("LOADING RIVERS"); }, 1400);
      setTimeout(() => { setLoadingProgress(75); setLoadingMessage("BUILDING MAP"); }, 2000);
      setTimeout(() => { setLoadingProgress(90); setLoadingMessage("ALMOST READY"); }, 2700);
      // Will jump to 100% when map calls onMapLoadingProgress(100)
    } else {
      // User selected a major nation - start game directly
      onStartGame(country.id);
    }
  };

  // Called by InteractiveCountrySelection to update loading progress
  const onMapLoadingProgress = (progress: number, message: string) => {
    setLoadingProgress(progress);
    setLoadingMessage(message);
  };

  // Called when the InteractiveCountrySelection map is fully loaded
  const onCountrySelectionMapReady = () => {
    console.log("Country selection map is fully ready");
    // InteractiveCountrySelection already set progress to 100%, just hide after brief delay
    setTimeout(() => {
      setShowFigmaLoading(false);
    }, 300);
  };

  const onLoadGame = () => {
    setCurrentView('load');
  };

  const onBackToMain = () => {
    setCurrentView('main-menu');
  };

  const onBackToSinglePlayer = () => {
    setCurrentView('single-player');
  };

  // --- START GAME function ---
  // This gets passed to InteractiveCountrySelection
  const onStartGame = (countryId: string) => {
    console.log("Start Game clicked with country ID:", countryId);

    // Store the selected country ID so we can set it after initialization
    const selectedCountryId = countryId;

    // Show Figma loading screen
    setShowFigmaLoading(true);
    setLoadingProgress(0);
    setLoadingMessage("INITIALIZING GAME");

    // Smooth progress animation from 0 to 95 (map reports 100 when ready)
    const startTime = Date.now();
    const progressDuration = 3000; // 3 seconds to reach 95%
    const maxProgress = 95;

    const animateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / progressDuration) * maxProgress, maxProgress);

      setLoadingProgress(Math.floor(progress));

      // Update message based on progress
      if (progress < 20) {
        setLoadingMessage("INITIALIZING GAME");
      } else if (progress < 40) {
        setLoadingMessage("LOADING MAP DATA");
      } else if (progress < 60) {
        setLoadingMessage("INITIALIZING COUNTRIES");
      } else if (progress < 80) {
        setLoadingMessage("SETTING UP ECONOMY");
      } else {
        setLoadingMessage("ALMOST READY");
      }

      if (progress < maxProgress) {
        requestAnimationFrame(animateProgress);
      }
    };

    requestAnimationFrame(animateProgress);

    setTimeout(() => {
        try {
          console.log("Calling initializeGame()...");

          // Set up callback for when map is ready
          (window as any).onMapReady = () => {
            console.log("Map ready - hiding loading screen");

            // Set the player's selected country
            if ((window as any).gameEngine) {
              const gameState = (window as any).gameEngine.getGameState();
              gameState.selectedCountryId = selectedCountryId;
              console.log("Player is now playing as:", selectedCountryId);

              // Update UI to show the selected country's info
              if ((window as any).uiManager) {
                (window as any).uiManager.updateCountryInfo();
              }
            }

            setLoadingProgress(100);
            setLoadingMessage("DONE!");

            setTimeout(() => {
              setShowFigmaLoading(false);
              // Hide React UI
              const root = document.getElementById('root');
              if (root) (root as HTMLElement).style.display = 'none';
              // Clean up callback
              delete (window as any).onMapReady;
            }, 300);
          };

          initializeGame(); // Creates window.gameEngine and starts loading map
          console.log("initializeGame() completed successfully - waiting for map to load...");
        } catch (error) {
          console.error("Error initializing game:", error);
          setShowFigmaLoading(false);
          alert("Failed to initialize game. Check console for details.\n\n" + error);
          delete (window as any).onMapReady;
        }
    }, 1500);
  };

  // --- LOAD GAME function ---
  // This gets passed to LoadGameMenu
  const onConfirmLoad = (slotNumber: number) => {
     console.log("Loading game from slot:", slotNumber);

     loadingScreen.show();
     loadingScreen.updateProgress(0, "Loading save data...");

     setTimeout(() => loadingScreen.updateProgress(30, "Restoring game state..."), 100);
     setTimeout(() => loadingScreen.updateProgress(60, "Initializing world..."), 300);
     setTimeout(() => loadingScreen.updateProgress(90, "Almost done..."), 600);

     setTimeout(() => {
         // Set up callback for when map is ready
         (window as any).onMapReady = () => {
           console.log("Map ready - loading save and hiding loading screen");

           // Load the saved game state into the engine
           (window as any).gameEngine?.loadGameFromSlot(slotNumber);

           loadingScreen.updateProgress(100, "Loaded!");

           setTimeout(() => {
             loadingScreen.hide();
             // Hide React UI
             const root = document.getElementById('root');
             if (root) (root as HTMLElement).style.display = 'none';
             // Clean up callback
             delete (window as any).onMapReady;
           }, 300);
         };

         initializeGame(); // Creates window.gameEngine and starts loading map
     }, 900);
  };

  // --- Render the correct menu ---
  const renderView = () => {
    switch (currentView) {
      case 'main-menu':
        return (
          <MainMenu
            onSinglePlayer={onSinglePlayer}
            onInstructions={() => alert('Instructions coming soon!')}
            onOptions={() => alert('Options coming soon!')}
            onCredits={() => alert('Credits coming soon!')}
            onQuit={() => window.close()}
          />
        );

      case 'single-player':
        return (
          <div className="relative w-full h-screen overflow-hidden bg-black">
            <div className="absolute inset-0">
              <ImageWithFallback
                src="/background.png"
                alt="Background"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40" />
            </div>
            <div className="relative z-10">
              <SinglePlayerMenu onNewGame={onNewGame} onLoadGame={onLoadGame} onBack={onBackToMain} />
            </div>
          </div>
        );

      case 'load':
        return (
          <div className="relative w-full h-screen overflow-hidden bg-black">
            <div className="absolute inset-0">
              <ImageWithFallback
                src="/background.png"
                alt="Background"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40" />
            </div>
            <div className="relative z-10">
              <LoadGameMenu onBack={onBackToSinglePlayer} onConfirmLoad={onConfirmLoad} />
            </div>
          </div>
        );

      case 'portrait-select':
        return (
          <div className="relative w-full h-screen overflow-hidden bg-black">
            <div className="absolute inset-0">
              <ImageWithFallback
                src="/background.png"
                alt="Background"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40" />
            </div>
            <div className="relative z-10">
              <CountrySelection onBack={onBackToSinglePlayer} onSelectCountry={onSelectFromPortraits} />
            </div>
          </div>
        );

      case 'country-select':
        return <InteractiveCountrySelection onBack={onBackToSinglePlayer} onSelectCountry={onStartGame} onMapReady={onCountrySelectionMapReady} onLoadingProgress={onMapLoadingProgress} />;

      default:
        return (
          <MainMenu
            onSinglePlayer={onSinglePlayer}
            onInstructions={() => alert('Instructions coming soon!')}
            onOptions={() => alert('Options coming soon!')}
            onCredits={() => alert('Credits coming soon!')}
            onQuit={() => window.close()}
          />
        );
    }
  };

  return (
    <>
      {renderView()}
      {showFigmaLoading && (
        <div className="fixed inset-0 z-50">
          <FigmaLoadingScreen
            progress={loadingProgress}
            message={loadingMessage}
          />
        </div>
      )}
    </>
  );
}