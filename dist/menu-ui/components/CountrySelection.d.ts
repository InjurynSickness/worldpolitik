interface Country {
    id: string;
    name: string;
    leaderName: string;
    leaderImage: string;
    flagImage: string;
    ideology: string;
    government: string;
    elections: string;
    rulingParty: string;
    briefHistory: string;
}
interface CountrySelectionProps {
    onBack: () => void;
    onSelectCountry: (country: Country) => void;
}
export declare function CountrySelection({ onBack, onSelectCountry }: CountrySelectionProps): import("react/jsx-runtime").JSX.Element;
export {};
