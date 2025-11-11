interface SaveGame {
    id: string;
    name: string;
    date: string;
    country: string;
    flagColor: string;
}
interface LoadGameMenuProps {
    onBack: () => void;
    onLoad: (saveGame: SaveGame) => void;
    gameCoordinator: any;
}
export declare function LoadGameMenu({ onBack, onLoad, gameCoordinator }: LoadGameMenuProps): import("react/jsx-runtime").JSX.Element;
export {};
