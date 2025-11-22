// Convert DDS texture files to PNG for web use
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('=== DDS to PNG Converter ===\n');

// Parse DDS header manually
function parseDDSHeader(buffer) {
    const magic = buffer.toString('ascii', 0, 4);
    if (magic !== 'DDS ') {
        throw new Error('Invalid DDS magic number');
    }

    const height = buffer.readUInt32LE(12);
    const width = buffer.readUInt32LE(16);
    const fourCC = buffer.toString('ascii', 84, 88);

    return { width, height, fourCC };
}

// Decompress DXT5 block
function decompressDXT5Block(block, pixels, blockX, blockY, width, height) {
    // Alpha block (8 bytes)
    const alpha0 = block[0];
    const alpha1 = block[1];
    const alphaBits =
        block[2] |
        (block[3] << 8) |
        (block[4] << 16) |
        (block[5] << 24) |
        (block[6] << 32) |
        (block[7] << 40);

    // Color block (8 bytes)
    const color0 = block.readUInt16LE(8);
    const color1 = block.readUInt16LE(10);
    const colorIndices = block.readUInt32LE(12);

    // Decode RGB565 colors
    const r0 = Math.round(((color0 >> 11) & 0x1F) * 255 / 31);
    const g0 = Math.round(((color0 >> 5) & 0x3F) * 255 / 63);
    const b0 = Math.round((color0 & 0x1F) * 255 / 31);

    const r1 = Math.round(((color1 >> 11) & 0x1F) * 255 / 31);
    const g1 = Math.round(((color1 >> 5) & 0x3F) * 255 / 63);
    const b1 = Math.round((color1 & 0x1F) * 255 / 31);

    // Interpolated colors
    const colors = [
        [r0, g0, b0],
        [r1, g1, b1],
        [
            Math.round((2 * r0 + r1) / 3),
            Math.round((2 * g0 + g1) / 3),
            Math.round((2 * b0 + b1) / 3)
        ],
        [
            Math.round((r0 + 2 * r1) / 3),
            Math.round((g0 + 2 * g1) / 3),
            Math.round((b0 + 2 * b1) / 3)
        ]
    ];

    // Interpolated alphas
    const alphas = [alpha0, alpha1];
    if (alpha0 > alpha1) {
        for (let i = 1; i <= 6; i++) {
            alphas.push(Math.round(alpha0 * (7 - i) / 7 + alpha1 * i / 7));
        }
    } else {
        for (let i = 1; i <= 4; i++) {
            alphas.push(Math.round(alpha0 * (5 - i) / 5 + alpha1 * i / 5));
        }
        alphas.push(0);
        alphas.push(255);
    }

    // Decode 4x4 block
    for (let py = 0; py < 4; py++) {
        for (let px = 0; px < 4; px++) {
            const x = blockX * 4 + px;
            const y = blockY * 4 + py;

            if (x >= width || y >= height) continue;

            const pixelIndex = py * 4 + px;

            // Color index (2 bits)
            const colorIdx = (colorIndices >> (pixelIndex * 2)) & 0x3;

            // Alpha index (3 bits) - use bit shifting for large numbers
            let alphaIdx;
            if (pixelIndex < 16) {
                alphaIdx = Number((BigInt(alphaBits) >> BigInt(pixelIndex * 3)) & BigInt(0x7));
            } else {
                alphaIdx = 0; // Shouldn't happen for 4x4 block
            }

            const outputIdx = (y * width + x) * 4;
            pixels[outputIdx] = colors[colorIdx][0];
            pixels[outputIdx + 1] = colors[colorIdx][1];
            pixels[outputIdx + 2] = colors[colorIdx][2];
            pixels[outputIdx + 3] = alphas[alphaIdx];
        }
    }
}

// Decompress full DXT5 image
function decompressDXT5(buffer, width, height) {
    const pixels = Buffer.alloc(width * height * 4);
    const blockWidth = Math.ceil(width / 4);
    const blockHeight = Math.ceil(height / 4);
    const dataOffset = 128; // DDS header is 128 bytes

    let blockIndex = 0;
    for (let by = 0; by < blockHeight; by++) {
        for (let bx = 0; bx < blockWidth; bx++) {
            const offset = dataOffset + blockIndex * 16; // 16 bytes per DXT5 block
            const block = buffer.slice(offset, offset + 16);
            decompressDXT5Block(block, pixels, bx, by, width, height);
            blockIndex++;
        }
    }

    return pixels;
}

// Convert DDS to PNG
async function convertDDSToPNG(inputPath, outputPath) {
    try {
        console.log(`[Converter] Reading ${path.basename(inputPath)}...`);

        const buffer = fs.readFileSync(inputPath);
        const { width, height, fourCC } = parseDDSHeader(buffer);

        console.log(`[Converter] Format: ${fourCC}, Size: ${width}x${height}`);

        if (fourCC !== 'DXT5') {
            throw new Error(`Unsupported format: ${fourCC} (only DXT5 supported)`);
        }

        // Decompress DXT5
        const pixels = decompressDXT5(buffer, width, height);

        // Create PNG
        const png = new PNG({
            width,
            height,
            filterType: -1
        });

        png.data = pixels;

        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Write PNG
        await new Promise((resolve, reject) => {
            png.pack()
                .pipe(fs.createWriteStream(outputPath))
                .on('finish', resolve)
                .on('error', reject);
        });

        console.log(`[Converter] ✓ Saved to ${outputPath}\n`);
        return true;

    } catch (error) {
        console.error(`[Converter] ✗ Failed:`, error.message);
        return false;
    }
}

// Convert all water textures
const conversions = [
    {
        input: path.join(projectRoot, 'terrain', 'colormap_water_0.dds'),
        output: path.join(projectRoot, 'public', 'colormap_water_0.png')
    },
    {
        input: path.join(projectRoot, 'terrain', 'colormap_water_1.dds'),
        output: path.join(projectRoot, 'public', 'colormap_water_1.png')
    },
    {
        input: path.join(projectRoot, 'terrain', 'colormap_water_2.dds'),
        output: path.join(projectRoot, 'public', 'colormap_water_2.png')
    }
];

let successCount = 0;

for (const { input, output } of conversions) {
    const success = await convertDDSToPNG(input, output);
    if (success) successCount++;
}

console.log(`\n=== Conversion Complete ===`);
console.log(`Successfully converted: ${successCount}/${conversions.length} files`);

if (successCount === conversions.length) {
    console.log('✓ All water textures ready for use!');
    console.log('\nNext steps:');
    console.log('  1. Water textures are now in public/ folder');
    console.log('  2. Run integration script to add them to the map');
} else {
    console.log('⚠ Some conversions failed. Check errors above.');
    process.exit(1);
}
