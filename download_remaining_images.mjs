import fs from "fs";
import path from "path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

const items = {
  "Black Current Shake": "black currant milkshake",
  "Chilli Chicken": "chilli chicken",
  "Chocolate Shake": "chocolate milkshake",
  "Cold Coffee": "cold coffee",
  "Dhai Papdi": "dahi papdi",
  "Dhai Puri": "dahi puri",
  "Double Egg Noodles": "egg noodles",
  "Egg / Chicken Puff": "chicken puff pastry",
  "Grapes Juice": "grape juice",
  "Hot Dog": "hot dog",
  "Mosambi Juice": "sweet lime juice",
  "Oreo Milk Shake": "oreo milkshake",
  "Pani Puri": "pani puri",
  "Papdi Chat": "papdi chaat",
  "Pav Bhaji": "pav bhaji",
  "Pineapple Juice": "pineapple juice",
  "Samosa": "samosa",
  "Samosa Chat": "samosa chaat",
  "Sapota Juice": "sapota juice",
  "Schezwan Chicken": "schezwan chicken",
  "Schezwan Chicken Fried Rice": "chicken fried rice",
  "Sev Puri": "sev puri",
  "Strawberry Shake": "strawberry milkshake",
  "Veg Fried Rice": "vegetable fried rice",
  "Watermelon Juice": "watermelon juice"
};

const userAgent =
  "SmartCanteenImageDownloader/1.0 (college project)";

function slug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchWikimedia(query) {
  const url =
    "https://commons.wikimedia.org/w/api.php" +
    "?action=query" +
    "&generator=search" +
    "&gsrsearch=" + encodeURIComponent(query) +
    "&gsrnamespace=6" +
    "&gsrlimit=5" +
    "&prop=imageinfo" +
    "&iiprop=url" +
    "&iiurlwidth=900" +
    "&format=json";

  for (let attempt = 1; attempt <= 5; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": userAgent,
        "Api-User-Agent": userAgent
      }
    });

    if (response.ok) {
      const data = await response.json();
      const pages = Object.values(data.query?.pages || {});

      for (const page of pages) {
        const info = page.imageinfo?.[0];

        if (!info?.thumburl) continue;

        const title = (page.title || "").toLowerCase();

        if (
          title.endsWith(".jpg") ||
          title.endsWith(".jpeg") ||
          title.endsWith(".png") ||
          title.endsWith(".webp")
        ) {
          return info.thumburl;
        }
      }

      return null;
    }

    if (response.status === 429 || response.status === 503) {
      const retryAfter = Number(response.headers.get("retry-after"));

      const wait =
        Number.isFinite(retryAfter)
          ? retryAfter * 1000
          : Math.min(30000, 5000 * Math.pow(2, attempt - 1));

      console.log(`⏳ Rate limited. Waiting ${Math.ceil(wait / 1000)} seconds...`);
      await sleep(wait);
      continue;
    }

    throw new Error(`Wikimedia search failed: ${response.status}`);
  }

  throw new Error("Too many rate-limit retries.");
}

async function downloadImage(url, filename) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": userAgent
    }
  });

  if (!response.ok) {
    throw new Error(`Image download failed: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filename, buffer);
}

async function updateDatabase(name, imagePath) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/menu_items?name=eq.${encodeURIComponent(name)}`,
    {
      method: "PATCH",
      headers: {
        ...headers,
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        image_url: imagePath
      })
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

async function main() {
  const folder = path.join(
    process.cwd(),
    "public",
    "menu-images"
  );

  fs.mkdirSync(folder, { recursive: true });

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const [name, query] of Object.entries(items)) {
    const filename = `${slug(name)}.jpg`;
    const filepath = path.join(folder, filename);
    const imagePath = `/menu-images/${filename}`;

    if (fs.existsSync(filepath)) {
      console.log(`⏭️ Already exists: ${name}`);
      skipped++;
      continue;
    }

    try {
      console.log(`\n🔎 ${name}`);

      const imageUrl = await searchWikimedia(query);

      if (!imageUrl) {
        console.log("⚠️ No suitable image found");
        failed++;
        continue;
      }

      await downloadImage(imageUrl, filepath);
      await updateDatabase(name, imagePath);

      console.log(`✅ ${name}`);
      success++;

      // Stay well below the API request rate.
      await sleep(5000);

    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      failed++;
    }
  }

  console.log("\n================================");
  console.log(`✅ Downloaded: ${success}`);
  console.log(`⏭️ Already existed: ${skipped}`);
  console.log(`⚠️ Failed: ${failed}`);
  console.log("================================");
}

main().catch(error => {
  console.error("❌", error.message);
  process.exit(1);
});