/**
 * Generates Expo asset icons from source PNG (1024x1024 recommended).
 * Usage: node scripts/generate-icons.js [sourcePath]
 */
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const defaultSource = path.join(
  root,
  "scripts",
  "icon-source.png"
);
const source = process.argv[2] || defaultSource;
const assetsDir = path.join(root, "assets");

const outputs = [
  { file: "icon.png", size: 1024 },
  { file: "splash-icon.png", size: 512 },
  { file: "adaptive-icon.png", size: 1024 },
  { file: "favicon.png", size: 48 },
];

async function main() {
  if (!fs.existsSync(source)) {
    console.error(`Source not found: ${source}`);
    process.exit(1);
  }
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  for (const { file, size } of outputs) {
    const out = path.join(assetsDir, file);
    await sharp(source)
      .resize(size, size, { fit: "contain", background: "#FFFFFF" })
      .png()
      .toFile(out);
    console.log(`Wrote ${out} (${size}x${size})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
