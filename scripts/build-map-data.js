// /scripts/build-map-data.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const csv = require('csv-parser');
const { PNG } = require('pngjs');

// --- Configuration ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const CSV_FILE_PATH = path.join(projectRoot, 'definition.csv');
const NAMES_FILE_PATH = path.join(projectRoot, 'province names.txt');
const PNG_FILE_PATH = path.join(projectRoot, 'provinces.png');
const DATA_OUTPUT_PATH = path.join(projectRoot, 'src', 'provinceData.ts');
const BORDER_OUTPUT_PATH = path.join(projectRoot, 'src', 'provinceBorders.ts');
const ASSIGNMENTS_OUTPUT_PATH = path.join(projectRoot, 'src', 'provinceAssignments.ts');

// --- 1836 to 2000 Mapping ---
// This is our "best guess" map.
const ownerToTagMap = new Map([
    // Obvious mappings
    ['United States of America.png United States of America', 'USA'],
    ['Russia.png Russia', 'RUS'],
    ['China.png China', 'CHN'],
    ['United Kingdom.png United Kingdom', 'GBR'],
    ['France.png France', 'FRA'],
    ['Japan.png Japan', 'JPN'],
    ['Mexico.png Mexico', 'MEX'],
    ['Brazil.png Brazil', 'BRA'],
    ['Argentina.png Argentina', 'ARG'],
    ['Spain.png Spain', 'ESP'],
    ['Portugal.png Portugal', 'PRT'],
    ['Netherlands.png Netherlands', 'NLD'],
    ['Belgium.png Belgium', 'BEL'],
    ['Denmark.png Denmark', 'DNK'],
    ['Sweden.png Sweden', 'SWE'],
    ['Switzerland.png Switzerland', 'CHE'],
    ['Greece.png Greece', 'GRC'],

    // 1836 Mappings (that we will correct later)
    ['Prussia.png Prussia', 'DEU'],
    ['Bavaria.png Bavaria', 'DEU'],
    ['Hannover.png Hannover', 'DEU'],
    ['Saxony.png Saxony', 'DEU'],
    ['Württemberg.png Württemberg', 'DEU'],
    ['Baden.png Baden', 'DEU'],
    ['Hesse-Kassel.png Hesse-Kassel', 'DEU'],
    ['Hesse-Darmstadt.png Hesse-Darmstadt', 'DEU'],
    ['Lübeck.png Lübeck', 'DEU'],
    ['Hamburg.png Hamburg', 'DEU'],
    ['Bremen.png Bremen', 'DEU'],
    ['Frankfurt am Main.png Frankfurt am Main', 'DEU'],
    ['Austria.png Austria', 'AUT'],
    ['Sardinia-Piedmont.png Sardinia-Piedmont', 'ITA'],
    ['Two Sicilies.png Two Sicilies', 'ITA'],
    ['Papal States.png Papal States', 'ITA'],
    ['Tuscany.png Tuscany', 'ITA'],
    ['Lucca.png Lucca', 'ITA'],
    ['Modena.png Modena', 'ITA'],
    ['Parma.png Parma', 'ITA'],
    ['Ottoman Empire.png Ottoman Empire', 'TUR'],
    ['Panjab.png Panjab', 'IND'], // Map to India
    ['Nepal.png Nepal', 'NPL'], // Need to add NPL to countryData
    ['Bhutan.png Bhutan', 'BTN'], // Need to add BTN to countryData
    ['Sikkim.png Sikkim', 'IND'],
]);

// Special Province Name Overrides (for 1836 data)
const nameToTagOverride = new Map([
    ['Sitka', 'USA'],
    ['Yakutat', 'USA'],
    ['Kenai', 'USA'],
    ['Dutch Harbor', 'USA'],
    ['Bethel', 'USA'],
    ['Fairbanks', 'USA'],
    ['Cordova', 'USA'],
    ['Unalakeet', 'USA'],
    ['Vancouver', 'CAN'],
    ['Vancouver Island', 'CAN'],
    ['San Francisco', 'USA'],
    ['Eureka', 'USA'],
    ['Sacramento', 'USA'],
    ['Monterey', 'USA'],
    ['Mariposa', 'USA'],
    ['Los Angeles', 'USA'],
    ['San Diego', 'USA'],
    ['Carson City', 'USA'],
    ['Elko', 'USA'],
    ['Las Vegas', 'USA'],
    ['Salt Lake City', 'USA'],
    ['Loa', 'USA'],
    ['Moab', 'USA'],
    ['Phoenix', 'USA'],
    ['Flagstaff', 'USA'],
    ['Tucson', 'USA'],
    ['El Paso', 'USA'],
    ['Laredo', 'USA'],
]);

