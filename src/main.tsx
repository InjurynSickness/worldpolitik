import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css' // Your Tailwind CSS entry point

// --- IMPORT YOUR GAME LOGIC ---
// We add .js because that's what they compile to
import { GameStateInitializer } from './game/GameStateInitializer.js';
import { LoadingScreen } from './loadingScreen.js';
import { GameState } from './types.js';

// --- CREATE GAME FUNCTIONS ---
// This creates the loading screen and attaches it to the body
const loadingScreen = new LoadingScreen(document.body);

// This creates a function that can initialize the game
const initializeGame = (): GameState => {
    return GameStateInitializer.initializeGameState();
};

// --- RENDER THE APP ---
// This renders your React App and "injects" the game
// functions as props, so your components can use them.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App 
      initializeGame={initializeGame}
      loadingScreen={loadingScreen}
    />
  </React.StrictMode>,
)