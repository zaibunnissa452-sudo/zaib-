import fs from "fs";
import path from "path";

const folder = path.join(process.cwd(), "public", "menu-images");
fs.mkdirSync(folder, { recursive: true });

const urls = [
  "https://images.unsplash.com/photo-1577805947697-89e18249d767?w=900",
  "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=900"
];

async function main() {
  const filename = path.join(folder, "black-current-shake.jpg");

  for (const url of urls) {
    try {
      const response = await fetch(url);

      if (!response.ok) continue;

      const buffer = Buffer.from(await response.arrayBuffer());

      if (buffer.length < 10000) continue;

      fs.writeFileSync(filename, buffer);

      console.log("✅ Black Current Shake image downloaded");
      return;
    } catch {}
  }

  console.log("❌ Could not download image");
}

main();