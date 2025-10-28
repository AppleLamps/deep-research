const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const sizes = [192, 512];
const inputSvg = path.join(__dirname, "../public/icon.svg");
const screenshotSvg = path.join(__dirname, "../public/screenshot.svg");
const outputDir = path.join(__dirname, "../public");

async function generateIcons() {
  console.log("Generating PWA icons...");

  // Generate app icons
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

    await sharp(inputSvg).resize(size, size).png().toFile(outputPath);

    console.log(`✓ Generated ${size}x${size} icon`);
  }

  // Generate screenshot
  const screenshotPath = path.join(outputDir, "screenshot.png");
  await sharp(screenshotSvg).resize(540, 720).png().toFile(screenshotPath);

  console.log("✓ Generated screenshot (540x720)");

  console.log("✓ All icons generated successfully!");
}

generateIcons().catch(console.error);
