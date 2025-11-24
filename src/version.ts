// Version tracking for debugging code sync issues
export const VERSION = {
  major: 2,
  minor: 0,
  patch: 0,
  timestamp: '2025-11-24T05:30:00Z',
  description: 'Complete Three.js rewrite - Canvas layers as textures',
  commit: 'map-render-fix-v2',
};

export function logVersion(): void {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  WorldPolitik Map Renderer                                ║
║  Version: ${VERSION.major}.${VERSION.minor}.${VERSION.patch}                                          ║
║  Build: ${VERSION.timestamp}                    ║
║  ${VERSION.description.padEnd(57)}║
║  Commit: ${VERSION.commit.padEnd(50)}║
╚═══════════════════════════════════════════════════════════╝
  `);
}
