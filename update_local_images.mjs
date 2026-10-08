const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal"
};

function slug(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/menu_items?select=id,name`,
    { headers }
  );

  if (!response.ok) throw new Error(await response.text());

  const items = await response.json();

  for (const item of items) {
    const image_url = `/menu-images/${slug(item.name)}.svg`;

    const update = await fetch(
      `${SUPABASE_URL}/rest/v1/menu_items?id=eq.${item.id}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ image_url })
      }
    );

    console.log(update.ok ? `✅ ${item.name}` : `❌ ${item.name}`);
  }

  console.log(`\n🎉 Updated ${items.length} menu images.`);
}

main().catch(error => {
  console.error("❌", error.message);
  process.exit(1);
});
