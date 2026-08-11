import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { Resvg } = require('@resvg/resvg-js');

const svgPath = path.resolve('public/logo_meta.svg');
if (!fs.existsSync(svgPath)) {
  console.error('Error: public/logo_meta.svg not found!');
  process.exit(1);
}

const svgBuffer = fs.readFileSync(svgPath);

function renderPng(width, height, relativeOutPath) {
  try {
    const resvg = new Resvg(svgBuffer, {
      fitTo: { mode: 'width', value: width },
    });
    const pngBuffer = resvg.render().asPng();
    const outPath = path.resolve(relativeOutPath);
    fs.writeFileSync(outPath, pngBuffer);
    console.log(`[Icon Generator] Generated ${relativeOutPath} (${width}x${height}, ${pngBuffer.length} bytes)`);
  } catch (err) {
    console.error(`[Icon Generator] Failed to generate ${relativeOutPath}:`, err);
  }
}

console.log('[Icon Generator] Generating binary PNG icons from public/logo_meta.svg...');
renderPng(512, 512, 'public/icon-512.png');
renderPng(192, 192, 'public/icon-192.png');
renderPng(180, 180, 'public/apple-touch-icon.png');
renderPng(64, 64, 'public/favicon.png');
renderPng(512, 512, 'public/logo-512.png');
renderPng(192, 192, 'public/logo-192.png');
renderPng(512, 512, 'public/logo_meta.png');
console.log('[Icon Generator] All icons successfully generated.');

