import { useEffect, useState, useRef } from "react";
import { MenuButton } from "./MenuButton";
import { provinceToCountryMap } from "../../provinceAssignments.js";
import { countryData } from "../../countryData.js";
import { logger } from "../../utils/Logger.js";

interface InteractiveCountrySelectionProps {
  onBack: () => void;
  onSelectCountry: (countryId: string) => void;
  onMapReady: () => void;
  onLoadingProgress?: (progress: number, message: string) => void;
}

export function InteractiveCountrySelection({ onBack, onSelectCountry, onMapReady, onLoadingProgress }: InteractiveCountrySelectionProps) {
  logger.info('InteractiveCountrySelection', '🗺️ Component rendering');

  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logger.info('InteractiveCountrySelection', '📍 useEffect triggered - Component mounted', {
      hasContainer: !!containerRef.current,
      containerElement: containerRef.current?.tagName
    });

    if (!containerRef.current) {
      logger.error('InteractiveCountrySelection', '❌ ERROR: No container ref available!');
      return;
    }

    let provinceMapInstance: any = null;

    // Import the map dynamically
    logger.info('InteractiveCountrySelection', '⏳ Starting dynamic import of provinceMap.js...');
    import('../../provinceMap.js')
      .then(({ ProvinceMap }) => {
        logger.info('InteractiveCountrySelection', '✅ ProvinceMap module loaded successfully');

        // When user clicks a province/country on the map
        const handleCountryClick = (countryId: string) => {
          logger.info('InteractiveCountrySelection', `Country clicked: ${countryId}`);
          setSelectedCountryId(countryId);
        };

        // When map is fully ready (including borders)
        const handleMapReady = () => {
          logger.info('InteractiveCountrySelection', '✅✅✅ MAP FULLY READY! ✅✅✅');
          setMapReady(true);

          // ONLY NOW report 100% - map is actually done loading
          if (onLoadingProgress) {
            logger.info('InteractiveCountrySelection', 'Reporting ACTUAL completion: 100% READY!');
            onLoadingProgress(100, "READY!");
          }

          // Notify parent that map is ready (this will hide the loading screen)
          logger.info('InteractiveCountrySelection', 'Calling parent onMapReady callback...');
          onMapReady();
        };

        logger.info('InteractiveCountrySelection', '🏗️ Creating ProvinceMap instance...');
        try {
          provinceMapInstance = new ProvinceMap(
            containerRef.current!,
            handleCountryClick,
            handleMapReady
          );
          logger.info('InteractiveCountrySelection', '✅ ProvinceMap instance created, starting asset load...');
        } catch (error) {
          logger.error('InteractiveCountrySelection', '❌ ERROR creating ProvinceMap', error);
          throw error;
        }

        // Set up the map with country data
        logger.info('InteractiveCountrySelection', '⏳ Loading GameStateInitializer...');
        import('../../game/GameStateInitializer.js')
          .then(({ GameStateInitializer }) => {
            logger.info('InteractiveCountrySelection', '✅ GameStateInitializer loaded');
            logger.info('InteractiveCountrySelection', 'Initializing game state...');
            const tempGameState = GameStateInitializer.initializeGameState();
            logger.info('InteractiveCountrySelection', '✅ Game state initialized, updating map...');

            provinceMapInstance.updateCountries(tempGameState.countries, countryData);
            provinceMapInstance.setProvinceOwnerMap(provinceToCountryMap);

            // Enable political colors overlay for country selection
            // 0.65 = 65% political colors, 35% terrain visible underneath
            // This balances country visibility with terrain details for strategic depth
            provinceMapInstance.setPoliticalOpacity(0.65);

            // Hide country borders for cleaner nation selection view
            // Borders make the selection screen look cluttered
            provinceMapInstance.setBordersVisible(false);

            logger.info('InteractiveCountrySelection', '✅ Map updated with countries and provinces');
            logger.info('InteractiveCountrySelection', 'Political colors enabled at 65% opacity with terrain visible');
            logger.info('InteractiveCountrySelection', 'Country borders hidden for cleaner selection view');
            logger.info('InteractiveCountrySelection', 'Now waiting for ProvinceMap to finish loading assets...');
          })
          .catch((error) => {
            logger.error('InteractiveCountrySelection', '❌ ERROR loading GameStateInitializer', error);
          });
      })
      .catch((error) => {
        logger.error('InteractiveCountrySelection', '❌ ERROR loading ProvinceMap module', error);
      });

    // Cleanup on unmount
    return () => {
      logger.info('InteractiveCountrySelection', '🧹 Component unmounting, cleaning up...');
      if (provinceMapInstance) {
        provinceMapInstance.destroy();
      }
    };
  }, [onMapReady, onLoadingProgress]);

  const selectedCountryData = selectedCountryId ? countryData.get(selectedCountryId) : null;

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Map container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Top info bar */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 to-transparent p-4 z-20">
        <h1 className="text-amber-100/90 tracking-[0.3em] uppercase text-center text-[16px]">
          Select Your Nation
        </h1>
        <p className="text-amber-100/60 tracking-wider text-center text-[11px] mt-1">
          Click on any country to view details
        </p>
      </div>

      {/* Country info panel - Right side */}
      {selectedCountryData && (
        <div className="absolute top-20 right-6 w-[360px] bg-gradient-to-b from-stone-900/95 to-black/95 border-2 border-amber-900/60 shadow-2xl z-20">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-amber-700/80" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-amber-700/80" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-amber-700/80" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-amber-700/80" />

          {/* Country header */}
          <div className="p-6 border-b border-amber-900/40">
            <h2 className="text-amber-100 tracking-[0.25em] uppercase text-center text-[14px] mb-2">
              {selectedCountryData.name}
            </h2>
            <p className="text-amber-100/60 text-center text-[10px] tracking-widest">
              {selectedCountryData.code}
            </p>
          </div>

          {/* Country details */}
          <div className="p-6 space-y-4">
            {/* Leader Portrait and Flag */}
            <div className="flex gap-3">
              {/* Leader Portrait placeholder */}
              <div className="w-28 h-36 bg-gradient-to-b from-stone-800 to-stone-900 border-2 border-amber-900/60 flex items-center justify-center relative">
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-700" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-700" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-amber-700" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-amber-700" />
                <span className="text-amber-700/40 text-[40px]">👤</span>
              </div>

              {/* Flag and basic info */}
              <div className="flex-1 space-y-2">
                {/* Flag placeholder */}
                <div className="w-full h-20 bg-gradient-to-br from-stone-800 to-stone-900 border border-amber-900/60 flex items-center justify-center relative overflow-hidden">
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: selectedCountryData.color,
                    opacity: 0.6
                  }} />
                  <span className="absolute text-white/20 text-[10px] tracking-widest">FLAG</span>
                </div>

                {/* Quick stats */}
                <div className="text-[10px] text-amber-100/60 space-y-1">
                  <div>Leader: <span className="text-amber-100">Unknown</span></div>
                  <div>Ideology: <span className="text-amber-100">{selectedCountryData.government || 'Unknown'}</span></div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between border-b border-amber-900/20 pb-1">
                <span className="text-amber-100/60 tracking-wider">Capital</span>
                <span className="text-amber-100">{selectedCountryData.capital || 'Unknown'}</span>
              </div>

              <div className="flex justify-between border-b border-amber-900/20 pb-1">
                <span className="text-amber-100/60 tracking-wider">Government</span>
                <span className="text-amber-100">{selectedCountryData.government || 'Unknown'}</span>
              </div>

              {selectedCountryData.population && selectedCountryData.population > 0 && (
                <div className="flex justify-between border-b border-amber-900/20 pb-1">
                  <span className="text-amber-100/60 tracking-wider">Population</span>
                  <span className="text-amber-100">{selectedCountryData.population.toFixed(1)}M</span>
                </div>
              )}

              <div className="flex justify-between border-b border-amber-900/20 pb-1">
                <span className="text-amber-100/60 tracking-wider">Region</span>
                <span className="text-amber-100">{selectedCountryData.region || 'Unknown'}</span>
              </div>
            </div>

            {/* Description */}
            {selectedCountryData.description && (
              <div className="mt-4 pt-4 border-t border-amber-900/40">
                <p className="text-amber-100/70 text-[11px] leading-relaxed">
                  {selectedCountryData.description}
                </p>
              </div>
            )}
          </div>

          {/* Play button */}
          <div className="p-6 border-t border-amber-900/40">
            <button
              onClick={() => onSelectCountry(selectedCountryId)}
              className="w-full py-3 bg-gradient-to-b from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 border-2 border-amber-700 text-amber-50 tracking-[0.2em] uppercase text-[12px] font-bold transition-all"
            >
              Play as {selectedCountryData.name}
            </button>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-6 left-6 z-20">
        <div className="w-[160px]">
          <MenuButton onClick={onBack}>Back</MenuButton>
        </div>
      </div>

      {/* No separate loading indicator - we already showed one before this screen */}
    </div>
  );
}
