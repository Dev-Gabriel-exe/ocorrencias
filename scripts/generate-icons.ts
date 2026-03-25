import sharp from "sharp";
import fs from "fs";
import path from "path";

const outputDir = path.join(process.cwd(), "public");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>

  <!-- background -->
  <rect width="512" height="512" rx="100" fill="url(#grad)"/>

  <!-- icon -->
  <g transform="translate(96,96) scale(1.3)">
    <path d="M128 0L0 64l128 64 128-64-128-64zM0 192l128 64 128-64M0 128l128 64 128-64"
      stroke="white"
      stroke-width="16"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"/>
  </g>
</svg>
`;

async function generate() {
  await sharp(Buffer.from(svg))
    .resize(192, 192)
    .toFile(path.join(outputDir, "icon-192.png"));

  await sharp(Buffer.from(svg))
    .resize(512, 512)
    .toFile(path.join(outputDir, "icon-512.png"));

  console.log("✅ Ícones gerados em /public");
}

generate();