const provinceColorMap = new Map(); // "R,G,B" -> { id, name }
const provinceIdToColorMap = new Map(); // "1" -> "R,G,B"
const provinceIdToOwnerMap = new Map(); // "1" -> "USA"
const provinceIdToNameMap = new Map(); // "1" -> "Sitka"

console.log('--- Starting Advanced Map Data Builder ---');

async function readCSV() {
    console.log(`Reading CSV from: ${CSV_FILE_PATH}`);
    return new Promise((resolve, reject) => {
        fs.createReadStream(CSV_FILE_PATH)
          .pipe(csv({
            separator: ';',
            headers: false  // HOI4 definition.csv has no headers
          }))
          .on('data', (row) => {
            try {
                // HOI4 format: province_id;R;G;B;type;coastal;terrain;continent
                const id = row[0];
                const r = row[1];
                const g = row[2];
                const b = row[3];
                const type = row[4] || 'land';  // land/sea/lake
                const name = type;  // For now, use type as name (we can load real names later)

                if (id && r !== undefined && g !== undefined && b !== undefined && !isNaN(parseInt(id))) {
                    const colorKey = `${r},${g},${b}`;
                    const provinceId = id;
                    provinceColorMap.set(colorKey, { id: provinceId, name: name });
                    provinceIdToColorMap.set(provinceId, colorKey);
                    provinceIdToNameMap.set(provinceId, name);
                }
            } catch (e) {
              console.error('Error processing row:', row, e);
            }
          })
          .on('end', () => {
            console.log(`CSV Pass: Found ${provinceColorMap.size} unique provinces (HOI4 format).`);
            resolve();
          })
          .on('error', (err) => {
            console.error('Error reading CSV file:', err.message);
            reject(err);
          });
    });
}

function readProvinceNames() {
    console.log(`Reading Province Names from: ${NAMES_FILE_PATH}`);
    return new Promise((resolve, reject) => {
        const fileContent = fs.readFileSync(NAMES_FILE_PATH, 'utf8');
        const lines = fileContent.split('\n');
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const columns = line.split('\t');
            if (columns.length < 8) continue;

            const id = columns[0].trim();
            const name = columns[1].trim();
            const owner = columns[2].trim();
            const region = columns[7].trim(); // Continent column
            
            if (id && owner) {
                // --- Your "concede on Africa" logic ---
                if (region === 'Africa' || region === 'Egypt') {
                    continue;
                }

                // --- Your "fix by name" logic ---
                if (nameToTagOverride.has(name)) {
                    provinceIdToOwnerMap.set(id, nameToTagOverride.get(name));
                    continue; // Skip to next province
                }

                // --- My "best-guess" logic ---
                const tag = ownerToTagMap.get(owner);
                if (tag) {
                    provinceIdToOwnerMap.set(id, tag);
                }
            }
        }
        console.log(`Province Names Pass: Mapped ${provinceIdToOwnerMap.size} provinces to 2000-era owners.`);
        resolve();
    });
}

