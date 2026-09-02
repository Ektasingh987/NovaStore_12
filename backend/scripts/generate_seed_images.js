'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Helper to create a simple, valid PNG image with solid color & text representation
function createPng(width, height, r, g, b) {
  // A minimal valid PNG builder
  function createChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);

    // CRC32 calculation
    let c = 0xffffffff;
    const combined = Buffer.concat([typeBuf, data]);
    for (let i = 0; i < combined.length; i++) {
      c ^= combined[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
    }
    crcBuf.writeInt32BE((c ^ 0xffffffff) | 0, 0);

    return Buffer.concat([len, combined, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(2, 9); // color type (RGB)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  const ihdr = createChunk('IHDR', ihdrData);

  // Raw image data with scanline filter bytes
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // None filter
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      // Add subtle gradient
      const factor = 1 - (y / height) * 0.2;
      rawData[pxOffset] = Math.min(255, Math.floor(r * factor));
      rawData[pxOffset + 1] = Math.min(255, Math.floor(g * factor));
      rawData[pxOffset + 2] = Math.min(255, Math.floor(b * factor));
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const idat = createChunk('IDAT', idatData);
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

const productsDir = path.resolve(__dirname, '../uploads/products');
const categoriesDir = path.resolve(__dirname, '../uploads/categories');

fs.mkdirSync(productsDir, { recursive: true });
fs.mkdirSync(categoriesDir, { recursive: true });

const categoryFiles = [
  { name: 'electronics.jpg', color: [99, 102, 241] }, // Indigo
  { name: 'fashion.jpg', color: [236, 72, 153] },     // Pink
  { name: 'home.jpg', color: [245, 158, 11] },        // Amber
  { name: 'books.jpg', color: [16, 185, 129] },       // Emerald
  { name: 'beauty.jpg', color: [217, 70, 239] },      // Fuchsia
  { name: 'sports.jpg', color: [14, 165, 233] },      // Sky
  { name: 'toys.jpg', color: [249, 115, 22] },        // Orange
];

const productFiles = [
  { name: 'sony-xm5.jpg', color: [30, 41, 59] },
  { name: 'mx-master-3s.jpg', color: [51, 65, 85] },
  { name: 'apple-20w.jpg', color: [241, 245, 249] },
  { name: 'anker-737.jpg', color: [15, 23, 42] },
  { name: 'keyboard-rgb.jpg', color: [147, 51, 234] },
  { name: 'levis-511.jpg', color: [30, 58, 138] },
  { name: 'tshirt-pack.jpg', color: [71, 85, 105] },
  { name: 'nike-pegasus.jpg', color: [225, 29, 72] },
  { name: 'sunglasses.jpg', color: [202, 138, 4] },
  { name: 'instant-pot.jpg', color: [100, 116, 139] },
  { name: 'philips-airfryer.jpg', color: [15, 23, 42] },
  { name: 'cast-iron.jpg', color: [38, 38, 38] },
  { name: 'water-bottle.jpg', color: [13, 148, 136] },
  { name: 'clean-code.jpg', color: [2, 132, 199] },
  { name: 'atomic-habits.jpg', color: [234, 88, 12] },
  { name: 'moleskine.jpg', color: [24, 24, 27] },
  { name: 'niacinamide.jpg', color: [244, 114, 182] },
  { name: 'oral-b.jpg', color: [37, 99, 235] },
  { name: 'cerave.jpg', color: [59, 130, 246] },
  { name: 'yoga-mat.jpg', color: [124, 58, 237] },
  { name: 'dumbbells.jpg', color: [75, 85, 99] },
  { name: 'jump-rope.jpg', color: [220, 38, 38] },
  { name: 'lego-bonsai.jpg', color: [22, 163, 74] },
  { name: 'catan.jpg', color: [217, 119, 6] },
];

console.log('Generating seed category images...');
for (const cat of categoryFiles) {
  const buf = createPng(400, 400, cat.color[0], cat.color[1], cat.color[2]);
  fs.writeFileSync(path.join(categoriesDir, cat.name), buf);
  console.log(`  + ${cat.name}`);
}

console.log('Generating seed product images...');
for (const prod of productFiles) {
  const buf = createPng(500, 500, prod.color[0], prod.color[1], prod.color[2]);
  fs.writeFileSync(path.join(productsDir, prod.name), buf);
  console.log(`  + ${prod.name}`);
}

console.log('All seed images created successfully!');
