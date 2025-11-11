import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MenuButton } from "./components/MenuButton";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import { SinglePlayerMenu } from "./components/SinglePlayerMenu";
import { CountrySelection } from "./components/CountrySelection";
import { LoadGameMenu } from "./components/LoadGameMenu";
import { useState } from "react";
export default function App({ gameCoordinator }) {
    const [currentScreen, setCurrentScreen] = useState("main");
    const handleMenuClick = (option) => {
        // This function can be kept for buttons you haven't wired up yet
        console.log(`${option} clicked`);
    };
    const handleSelectCountry = (country) => {
        console.log("Selected country:", country);
        // Start the game with the selected country ID
        gameCoordinator.startNewGame(country.id);
    };
    const handleLoadGame = (saveGame) => {
        console.log("Loading save game:", saveGame);
        // Load the selected save game
        // Ensure saveGame.id is a number
        gameCoordinator.loadGameFromMenu(Number(saveGame.id));
    };
    const handleContinueGame = () => {
        console.log("Continuing game from autosave...");
        gameCoordinator.continueGame(); // This loads slot 0
    };
    return (_jsxs("div", { className: "relative w-full h-screen overflow-hidden bg-black", children: [_jsxs("div", { className: "absolute inset-0", children: [_jsx(ImageWithFallback, { src: "https://images.unsplash.com/photo-1734547458574-62e9eb9d6e33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b3JsZCUyMHdhciUyMG1pbGl0YXJ5JTIwdmludGFnZXxlbnwxfHx8fDE3NjI3OTM2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", alt: "Background", className: "w-full h-full object-cover" }), _jsx("div", { className: "absolute inset-0 bg-black/40" })] }), _jsxs("div", { className: "relative z-10 h-full", children: [currentScreen === "main" && (_jsx("div", { className: "h-full flex items-center justify-center", children: _jsxs("div", { className: "w-[280px]", children: [_jsxs("div", { className: "space-y-1", children: [gameCoordinator.hasAutoSave() && (_jsx(MenuButton, { onClick: handleContinueGame, children: "Continue" })), _jsx(MenuButton, { onClick: () => setCurrentScreen("singleplayer"), children: "Single Player" }), _jsx(MenuButton, { onClick: () => handleMenuClick("Instructions"), children: "Instructions" }), _jsx(MenuButton, { onClick: () => handleMenuClick("Options"), children: "Options" }), _jsx(MenuButton, { onClick: () => handleMenuClick("Credits"), children: "Credits" }), _jsx("div", { className: "py-2", children: _jsx("div", { className: "h-[1px] bg-gradient-to-r from-transparent via-amber-900/30 to-transparent" }) }), _jsx(MenuButton, { onClick: () => handleMenuClick("Quit"), children: "Quit" })] }), _jsx("div", { className: "mt-6 text-center text-amber-100/40 text-[10px] tracking-wider", children: "v1.12.14 (b3f4)" })] }) })), currentScreen === "singleplayer" && (_jsx(SinglePlayerMenu, { onBack: () => setCurrentScreen("main"), onNewGame: () => setCurrentScreen("countryselection"), onLoadGame: () => setCurrentScreen("loadgame") })), currentScreen === "countryselection" && (_jsx(CountrySelection, { onBack: () => setCurrentScreen("singleplayer"), onSelectCountry: handleSelectCountry })), currentScreen === "loadgame" && (_jsx(LoadGameMenu, { onBack: () => setCurrentScreen("singleplayer"), onLoad: handleLoadGame, gameCoordinator: gameCoordinator }))] })] }));
}
//# sourceMappingURL=App.js.map