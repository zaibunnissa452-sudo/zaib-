import fs from "fs";
import path from "path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

const searches = {
  "Banana Juice": "banana juice",
  "Bhel": "bhel puri",
  "Black Current Shake": "black currant milkshake",
  "Chicken 65": "chicken 65",
  "Chicken 65 Roll": "chicken roll",
  "Chicken Burger": "chicken burger",
  "Chicken Grilled Sandwich": "grilled chicken sandwich",
  "Chicken Lollipop": "chicken lollipop",
  "Chicken Manchurian": "chicken manchurian",
  "Chicken Noodles": "chicken noodles",
  "Chilli Chicken": "chilli chicken",
  "Chocolate Shake": "chocolate milkshake",
  "Cold Coffee": "cold coffee",
  "Dhai Papdi": "dahi papdi",
  "Dhai Puri": "dahi puri",
  "Double Egg Noodles": "egg noodles",
  "Egg / Chicken Puff": "chicken puff pastry",
  "Grapes Juice": "grape juice",
  "Hot Dog": "hot dog food",
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
  "Schezwan Chicken Fried Rice": "schezwan chicken fried rice",
  "Sev Puri": "sev puri",
  "Strawberry Shake": "strawberry milkshake",
  "Veg Fried Rice": "vegetable fried rice",
  "Watermelon Juice": "watermelon juice"
};

function slug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function findImage(query) {
  const url =
    "https://commons.wikimedia.org/w/api.php" +
    "?action=query" +
    "&generator=search" +
    "&gsrsearch=" + encodeURIComponent(query + " food") +
    "&gsrnamespace=6" +
    "&gsrlimit=10" +
    "&prop=imageinfo" +
    "&iiprop=url" +
    "&iiurlwidth=900" +
    "&format=json" +
    "&origin=*";

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Wikimedia search failed: ${response.status}`);
  }

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

async function download(url, filename) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
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
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase environment variables are missing.");
  }

  const folder = path.join(process.cwd(), "public", "menu-images");
  fs.mkdirSync(folder, { recursive: true });

  let success = 0;
  let failed = 0;

  for (const [name, query] of Object.entries(searches)) {
    const filename = `${slug(name)}.jpg`;
    const filepath = path.join(folder, filename);
    const imagePath = `/menu-images/${filename}`;

    try {
      console.log(`\n🔎 ${name}`);

      const imageUrl = await findImage(query);

      if (!imageUrl) {
        console.log(`⚠️ No suitable image found`);
        failed++;
        continue;
      }

      await download(imageUrl, filepath);
      await updateDatabase(name, imagePath);

      console.log(`✅ ${name}`);
      success++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      failed++;
    }
  }

  console.log("\n================================");
  console.log(`✅ Successful: ${success}`);
  console.log(`⚠️ Failed: ${failed}`);
  console.log("================================");
}

main().catch(error => {
  console.error("\n❌", error.message);
  process.exit(1);
});
