import { useState, useEffect } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface FigmaLoadingScreenProps {
  progress: number;
  message: string;
  onComplete?: () => void;
}

const LOADING_IMAGES = [
  "https://images.unsplash.com/photo-1755335853548-52622a24b11c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b3JsZCUyMHdhciUyMDIlMjB0YW5rcyUyMGJhdHRsZXxlbnwxfHx8fDE3NjM1NjgzMTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1758291293507-777a405ad492?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWxpdGFyeSUyMG5hdmFsJTIwd2FyZmFyZXxlbnwxfHx8fDE3NjM1NjgzMTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1746289222410-42779986f97f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b3JsZCUyMHdhciUyMHNvbGRpZXJzJTIwY29tYmF0fGVufDF8fHx8MTc2MzU2ODMxOHww&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1684795311185-47041ed930e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaWxpdGFyeSUyMGFpcmNyYWZ0JTIwdmludGFnZXxlbnwxfHx8fDE3NjM1NjgzMTh8MA&ixlib=rb-4.1.0&q=80&w=1080"
];

const QUOTES = [
  {
    text: "If we lose this war, I'll start another in my wife's name.",
    author: "Moshe Dayan"
  },
  {
    text: "In war, truth is the first casualty.",
    author: "Aeschylus"
  },
  {
    text: "Wars may be fought with weapons, but they are won by men.",
    author: "George S. Patton"
  },
  {
    text: "The art of war is of vital importance to the State.",
    author: "Sun Tzu"
  },
  {
    text: "Never in the field of human conflict was so much owed by so many to so few.",
    author: "Winston Churchill"
  },
  {
    text: "I know not with what weapons World War III will be fought, but World War IV will be fought with sticks and stones.",
    author: "Albert Einstein"
  }
];

export function FigmaLoadingScreen({ progress, message, onComplete }: FigmaLoadingScreenProps) {
  const [currentImage] = useState(() =>
    LOADING_IMAGES[Math.floor(Math.random() * LOADING_IMAGES.length)]
  );
  const [currentQuote] = useState(() =>
    QUOTES[Math.floor(Math.random() * QUOTES.length)]
  );

  useEffect(() => {
    if (progress >= 100 && onComplete) {
      const timeout = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [progress, onComplete]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Background Image */}
      <div className="absolute inset-0">
        <ImageWithFallback
          src={currentImage}
          alt="Loading background"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Top - Loading bar */}
        <div className="pt-8 px-8">
          <div className="max-w-md mx-auto">
            {/* Loading text */}
            <div className="relative bg-gradient-to-b from-stone-900/95 to-black/95 border-2 border-amber-900/80 py-3 px-6 mb-2">
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-700/80" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-700/80" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-amber-700/80" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-amber-700/80" />

              <div className="text-center text-amber-100/90 tracking-[0.25em] uppercase text-[11px]">
                {message}
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative bg-black/80 border-2 border-amber-900/70 h-6">
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-700/60" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-amber-700/60" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-amber-700/60" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-700/60" />

              {/* Progress fill */}
              <div
                className="h-full bg-gradient-to-r from-amber-800/90 via-amber-700/90 to-amber-600/90 border-r-2 border-amber-500/50 transition-all duration-100"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              >
                {/* Shine effect */}
                <div className="h-full bg-gradient-to-b from-white/20 via-transparent to-black/20" />
              </div>

              {/* Progress percentage */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-amber-100 drop-shadow-lg text-[10px] tracking-widest">
                  {Math.floor(Math.min(100, Math.max(0, progress)))}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom - Quote */}
        <div className="mt-auto pb-12 px-12">
          <div className="max-w-3xl mx-auto">
            <div className="relative bg-gradient-to-b from-black/90 to-stone-950/90 border-2 border-amber-900/60 p-6">
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-700/70" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-700/70" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-700/70" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-700/70" />

              <p className="text-amber-100/90 text-center mb-3 italic tracking-wide leading-relaxed" style={{ fontSize: '13px' }}>
                "{currentQuote.text}"
              </p>
              <p className="text-amber-100/70 text-center tracking-[0.2em] uppercase" style={{ fontSize: '10px' }}>
                — {currentQuote.author}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