function buildBorderMap() {
    console.log(`Reading PNG from: ${PNG_FILE_PATH}`);
    const provinceBorderMap = new Map(); // "1" -> [[x,y], [x,y]]

    for (const id of provinceIdToColorMap.keys()) {
        provinceBorderMap.set(id, []);
    }

    return new Promise((resolve, reject) => {
        fs.createReadStream(PNG_FILE_PATH)
          .pipe(new PNG())
          .on('parsed', function () {
            console.log(`Loaded ${this.width}x${this.height} province map.`);
            console.log('Scanning all pixels for borders... This will take several minutes.');

            const { width, height, data } = this;

            const getColorKey = (x, y) => {
                if (x < 0 || x >= width || y < 0 || y >= height) return null;
                const idx = (width * y + x) << 2;
                if (data[idx + 3] === 0) return null;
                return `${data[idx]},${data[idx+1]},${data[idx+2]}`;
            };

            for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                const myColorKey = getColorKey(x, y);
                if (!myColorKey) continue;

                const myProvince = provinceColorMap.get(myColorKey);
                if (!myProvince) continue;

                const neighbors = [
                    getColorKey(x, y - 1),
                    getColorKey(x, y + 1),
                    getColorKey(x - 1, y),
                    getColorKey(x + 1, y)
                ];

                let isBorder = false;
                for (const neighborColorKey of neighbors) {
                    if (myColorKey !== neighborColorKey) {
                        isBorder = true;
                        break;
                    }
                }

                if (isBorder) {
                    provinceBorderMap.get(myProvince.id).push([x, y]);
                }
              }
            }
            
            console.log('PNG Pass: Border calculation complete.');
            resolve(provinceBorderMap);
          })
          .on('error', (err) => {
            console.error('Error reading PNG file:', err.message);
            reject(err);
          });
    });
}

function generateProvinceDataFile() {
    console.log(`Generating ${DATA_OUTPUT_PATH}...`);
    let fileContent = `
// THIS FILE IS AUTO-GENERATED BY 'scripts/build-map-data.js'
// DO NOT EDIT THIS FILE MANUALLY!

export interface Province {
    id: string; // The game's internal ID, e.g., "1", "1234"
    name: string; // The display name
}

export const provinceColorMap = new Map<string, Province>([
`;
    for (const [key, data] of provinceColorMap.entries()) {
        fileContent += `    ["${key}", { id: "${data.id}", name: "${data.name}" }],\n`;
    }
    fileContent += ']);\n';
    fs.writeFileSync(DATA_OUTPUT_PATH, fileContent);
    console.log('✅ Successfully created src/provinceData.ts!');
}

function generateProvinceBorderFile(borderMap) {
    console.log(`Generating ${BORDER_OUTPUT_PATH}...`);
    let fileContent = `
// THIS FILE IS AUTO-GENERATED BY 'scripts/build-map-data.js'
// DO NOT EDIT THIS FILE MANUALLY!

// Maps a Province ID (e.g., "1") to an array of its border pixels [x, y]
export const provinceBorders = new Map<string, [number, number][]>([
`;
    for (const [id, pixels] of borderMap.entries()) {
      fileContent += `    ["${id}", [\n`;
      const batchSize = 10;
      for (let i = 0; i < pixels.length; i += batchSize) {
          const batch = pixels.slice(i, i + batchSize);
          fileContent += `        ${batch.map(p => `[${p[0]},${p[1]}]`).join(',')},\n`;
      }
      fileContent += `    ]],\n`;
    }
    fileContent += ']);\n';
    fs.writeFileSync(BORDER_OUTPUT_PATH, fileContent);
    console.log('✅ Successfully created src/provinceBorders.ts!');
}

function generateProvinceAssignmentsFile() {
    console.log(`Generating ${ASSIGNMENTS_OUTPUT_PATH}...`);
    let fileContent = `
// This file is AUTO-GENERATED by the builder script as a "first pass".
// You can now edit this file, or use the in-game editor and
// paste the exported data here to overwrite it.

export const provinceToCountryMap = new Map<string, string>([
`;
    for (const [provinceId, countryId] of provinceIdToOwnerMap.entries()) {
        fileContent += `    ["${provinceId}", "${countryId}"],\n`;
    }
    fileContent += ']);\n';
    fs.writeFileSync(ASSIGNMENTS_OUTPUT_PATH, fileContent);
    console.log('✅ Successfully created src/provinceAssignments.ts!');
}

// --- Run the Builder ---
async function run() {
    try {
        await readCSV();
        // Skip province names and borders for HOI4 map (13,000+ provinces - too slow!)
        // await readProvinceNames();
        // const borderMap = await buildBorderMap();
        generateProvinceDataFile();
        // generateProvinceBorderFile(borderMap);
        // generateProvinceAssignmentsFile();
        console.log('--- Map Data Builder Finished Successfully (HOI4 Basic Mode) ---');
        console.log('Note: Border generation and province assignments skipped for performance.');
    } catch (err) {
        console.error("Builder failed:", err);
    }
}

run();