const fs = require('fs');
const path = require('path');

// 生成 SVG 图标内容（基于字母 Y 设计）
function generateSVG(size) {
  const strokeWidth = size * 0.08;
  const center = size / 2;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#fdfbf7"/>
  <circle cx="${center}" cy="${center}" r="${center - strokeWidth / 2}" fill="#c55d3d" opacity="0.1"/>
  <g transform="translate(${center}, ${center})">
    <path d="M 0 ${size * 0.22} L 0 ${-size * 0.08}" stroke="#c55d3d" stroke-width="${strokeWidth * 1.2}" stroke-linecap="round" fill="none"/>
    <path d="M 0 ${-size * 0.08} L ${-size * 0.18} ${-size * 0.22}" stroke="#c55d3d" stroke-width="${strokeWidth}" stroke-linecap="round" fill="none"/>
    <path d="M 0 ${-size * 0.08} L ${size * 0.18} ${-size * 0.22}" stroke="#c55d3d" stroke-width="${strokeWidth}" stroke-linecap="round" fill="none"/>
    <ellipse cx="${-size * 0.22}" cy="${-size * 0.18}" rx="${size * 0.06}" ry="${size * 0.1}" fill="#c55d3d" opacity="0.8" transform="rotate(-30)"/>
    <ellipse cx="${size * 0.22}" cy="${-size * 0.18}" rx="${size * 0.06}" ry="${size * 0.1}" fill="#c55d3d" opacity="0.8" transform="rotate(30)"/>
  </g>
</svg>`;
}

// 生成不同尺寸的 SVG
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = path.join(__dirname, '..', 'public');

sizes.forEach(size => {
  const svg = generateSVG(size);
  fs.writeFileSync(path.join(publicDir, `icon-${size}x${size}.svg`), svg);
  console.log(`Generated icon-${size}x${size}.svg`);
});

// 生成 favicon.svg（复制 32x32 版本）
const faviconSvg = generateSVG(32);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg);
console.log('Generated favicon.svg');

console.log('\nAll icons generated successfully!');
console.log('Note: Browsers can use SVG icons directly. PNG files are not needed for modern browsers.');
