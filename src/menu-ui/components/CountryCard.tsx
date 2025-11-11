import { ImageWithFallback } from "./figma/ImageWithFallback";

interface CountryCardProps {
  name: string;
  leaderImage: string;
  flagImage: string;
  isSelected?: boolean;
  onClick: () => void;
}

export function CountryCard({ name, leaderImage, flagImage, isSelected, onClick }: CountryCardProps) {
  return (
    <button
      onClick={onClick}
      className={`relative group ${isSelected ? 'ring-2 ring-amber-500' : ''}`}
    >
      {/* Card container with HOI4 styling */}
      <div className="relative w-[115px]">
        {/* Leader portrait */}
        <div className="relative bg-gradient-to-b from-stone-800 to-stone-900 border-2 border-amber-900/60 mb-1">
          <ImageWithFallback
            src={leaderImage}
            alt={`${name} leader`}
            className="w-full h-[140px] object-cover"
          />
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-700/80" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-700/80" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-amber-700/80" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-amber-700/80" />
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/10 transition-colors duration-200" />
        </div>
        
        {/* Flag */}
        <div className="relative bg-gradient-to-b from-stone-900 to-black border-2 border-amber-900/60">
          <ImageWithFallback
            src={flagImage}
            alt={`${name} flag`}
            className="w-full h-[50px] object-cover"
          />
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-700/80" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-amber-700/80" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-amber-700/80" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-700/80" />
        </div>
        
        {/* Country name */}
        <div className="mt-1 text-center">
          <span className="text-amber-100/90 tracking-wider text-[11px] uppercase">
            {name}
          </span>
        </div>
      </div>
    </button>
  );
}
