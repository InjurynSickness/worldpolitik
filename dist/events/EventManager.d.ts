import { Country } from '../types.js';
interface EventChoice {
    text: string;
    cost: number;
    effects: string;
    action: () => void;
}
interface GameEvent {
    title: string;
    description: string;
    choices: EventChoice[];
}
export declare class EventManager {
    showSimpleEventPopup(event: GameEvent, country: Country, onComplete: () => void): void;
    createTestEvent(country: Country, showNotification: (msg: string, type: string) => void): GameEvent;
    private showNotification;
}
export {};
