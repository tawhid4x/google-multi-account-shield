const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ICONS_DIR = path.join(__dirname, '..', 'assets', 'icons');
const BANNERS_DIR = path.join(__dirname, '..', 'assets', 'banners');

// Ensure directories exist
[ICONS_DIR, BANNERS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Helper function to generate a tiny valid 1x1 or equivalent solid blue PNG programmatically
// To make it simple and dependency-free, we generate a small transparent or colored valid PNG by constructing the exact binary format,
// or we can use a small hardcoded base64 string for valid PNGs of different sizes, but the spec says "valid binary PNGs".
// For 16x16, 32x32, 48x48, 128x128 we will just create minimal valid PNGs from a base64 string and resize it or use identical solid color blocks.

// A 1x1 transparent PNG base64:
// iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==

// Better yet, here are base64 strings for simple colored square PNGs.
// To keep the script small and 100% dependency-free, we'll write a simple minimal valid PNG for each.
// Actually, generating a valid PNG from scratch in JS without canvas/pngjs requires writing the PNG chunks (IHDR, IDAT, IEND) and calculating CRC32.
// The prompt suggests "using zlib/fs". Let's write a generator for a valid RGBA PNG!

const crcTable = [];
for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
        if (c & 1) c = 0xedb88320 ^ (c >>> 1);
        else c = c >>> 1;
    }
    crcTable[n] = c >>> 0;
}

function crc32(buffer) {
    let crc = 0xffffffff;
    for (let i = 0; i < buffer.length; i++) {
        crc = crcTable[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const crcInput = Buffer.concat([typeBuf, data]);

    const crcVal = crc32(crcInput);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal, 0);

    return Buffer.concat([length, typeBuf, data, crcBuf]);
}

function generatePng(width, height) {
    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    // IHDR
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData[8] = 8; // Bit depth
    ihdrData[9] = 6; // Color type: RGBA
    ihdrData[10] = 0; // Compression
    ihdrData[11] = 0; // Filter
    ihdrData[12] = 0; // Interlace
    const ihdrChunk = createChunk('IHDR', ihdrData);

    // IDAT
    const rowBytes = width * 4 + 1; // +1 for filter byte
    const rawData = Buffer.alloc(height * rowBytes);

    for (let y = 0; y < height; y++) {
        const offset = y * rowBytes;
        rawData[offset] = 0; // Filter type 0 (None)
        for (let x = 0; x < width; x++) {
            const pxOffset = offset + 1 + x * 4;
            // Draw a simple shield-like pattern or solid color
            const isBorder = (x < 2 || x > width - 3 || y < 2 || y > height - 3);
            if (isBorder) {
                // Emerald
                rawData[pxOffset] = 80;
                rawData[pxOffset + 1] = 200;
                rawData[pxOffset + 2] = 120;
                rawData[pxOffset + 3] = 255;
            } else {
                // Blue
                rawData[pxOffset] = 66;
                rawData[pxOffset + 1] = 133;
                rawData[pxOffset + 2] = 244;
                rawData[pxOffset + 3] = 255;
            }
        }
    }

    const compressedData = zlib.deflateSync(rawData);
    const idatChunk = createChunk('IDAT', compressedData);

    // IEND
    const iendChunk = createChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const sizes = [16, 32, 48, 128];
sizes.forEach(size => {
    const pngBuf = generatePng(size, size);
    fs.writeFileSync(path.join(ICONS_DIR, `icon${size}.png`), pngBuf);
    console.log(`Generated icon${size}.png`);
});

// Generate icon.svg
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    <path fill="#4285f4" d="M64 8L16 29v45c0 29.5 20.6 57 48 64 27.4-7 48-34.5 48-64V29L64 8z"/>
    <path fill="#50c878" d="M64 22L28 38v36c0 22 15.5 42 36 48 20.5-6 36-26 36-48V38L64 22z"/>
</svg>`;
fs.writeFileSync(path.join(ICONS_DIR, 'icon.svg'), iconSvg);
console.log('Generated icon.svg');

// Generate architecture-diagram.svg
const diagramSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400">
    <rect width="100%" height="100%" fill="#1a1a1a" />
    <text x="50%" y="200" fill="white" font-size="24" text-anchor="middle" font-family="sans-serif">Google Multi-Account Shield Architecture Diagram</text>
</svg>`;
fs.writeFileSync(path.join(BANNERS_DIR, 'architecture-diagram.svg'), diagramSvg);
console.log('Generated architecture-diagram.svg');
