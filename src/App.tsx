import React from 'react';
import { MainMenu } from './menu-ui/components/MainMenu';
import { SinglePlayerMenu } from './menu-ui/components/SinglePlayerMenu';
import { LoadGameMenu } from './menu-ui/components/LoadGameMenu';
import { CountrySelection } from './menu-ui/components/CountrySelection';
import { MapSelection } from './menu-ui/components/MapSelection';
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

  const onSinglePlayer = () => {
    setCurrentView('single-player');
  };

  const onNewGame = () => {
    setCurrentView('country-select');
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
  // This gets passed to CountrySelection
  const onStartGame = (country: any) => {
    console.log("Start Game clicked with country:", country);

    // Check if "Other Countries" was selected - go to map view instead
    if (country.id === 'other') {
      setCurrentView('map-select');
      return;
    }

    // Show loading screen with progress
    loadingScreen.show();
    loadingScreen.updateProgress(0, "Initializing game...");

    // Simulate loading steps
    setTimeout(() => loadingScreen.updateProgress(20, "Loading map data..."), 100);
    setTimeout(() => loadingScreen.updateProgress(40, "Initializing countries..."), 300);
    setTimeout(() => loadingScreen.updateProgress(60, "Setting up economy..."), 600);
    setTimeout(() => loadingScreen.updateProgress(80, "Preparing political systems..."), 900);
    setTimeout(() => loadingScreen.updateProgress(95, "Almost ready..."), 1200);

    setTimeout(() => {
        initializeGame(); // Creates window.gameEngine
        loadingScreen.updateProgress(100, "Done!");

        setTimeout(() => {
          loadingScreen.hide();
          // Hide React UI
          const root = document.getElementById('root');
          if (root) (root as HTMLElement).style.display = 'none';
        }, 300);
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
         initializeGame(); // Creates window.gameEngine

         // Load the saved game state into the engine
         (window as any).gameEngine?.loadGameFromSlot(slotNumber);

         loadingScreen.updateProgress(100, "Loaded!");

         setTimeout(() => {
           loadingScreen.hide();
           // Hide React UI
           const root = document.getElementById('root');
           if (root) (root as HTMLElement).style.display = 'none';
         }, 300);
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
        return <SinglePlayerMenu onNewGame={onNewGame} onLoadGame={onLoadGame} onBack={onBackToMain} />;

      case 'load':
        return <LoadGameMenu onBack={onBackToSinglePlayer} onConfirmLoad={onConfirmLoad} />;

      case 'country-select':
        return <CountrySelection onBack={onBackToSinglePlayer} onSelectCountry={onStartGame} />;

      case 'map-select':
        return <MapSelection onBack={onBackToSinglePlayer} onSelectCountry={(countryId) => {
          // When a country is selected from the map, start the game
          onStartGame({ id: countryId, name: countryId });
        }} />;

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

  return renderView();
}