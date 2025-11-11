import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { CountryCard } from "./CountryCard";
import { MenuButton } from "./MenuButton";
import { ImageWithFallback } from "./figma/ImageWithFallback";
const COUNTRIES = [
    {
        id: "france",
        name: "France",
        leaderName: "Édouard Daladier",
        leaderImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop",
        flagImage: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=300&h=150&fit=crop",
        ideology: "Democracy",
        government: "Democratic Republic",
        elections: "1940",
        rulingParty: "Radical Socialist Party",
        briefHistory: "France stands as one of the great powers of Europe. The scars of the Great War still mark the nation, and the rising threat from across the Rhine demands vigilance."
    },
    {
        id: "usa",
        name: "United States",
        leaderName: "Franklin D. Roosevelt",
        leaderImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=400&fit=crop",
        flagImage: "https://images.unsplash.com/photo-1485711138408-dfad48f5c4e8?w=300&h=150&fit=crop",
        ideology: "Democracy",
        government: "Democratic Republic",
        elections: "1940",
        rulingParty: "Democratic Party",
        briefHistory: "The United States remains isolationist, focused on recovering from the Great Depression. Yet the winds of war may soon force a reckoning."
    },
    {
        id: "uk",
        name: "United Kingdom",
        leaderName: "Neville Chamberlain",
        leaderImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=400&fit=crop",
        flagImage: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=300&h=150&fit=crop",
        ideology: "Democracy",
        government: "Constitutional Monarchy",
        elections: "1940",
        rulingParty: "Conservative Party",
        briefHistory: "The British Empire spans the globe, but faces unprecedented challenges. The policy of appeasement has bought time, but at what cost?"
    },
    {
        id: "germany",
        name: "German Reich",
        leaderName: "Adolf Hitler",
        leaderImage: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=300&h=400&fit=crop",
        flagImage: "https://images.unsplash.com/photo-1467632499275-7a693a761056?w=300&h=150&fit=crop",
        ideology: "Fascist",
        government: "Totalitarian Regime",
        elections: "Never",
        rulingParty: "NSDAP",
        briefHistory: "A new Germany has risen. Three years have passed since the Weimar Republic was dismantled and replaced by Hitler's Third Reich. Economic stability has returned after the trying years of the Great Depression, and mass unemployment has been dealt with."
    },
    {
        id: "italy",
        name: "Italy",
        leaderName: "Benito Mussolini",
        leaderImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=400&fit=crop",
        flagImage: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=300&h=150&fit=crop",
        ideology: "Fascist",
        government: "Fascist Regime",
        elections: "Never",
        rulingParty: "Partito Nazionale Fascista",
        briefHistory: "Mussolini's Italy seeks to restore the glory of Rome. Recent conquests in Africa have emboldened the regime's imperial ambitions."
    },
    {
        id: "japan",
        name: "Japan",
        leaderName: "Hirohito",
        leaderImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=400&fit=crop",
        flagImage: "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=300&h=150&fit=crop",
        ideology: "Fascist",
        government: "Absolute Monarchy",
        elections: "Never",
        rulingParty: "Imperial Rule",
        briefHistory: "The Empire of the Rising Sun expands its control over Asia. The military holds tremendous power, driving an aggressive expansionist policy."
    },
    {
        id: "soviet",
        name: "Soviet Union",
        leaderName: "Joseph Stalin",
        leaderImage: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&h=400&fit=crop",
        flagImage: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=300&h=150&fit=crop",
        ideology: "Communist",
        government: "Communist Regime",
        elections: "Never",
        rulingParty: "Communist Party",
        briefHistory: "Stalin's iron grip controls the Soviet Union. Industrial might grows through Five-Year Plans, though at tremendous human cost."
    },
    {
        id: "other",
        name: "Other countries",
        leaderName: "Unknown",
        leaderImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop",
        flagImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=150&fit=crop",
        ideology: "Various",
        government: "Various",
        elections: "Varies",
        rulingParty: "Various",
        briefHistory: "Many other nations await your leadership. Each faces unique challenges and opportunities in the coming conflict."
    }
];
export function CountrySelection({ onBack, onSelectCountry }) {
    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[3]); // Default to Germany
    return (_jsxs("div", { className: "relative w-full h-screen bg-black/90 p-4", children: [_jsx("div", { className: "flex justify-center gap-3 mb-3", children: COUNTRIES.slice(0, 8).map((country) => (_jsx(CountryCard, { name: country.name, leaderImage: country.leaderImage, flagImage: country.flagImage, isSelected: selectedCountry?.id === country.id, onClick: () => setSelectedCountry(country) }, country.id))) }), selectedCountry && (_jsxs("div", { className: "mt-8 max-w-6xl mx-auto", children: [_jsx("div", { className: "text-center mb-6", children: _jsx("h2", { className: "text-amber-100/80 tracking-[0.3em] uppercase text-[13px]", children: selectedCountry.name }) }), _jsxs("div", { className: "flex gap-6 justify-center items-start", children: [_jsxs("div", { className: "relative w-[280px] bg-gradient-to-b from-amber-100/95 to-amber-50/95 border-2 border-amber-900/80 p-4", children: [_jsx("div", { className: "absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-900" }), _jsx("div", { className: "absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-900" }), _jsx("div", { className: "absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-900" }), _jsx("div", { className: "absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-900" }), _jsx("h3", { className: "text-center tracking-[0.2em] uppercase mb-4 text-stone-900 text-[12px]", children: "Information" }), _jsxs("div", { className: "space-y-2 text-stone-900", style: { fontSize: '11px' }, children: [_jsxs("div", { children: [_jsx("span", { className: "block tracking-wider", children: "Leader" }), _jsx("span", { className: "block ml-2", children: selectedCountry.leaderName })] }), _jsxs("div", { children: [_jsx("span", { className: "block tracking-wider", children: "Ideology" }), _jsx("span", { className: "block ml-2", children: selectedCountry.ideology })] }), _jsxs("div", { children: [_jsx("span", { className: "block tracking-wider", children: "Government" }), _jsx("span", { className: "block ml-2", children: selectedCountry.government })] }), _jsxs("div", { children: [_jsx("span", { className: "block tracking-wider", children: "Elections" }), _jsx("span", { className: "block ml-2", children: selectedCountry.elections })] }), _jsxs("div", { children: [_jsx("span", { className: "block tracking-wider", children: "Ruling Party" }), _jsx("span", { className: "block ml-2", children: selectedCountry.rulingParty })] })] })] }), _jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsxs("div", { className: "relative w-[140px] h-[180px] bg-gradient-to-b from-stone-800 to-stone-900 border-2 border-amber-900/80", children: [_jsx(ImageWithFallback, { src: selectedCountry.leaderImage, alt: selectedCountry.leaderName, className: "w-full h-full object-cover" }), _jsx("div", { className: "absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-700" }), _jsx("div", { className: "absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-700" }), _jsx("div", { className: "absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-700" }), _jsx("div", { className: "absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-700" })] }), _jsx("div", { className: "flex gap-2", children: [1, 2, 3].map((i) => (_jsx("div", { className: "w-16 h-16 bg-gradient-to-b from-stone-800 to-stone-900 border border-amber-900/60 flex items-center justify-center", children: _jsx("span", { className: "text-amber-700/50 text-[20px]", children: "\u2605" }) }, i))) })] }), _jsxs("div", { className: "relative w-[340px] bg-gradient-to-b from-amber-100/95 to-amber-50/95 border-2 border-amber-900/80 p-4", children: [_jsx("div", { className: "absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-900" }), _jsx("div", { className: "absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-900" }), _jsx("div", { className: "absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-900" }), _jsx("div", { className: "absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-900" }), _jsx("h3", { className: "text-center tracking-[0.2em] uppercase mb-4 text-stone-900 text-[12px]", children: "Brief History" }), _jsx("p", { className: "text-stone-900 leading-relaxed", style: { fontSize: '11px' }, children: selectedCountry.briefHistory })] })] }), _jsxs("div", { className: "flex justify-center gap-6 mt-8", children: [_jsx("div", { className: "w-[160px]", children: _jsx(MenuButton, { onClick: onBack, children: "Back" }) }), _jsx("div", { className: "w-[160px]", children: _jsx(MenuButton, { onClick: () => onSelectCountry(selectedCountry), children: "Select Country" }) })] })] }))] }));
}
//# sourceMappingURL=CountrySelection.js.map