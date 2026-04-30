// Generates public/icon-192.png and public/icon-512.png
// Black background, white border — matches the PASSAGE aesthetic.
import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';

const CRC_TABLE = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[i] = c;
}
function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data = Buffer.alloc(0)) {
  const t = Buffer.from(type);
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(data.length);
  const crc = Buffer.allocUnsafe(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function makePNG(size) {
  const border = Math.max(6, Math.round(size * 0.04));
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr.writeUInt8(8, 8);  // bit depth
  ihdr.writeUInt8(2, 9);  // RGB
  ihdr.fill(0, 10);

  const rowBytes = 1 + size * 3;
  const raw = Buffer.alloc(size * rowBytes);
  for (let y = 0; y < size; y++) {
    const off = y * rowBytes;
    raw[off] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const isBorder = x < border || x >= size - border || y < border || y >= size - border;
      const v = isBorder ? 255 : 0;
      raw[off + 1 + x * 3] = v;
      raw[off + 2 + x * 3] = v;
      raw[off + 3 + x * 3] = v;
    }
  }

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND')]);
}

mkdirSync('public', { recursive: true });
writeFileSync('public/icon-192.png', makePNG(192));
writeFileSync('public/icon-512.png', makePNG(512));
console.log('Icons written to public/');
