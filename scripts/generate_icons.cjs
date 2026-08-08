const fs = require('fs');
const { execSync } = require('child_process');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a" />
      <stop offset="50%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
    <linearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f1f5f9" />
    </linearGradient>
  </defs>
  
  <!-- Rounded container background for app icon -->
  <rect width="512" height="512" rx="100" fill="url(#bg)" />
  
  <!-- Outer subtle glass highlight -->
  <rect x="14" y="14" width="484" height="484" rx="88" fill="none" stroke="#93c5fd" stroke-width="6" stroke-opacity="0.35" />

  <!-- App Symbol / Logo graphic -->
  <g transform="translate(0, 10)">
    <!-- Signal pulse background glow -->
    <circle cx="256" cy="220" r="140" fill="#3b82f6" fill-opacity="0.2" />

    <!-- Top small label META -->
    <text x="256" y="160" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="40" fill="#93c5fd" letter-spacing="14" text-anchor="middle">META</text>
    
    <!-- Big title ANDON -->
    <text x="256" y="255" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="88" fill="url(#metal)" letter-spacing="4" text-anchor="middle">ANDON</text>

    <!-- Signal / Quality Icon Badge -->
    <path d="M 170 330 L 215 295 L 260 345 L 340 265" fill="none" stroke="#60a5fa" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="340" cy="265" r="16" fill="#60a5fa" />
  </g>

  <!-- Bottom subtitle pill -->
  <rect x="46" y="408" width="420" height="48" rx="24" fill="#ffffff" fill-opacity="0.18" />
  <text x="256" y="439" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="20" fill="#ffffff" text-anchor="middle" letter-spacing="1">MỖI NHÂN VIÊN LÀ MỘT QC</text>
</svg>`;

fs.writeFileSync('public/logo_meta.svg', svg);

console.log('Saved public/logo_meta.svg');

try {
  execSync('convert public/logo_meta.svg -resize 512x512 public/icon-512.png');
  execSync('convert public/logo_meta.svg -resize 192x192 public/icon-192.png');
  execSync('convert public/logo_meta.svg -resize 180x180 public/apple-touch-icon.png');
  execSync('convert public/logo_meta.svg -resize 512x512 public/logo_meta.png');
  execSync('convert public/logo_meta.svg -resize 32x32 public/favicon.png');
  execSync('convert public/logo_meta.svg -resize 32x32 public/favicon.ico');
  execSync('convert public/logo_meta.svg -resize 512x512 public/logo_meta.jpg');
  execSync('convert public/logo_meta.svg -resize 512x512 public/logo_4m.jpg');
  console.log('Successfully generated all icon sizes (PNG, ICO, JPG, SVG)!');
} catch (e) {
  console.error('Error generating icons via ImageMagick convert:', e.message);
}
