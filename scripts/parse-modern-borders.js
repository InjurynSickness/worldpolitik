// Parse HOI4 state files and generate 2000s borders
// Uses add_core_of tags to split SOV → Russia/Ukraine/etc. and YUG → Croatia/Serbia/etc.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const STATES_DIR = path.join(projectRoot, 'modern states');
const OUTPUT_PATH = path.join(projectRoot, 'src', 'provinceAssignments.ts');

// Priority order for SOV states - prefer the most specific modern core
const SOV_CORE_PRIORITY = ['UKR', 'BLR', 'GEO', 'ARM', 'AZE', 'KAZ', 'UZB', 'TKM', 'KGZ', 'TJK', 'LTU', 'LAT', 'EST', 'MDA', 'RUS'];

// Priority order for YUG states
const YUG_CORE_PRIORITY = ['CRO', 'SRB', 'BOS', 'SLO', 'MAC', 'MON'];

// Colonial territories to reassign for 2000s accuracy
// These were transferred/returned between WW2 and 2000
const COLONIAL_REASSIGNMENTS = {
    '320': 'IND',  // French India (Pondicherry) → India (transferred 1954)
    '321': 'IND',  // Portuguese India (Goa) → India (annexed 1961)
    '721': 'INS',  // Portuguese Timor → Indonesia (annexed 1975, independent 2002)
    '326': 'CHI',  // Hong Kong → China (returned 1997)
    '728': 'CHI',  // Macau → China (returned 1999)
};

// Parse a single state file
function parseStateFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract owner
    const ownerMatch = content.match(/owner\s*=\s*([A-Z]{3})/);
    const owner = ownerMatch ? ownerMatch[1] : null;

    // Extract provinces
    const provincesMatch = content.match(/provinces\s*=\s*\{([^}]+)\}/);
    const provinces = provincesMatch
        ? provincesMatch[1].trim().split(/\s+/).filter(p => p && !isNaN(p))
        : [];

    // Extract all add_core_of tags
    const coreMatches = content.matchAll(/add_core_of\s*=\s*([A-Z]{3})/g);
    const cores = Array.from(coreMatches).map(m => m[1]);

    return { owner, provinces, cores };
}

// Determine the modern owner for a state
function getModernOwner(owner, cores) {
    if (!owner) return null;

    // Handle Soviet Union split
    if (owner === 'SOV') {
        // Find the highest priority non-SOV core
        for (const priority of SOV_CORE_PRIORITY) {
            if (cores.includes(priority)) {
                return priority;
            }
        }
        // If no modern core found, default to RUS
        return 'RUS';
    }

    // Handle Yugoslavia split
    if (owner === 'YUG') {
        // Find the highest priority non-YUG core
        for (const priority of YUG_CORE_PRIORITY) {
            if (cores.includes(priority)) {
                return priority;
            }
        }
        // If no modern core found, default to SRB
        return 'SRB';
    }

    // For all other countries, use the owner directly
    return owner;
}

// Main parsing function
function parseAllStates() {
    console.log('[Parser] Reading state files from:', STATES_DIR);

    const stateFiles = fs.readdirSync(STATES_DIR)
        .filter(f => f.endsWith('.txt'))
        .sort((a, b) => {
            const numA = parseInt(a.split('-')[0]);
            const numB = parseInt(b.split('-')[0]);
            return numA - numB;
        });

    console.log(`[Parser] Found ${stateFiles.length} state files`);

    const provinceMap = new Map(); // province ID → country code
    const stats = {
        totalStates: 0,
        sovSplit: 0,
        yugSplit: 0,
        totalProvinces: 0,
        countryDistribution: {}
    };

    for (const file of stateFiles) {
        const filePath = path.join(STATES_DIR, file);
        const { owner, provinces, cores } = parseStateFile(filePath);

        if (!owner || provinces.length === 0) {
            console.warn(`[Parser] Skipping ${file}: no owner or provinces`);
            continue;
        }

        let modernOwner = getModernOwner(owner, cores);

        // Extract state ID from filename (e.g., "320-French India.txt" → "320")
        const stateId = file.split('-')[0];

        // Apply colonial reassignments for 2000s accuracy
        if (COLONIAL_REASSIGNMENTS[stateId]) {
            const originalOwner = modernOwner;
            modernOwner = COLONIAL_REASSIGNMENTS[stateId];
            console.log(`[Parser] ✓ Colonial reassignment: ${file}: ${originalOwner} → ${modernOwner}`);
        }

        // Track stats
        stats.totalStates++;
        if (owner === 'SOV') stats.sovSplit++;
        if (owner === 'YUG') stats.yugSplit++;

        // Log conversions
        if (owner !== modernOwner) {
            console.log(`[Parser] ${file}: ${owner} → ${modernOwner} (cores: ${cores.join(', ')})`);
        }

        // Assign provinces to modern owner
        for (const provinceId of provinces) {
            provinceMap.set(provinceId, modernOwner);
            stats.totalProvinces++;

            // Track country distribution
            if (!stats.countryDistribution[modernOwner]) {
                stats.countryDistribution[modernOwner] = 0;
            }
            stats.countryDistribution[modernOwner]++;
        }
    }

    return { provinceMap, stats };
}

// Generate TypeScript output file
function generateOutputFile(provinceMap, stats) {
    console.log('\n[Parser] Generating output file...');

    // Sort provinces by ID for cleaner output
    const sortedEntries = Array.from(provinceMap.entries())
        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

    const entries = sortedEntries
        .map(([id, country]) => `    ["${id}", "${country}"]`)
        .join(',\n');

    const timestamp = new Date().toISOString();

    const output = `// Auto-generated from HOI4 state files with modern 2000s borders
// Generated on: ${timestamp}
// Source: ./states
//
// This uses add_core_of tags to split:
// - SOV (Soviet Union) → UKR, BLR, RUS, GEO, ARM, etc.
// - YUG (Yugoslavia) → CRO, SRB, BOS, SLO, MAC, MON
//
// Statistics:
// - Total states processed: ${stats.totalStates}
// - Soviet states split: ${stats.sovSplit}
// - Yugoslav states split: ${stats.yugSplit}
// - Total provinces assigned: ${stats.totalProvinces}
// - Unique countries: ${Object.keys(stats.countryDistribution).length}

/**
 * Maps province IDs to country ISO codes (2000s borders)
 * This determines which country owns each province on the map
 */
export const provinceToCountryMap = new Map<string, string>([
${entries}
]);
`;

    fs.writeFileSync(OUTPUT_PATH, output, 'utf-8');
    console.log('[Parser] ✓ Written to:', OUTPUT_PATH);
}

// Print statistics
function printStats(stats) {
    console.log('\n=== Parsing Statistics ===');
    console.log(`Total states: ${stats.totalStates}`);
    console.log(`Soviet states split: ${stats.sovSplit}`);
    console.log(`Yugoslav states split: ${stats.yugSplit}`);
    console.log(`Total provinces: ${stats.totalProvinces}`);
    console.log(`Unique countries: ${Object.keys(stats.countryDistribution).length}`);

    console.log('\n=== Top 15 Countries by Province Count ===');
    const sorted = Object.entries(stats.countryDistribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

    for (const [country, count] of sorted) {
        console.log(`  ${country}: ${count} provinces`);
    }
}

// Run the parser
console.log('=== HOI4 Modern Borders Parser ===\n');

try {
    const { provinceMap, stats } = parseAllStates();
    generateOutputFile(provinceMap, stats);
    printStats(stats);

    console.log('\n✓ Done! Modern 2000s borders generated successfully.');
} catch (error) {
    console.error('Error:', error);
    process.exit(1);
}
