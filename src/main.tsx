import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css' // Your Tailwind CSS entry point
import './menu-ui/styles/globals.css' // Figma design system

// --- VERSION TRACKING ---
import { logVersion } from './version.js';

// --- IMPORT YOUR GAME LOGIC ---
// We add .js because that's what they compile to
import { initializeFullGame } from './gameInit.js';
import { LoadingScreen } from './loadingScreen.js';
import { logger } from './utils/Logger.js';

// Log version first for debugging
logVersion();

logger.info('main', '🚀 main.tsx starting execution');

// --- CREATE GAME FUNCTIONS ---
// This creates the loading screen and attaches it to the body
logger.info('main', 'Creating LoadingScreen');
const loadingScreen = new LoadingScreen(document.body);
logger.info('main', 'LoadingScreen created');

// This creates a function that can initialize the game
const initializeGame = (): void => {
    logger.info('main', '🎮 initializeGame wrapper called');
    logger.time('main', 'Full game initialization');
    initializeFullGame();
    logger.timeEnd('main', 'Full game initialization');
};

// --- RENDER THE APP ---
// This renders your React App and "injects" the game
// functions as props, so your components can use them.
logger.info('main', 'Creating React root and rendering App');
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App
      initializeGame={initializeGame}
      loadingScreen={loadingScreen}
    />
  </React.StrictMode>,
)
logger.info('main', '✅ React App rendered successfully');