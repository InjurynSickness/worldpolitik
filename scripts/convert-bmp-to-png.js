// Convert BMP files to PNG for web browser compatibility
import { Jimp } from 'jimp';
import fs from 'fs';

async function convertBMP(inputPath, outputPath) {
    console.log(`Converting ${inputPath} to ${outputPath}...`);
    const startTime = Date.now();
    const inputSize = (fs.statSync(inputPath).size / (1024 * 1024)).toFixed(1);

    const image = await Jimp.read(inputPath);
    await image.write(outputPath);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const outputSize = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(1);
    console.log(`  ✓ Done in ${duration}s (${inputSize}MB -> ${outputSize}MB)`);
}

async function main() {
    console.log('Converting HOI4 BMP files to PNG for web compatibility...\n');

    try {
        await convertBMP('provinces.bmp', 'provinces.png');
        await convertBMP('terrain.bmp', 'terrain.png');
        await convertBMP('rivers.bmp', 'rivers.png');

        console.log('\n✅ All files converted successfully!');
        console.log('The map will now load in the browser.');
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
