// Parse country color files and generate countryData.ts with accurate colors
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const COLORS_DIR = path.join(projectRoot, 'country colors');
const ASSIGNMENTS_PATH = path.join(projectRoot, 'src', 'provinceAssignments.ts');
const OUTPUT_PATH = path.join(projectRoot, 'src', 'countryData.ts');

// Map country file names → HOI4 tags
const NAME_TO_TAG = {
    'Russia': 'RUS',
    'Soviet Union': 'SOV',
    'Ukraine': 'UKR',
    'Belarus': 'BLR',
    'Kazakhstan': 'KAZ',
    'Georgia': 'GEO',
    'Armenia': 'ARM',
    'Azerbaijan': 'AZR',
    'Uzbekistan': 'UZB',
    'Turkmenistan': 'TKM',
    'Kyrgyzstan': 'KGZ',
    'Tajikistan': 'TJK',
    'Estonia': 'EST',
    'Latvia': 'LAT',
    'Lithuania': 'LIT',
    'Moldova': 'MOL',

    'United States': 'USA',
    'United Kingdom': 'ENG',
    'France': 'FRA',
    'Germany': 'GER',
    'West Germany': 'BRD',
    'East Germany': 'DDR',
    'Italy': 'ITA',
    'Japan': 'JAP',
    'China': 'CHI',
    'Communist China': 'PRC',
    'People\'s Republic of China': 'PRC',

    'Serbia': 'SRB',
    'Croatia': 'CRO',
    'Bosnia': 'BOS',
    'Bosnia and Herzegovina': 'BOS',
    'Slovenia': 'SLV',
    'Macedonia': 'MAC',
    'Montenegro': 'MNT',
    'Yugoslavia': 'YUG',
    'Kosovo': 'KOS',

    'Poland': 'POL',
    'Czech Republic': 'CZE',
    'Slovakia': 'SLO',
    'Hungary': 'HUN',
    'Romania': 'ROM',
    'Bulgaria': 'BUL',
    'Albania': 'ALB',
    'Greece': 'GRE',

    'Norway': 'NOR',
    'Sweden': 'SWE',
    'Finland': 'FIN',
    'Denmark': 'DEN',
    'Iceland': 'ICE',

    'Spain': 'SPR',
    'Portugal': 'POR',
    'Ireland': 'IRE',
    'Belgium': 'BEL',
    'Netherlands': 'NET',
    'Luxembourg': 'LUX',
    'Switzerland': 'SWI',
    'Austria': 'AUS',

    'Canada': 'CAN',
    'Mexico': 'MEX',
    'Brazil': 'BRA',
    'Argentina': 'ARG',
    'Chile': 'CHL',
    'Peru': 'PER',
    'Colombia': 'COL',
    'Venezuela': 'VEN',
    'Ecuador': 'ECU',
    'Bolivia': 'BOL',
    'Paraguay': 'PAR',
    'Uruguay': 'URU',
    'Cuba': 'CUB',
    'Dominican Republic': 'DOM',
    'Haiti': 'HAI',
    'Costa Rica': 'COS',
    'Panama': 'PAN',
    'Guatemala': 'GUA',
    'Honduras': 'HON',
    'El Salvador': 'ELS',
    'Nicaragua': 'NIC',

    'Israel': 'ISR',
    'Palestine': 'PAL',
    'Jordan': 'JOR',
    'Syria': 'SYR',
    'Lebanon': 'LEB',
    'Iraq': 'IRQ',
    'Iran': 'IRN',
    'Persia': 'PER',
    'Turkey': 'TUR',
    'Saudi Arabia': 'SAU',
    'Yemen': 'YEM',
    'Oman': 'OMA',
    'United Arab Emirates': 'UAE',
    'Kuwait': 'KUW',
    'Qatar': 'QAT',
    'Bahrain': 'BHR',

    'India': 'IND',
    'British Raj': 'RAJ',
    'Pakistan': 'PAK',
    'Bangladesh': 'BAN',
    'Nepal': 'NEP',
    'Bhutan': 'BHU',
    'Sri Lanka': 'SRI',
    'Ceylon': 'CEY',
    'Afghanistan': 'AFG',
    'North Korea': 'NKR',
    'South Korea': 'SKO',
    'Vietnam': 'VIE',
    'Thailand': 'THA',
    'Siam': 'SIA',
    'Myanmar': 'BRM',
    'Burma': 'BRM',
    'Laos': 'LAO',
    'Cambodia': 'CAM',
    'Malaysia': 'MAL',
    'Indonesia': 'INS',
    'Philippines': 'PHI',
    'Mongolia': 'MON',
    'Taiwan': 'ROC',
    'Singapore': 'SIN',

    'Egypt': 'EGY',
    'Libya': 'LIB',
    'Tunisia': 'TUN',
    'Algeria': 'ALG',
    'Morocco': 'MOR',
    'Sudan': 'SUD',
    'Ethiopia': 'ETH',
    'Somalia': 'SOM',
    'Kenya': 'KEN',
    'Tanzania': 'TAN',
    'Uganda': 'UGA',
    'Angola': 'ANG',
    'South Africa': 'SAF',
    'Zimbabwe': 'ZIM',
    'Rhodesia': 'RHO',
    'Mozambique': 'MOZ',
    'Zambia': 'ZAM',
    'Madagascar': 'MAD',
    'Nigeria': 'NIG',
    'Ghana': 'GHA',
    'Ivory Coast': 'CIV',
    'Cameroon': 'CMR',
    'Congo': 'CON',
    'Gabon': 'GAB',
    'Chad': 'CHA',
    'Mali': 'MLI',
    'Niger': 'NER',
    'Senegal': 'SEN',
    'Liberia': 'LBR',
    'Eritrea': 'ERI',
    'Botswana': 'BOT',
    'Namibia': 'NAM',

    'Australia': 'AST',
    'New Zealand': 'NZL',
};

