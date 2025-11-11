interface CountryCardProps {
    name: string;
    leaderImage: string;
    flagImage: string;
    isSelected?: boolean;
    onClick: () => void;
}
export declare function CountryCard({ name, leaderImage, flagImage, isSelected, onClick }: CountryCardProps): import("react/jsx-runtime").JSX.Element;
export {};
