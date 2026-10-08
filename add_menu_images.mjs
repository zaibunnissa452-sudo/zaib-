const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Supabase environment variables are missing.");
  console.error("Make sure .env contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

function lockNumber(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) + 100;
}

function getImageUrl(item) {
  const name = item.name.toLowerCase();
  const category = (item.category || "").toLowerCase();

  let tags = `${item.name},food`;

  // Stall 2 - Juices
  if (name.includes("watermelon")) {
    tags = "watermelon,juice";
  } else if (name.includes("pineapple")) {
    tags = "pineapple,juice";
  } else if (name.includes("sapota")) {
    tags = "sapodilla,chikoo,juice";
  } else if (name.includes("grape")) {
    tags = "grape,juice";
  } else if (name.includes("mosambi")) {
    tags = "sweet,lime,juice";
  } else if (name.includes("banana")) {
    tags = "banana,milkshake";
  }

  // Stall 2 - Milk Shakes
  else if (name.includes("cold coffee")) {
    tags = "cold,coffee,drink";
  } else if (name.includes("oreo")) {
    tags = "oreo,milkshake";
  } else if (name.includes("strawberry")) {
    tags = "strawberry,milkshake";
  } else if (name.includes("chocolate")) {
    tags = "chocolate,milkshake";
  } else if (name.includes("black current") || name.includes("blackcurrant")) {
    tags = "blackcurrant,milkshake";
  }

  // Common Indian snacks
  else if (name.includes("samosa")) {
    tags = "samosa,indian,snack";
  } else if (name.includes("puff")) {
    tags = "puff,pastry,indian,snack";
  } else if (name.includes("sandwich")) {
    tags = "sandwich,indian,streetfood";
  } else if (name.includes("burger")) {
    tags = "burger,food";
  } else if (name.includes("pizza")) {
    tags = "pizza,food";
  } else if (name.includes("roll")) {
    tags = "chicken,roll,streetfood";
  }

  // Chinese
  else if (name.includes("noodle")) {
    tags = "noodles,chinese,food";
  } else if (name.includes("fried rice")) {
    tags = "fried,rice,chinese";
  } else if (name.includes("manchurian")) {
    tags = "manchurian,chinese,food";
  } else if (name.includes("65")) {
    tags = "chicken,65,indian,food";
  }

  // Chicken
  else if (name.includes("chicken")) {
    tags = "chicken,indian,food";
  }

  // Chaat
  else if (
    name.includes("chaat") ||
    name.includes("pani puri") ||
    name.includes("panipuri") ||
    name.includes("bhel") ||
    name.includes("dahi puri") ||
    name.includes("sev puri")
  ) {
    tags = "chaat,indian,streetfood";
  }

  // Category fallback
  else if (category.includes("juice")) {
    tags = `${item.name},juice,drink`;
  } else if (category.includes("shake")) {
    tags = `${item.name},milkshake,drink`;
  } else if (category.includes("chinese")) {
    tags = `${item.name},chinese,food`;
  } else if (category.includes("chicken")) {
    tags = `${item.name},chicken,food`;
  } else if (category.includes("snack")) {
    tags = `${item.name},indian,snack`;
  } else if (category.includes("chaat")) {
    tags = `${item.name},chaat,indian,streetfood`;
  }

  const encodedTags = encodeURIComponent(tags);

  return `https://loremflickr.com/800/600/${encodedTags}?lock=${lockNumber(item.id)}`;
}

async function getMenuItems() {
  const url =
    `${SUPABASE_URL}/rest/v1/menu_items` +
    `?select=id,name,category,image_url,canteen_id&order=name`;

  const response = await fetch(url, {
    headers,
  });

  if (!response.ok) {
    throw new Error(
      `Could not read menu_items: ${response.status} ${await response.text()}`
    );
  }

  return await response.json();
}

async function updateImage(item) {
  const image_url = getImageUrl(item);

  const url =
    `${SUPABASE_URL}/rest/v1/menu_items` +
    `?id=eq.${encodeURIComponent(item.id)}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      ...headers,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ image_url }),
  });

  if (!response.ok) {
    console.error(
      `❌ ${item.name}: ${response.status} ${await response.text()}`
    );
    return false;
  }

  console.log(`✅ ${item.name} → ${image_url}`);
  return true;
}

async function main() {
  console.log("🔄 Reading menu items...\n");

  const items = await getMenuItems();

  if (!items.length) {
    console.log("⚠️ No menu items found.");
    return;
  }

  console.log(`Found ${items.length} menu items.\n`);

  let success = 0;

  for (const item of items) {
    if (await updateImage(item)) {
      success++;
    }
  }

  console.log("\n--------------------------------");
  console.log(`🎉 Images updated: ${success}/${items.length}`);
  console.log("--------------------------------");
}

main().catch(error => {
  console.error("\n❌ ERROR:", error.message);
  process.exit(1);
});