// Parse a single country color file
function parseColorFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const colorMatch = content.match(/color\s*=\s*\{\s*(\d+)\s+(\d+)\s+(\d+)\s*\}/);

    if (colorMatch) {
        const r = parseInt(colorMatch[1]);
        const g = parseInt(colorMatch[2]);
        const b = parseInt(colorMatch[3]);
        return rgbToHex(r, g, b);
    }

    return null;
}

function rgbToHex(r, g, b) {
    const toHex = x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Generate fallback color for countries without color files
// Uses prime number spacing and tag hash to ensure unique colors
function generateFallbackColor(tag, index, total) {
    // Hash the tag to get a stable seed
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = ((hash << 5) - hash) + tag.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }

    // Use prime numbers for spacing to avoid collisions
    const primes = [7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
    const prime = primes[Math.abs(hash) % primes.length];

    // Generate distinct hue
    const goldenRatio = 0.618033988749895;
    const hue = ((index * prime * goldenRatio) + (Math.abs(hash) / 1000000)) % 1.0;

    // Vary saturation and lightness based on tag
    const saturation = 0.55 + ((Math.abs(hash) % 30) / 100); // 0.55 - 0.85
    const lightness = 0.35 + ((Math.abs(hash >> 8) % 25) / 100); // 0.35 - 0.60

    return hslToHex(hue, saturation, lightness);
}

function hslToHex(h, s, l) {
    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = x => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Extract all tags from provinceAssignments.ts
function extractAllTags() {
    const content = fs.readFileSync(ASSIGNMENTS_PATH, 'utf-8');
    const tagMatches = content.matchAll(/"([A-Z]{3})"/g);
    const tags = new Set();

    for (const match of tagMatches) {
        tags.add(match[1]);
    }

    return Array.from(tags).sort();
}

// Load colors from country colors folder
function loadCountryColors() {
    console.log('[Parser] Loading colors from:', COLORS_DIR);

    const colorMap = new Map(); // TAG → color
    const files = fs.readdirSync(COLORS_DIR).filter(f => f.endsWith('.txt'));

    for (const file of files) {
        const countryName = file.replace('.txt', '');
        const tag = NAME_TO_TAG[countryName];

        if (tag) {
            const filePath = path.join(COLORS_DIR, file);
            const color = parseColorFile(filePath);

            if (color) {
                colorMap.set(tag, { name: countryName, color });
            }
        }
    }

    console.log(`[Parser] Loaded ${colorMap.size} colors from files`);
    return colorMap;
}

// Generate countryData.ts
function generateCountryData(tags, colorMap) {
    console.log(`[Parser] Generating data for ${tags.length} countries`);

    let foundColors = 0;
    let fallbackColors = 0;
    let adjustedColors = 0;
    const usedColors = new Set();

    const entries = tags.map((tag, index) => {
        let name, color;

        if (colorMap.has(tag)) {
            const data = colorMap.get(tag);
            name = data.name;
            color = data.color;
            foundColors++;

            // Check for duplicate color - if found, generate unique variant
            if (usedColors.has(color)) {
                console.log(`[Parser] ⚠️  Duplicate color detected for ${tag} (${name}): ${color} - generating unique variant`);
                color = generateFallbackColor(tag, index, tags.length);
                adjustedColors++;
            }
        } else {
            // Fallback: use tag as name and generate UNIQUE color based on tag
            name = tag;
            color = generateFallbackColor(tag, index, tags.length);
            fallbackColors++;
        }

        usedColors.add(color);
        return `    ["${tag}", { name: "${name}", color: "${color}" }]`;
    });

    const timestamp = new Date().toISOString();

    const output = `// Auto-generated from country color files
// Generated on: ${timestamp}
// Source: country colors/
//
// Total countries: ${tags.length}
// Colors from files: ${foundColors}
// Fallback colors: ${fallbackColors}

/**
 * Defines the basic data structure for a country
 */
export interface CountryData {
    name: string;
    color: string;
}

/**
 * Master map of all countries in the game (HOI4 tags)
 * Key: 3-letter HOI4 country tag (e.g., "USA", "PRC", "ENG")
 * Value: CountryData with display name and map color
 */
export const countryData = new Map<string, CountryData>([
${entries.join(',\n')}
]);
`;

    fs.writeFileSync(OUTPUT_PATH, output, 'utf-8');
    console.log('[Parser] ✓ Written to:', OUTPUT_PATH);

    return { foundColors, fallbackColors, adjustedColors };
}

// Main
console.log('=== Country Colors Parser ===\n');

try {
    const tags = extractAllTags();
    const colorMap = loadCountryColors();
    const stats = generateCountryData(tags, colorMap);

    console.log('\n=== Statistics ===');
    console.log(`Total countries: ${tags.length}`);
    console.log(`Colors from files: ${stats.foundColors}`);
    console.log(`Duplicate colors adjusted: ${stats.adjustedColors}`);
    console.log(`Fallback colors: ${stats.fallbackColors}`);
    console.log(`Coverage: ${((stats.foundColors / tags.length) * 100).toFixed(1)}%`);

    console.log('\n✓ Done! Country data generated with accurate HOI4 colors.');
} catch (error) {
    console.error('Error:', error);
    process.exit(1);
}
