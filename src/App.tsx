import React from 'react';
import './styles/globals.css';
import { SinglePlayerMenu } from './components/SinglePlayerMenu';
import { LoadGameMenu } from './components/LoadGameMenu';
import { CountrySelection } from './components/CountrySelection';
// --- IMPORT GAME TYPES ---
import { GameState } from './types.js';
import { LoadingScreen } from './loadingScreen.js';

// --- Define the props App will receive from main.tsx ---
interface AppProps {
  initializeGame: () => GameState;
  loadingScreen: LoadingScreen;
}

// --- App component ---
export default function App({ initializeGame, loadingScreen }: AppProps) {
  const [currentView, setCurrentView] = React.useState('main');

  const onNewGame = () => {
    setCurrentView('country-select');
  };

  const onLoadGame = () => {
    setCurrentView('load');
  };

  const onBack = () => {
    setCurrentView('main');
  };

  // --- START GAME function ---
  // This gets passed to CountrySelection
  const onStartGame = () => {
    console.log("Start Game clicked");
    loadingScreen.show();
    loadingScreen.updateProgress(10, "Loading Game...");

    setTimeout(() => {
        initializeGame(); // Creates window.gameEngine
        loadingScreen.updateProgress(100, "Done");
        loadingScreen.hide();
        // Hide React UI
        const root = document.getElementById('root');
        if (root) (root as HTMLElement).style.display = 'none';
    }, 50);
  };

  // --- LOAD GAME function ---
  // This gets passed to LoadGameMenu
  const onConfirmLoad = () => {
     console.log("Load Game confirmed");
     loadingScreen.show();
     loadingScreen.updateProgress(10, "Initializing...");

     setTimeout(() => {
         initializeGame(); // Creates window.gameEngine
         (window as any).gameEngine?.showLoadDialog();
         loadingScreen.hide();
         // Hide React UI
         const root = document.getElementById('root');
         if (root) (root as HTMLElement).style.display = 'none';
     }, 50);
  };

  // --- Render the correct menu ---
  const renderView = () => {
    switch (currentView) {
      case 'main':
        return <SinglePlayerMenu onNewGame={onNewGame} onLoadGame={onLoadGame} />;
      
      case 'load':
        return <LoadGameMenu onBack={onBack} onConfirmLoad={onConfirmLoad} />;
      
      case 'country-select':
        return <CountrySelection onBack={onBack} onStartGame={onStartGame} />;
      
      default:
        return <SinglePlayerMenu onNewGame={onNewGame} onLoadGame={onLoadGame} />;
    }
  };

  // I removed the .app-container wrapper to let your components
  // be the top-level item, which is better for your CSS.
  return renderView();
}