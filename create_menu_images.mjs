import fs from "fs";
import path from "path";

const items = [
  ["Banana Juice","🍌","FRESH JUICE"],
  ["Bhel","🥣","CHAAT"],
  ["Black Current Shake","🥤","MILK SHAKE"],
  ["Chicken 65","🍗","CHICKEN"],
  ["Chicken 65 Roll","🌯","CHICKEN ROLL"],
  ["Chicken Burger","🍔","BURGER"],
  ["Chicken Grilled Sandwich","🥪","GRILLED SANDWICH"],
  ["Chicken Lollipop","🍗","CHICKEN"],
  ["Chicken Manchurian","🍗","MANCHURIAN"],
  ["Chicken Noodles","🍜","NOODLES"],
  ["Chilli Chicken","🌶️","CHILLI CHICKEN"],
  ["Chocolate Shake","🍫","CHOCOLATE SHAKE"],
  ["Cold Coffee","☕","COLD COFFEE"],
  ["Dhai Papdi","🥣","DHAI PAPDI"],
  ["Dhai Puri","🥣","DHAI PURI"],
  ["Double Egg Noodles","🍜","EGG NOODLES"],
  ["Egg / Chicken Puff","🥐","PUFF"],
  ["Grapes Juice","🍇","GRAPE JUICE"],
  ["Hot Dog","🌭","HOT DOG"],
  ["Mosambi Juice","🍈","MOSAMBI JUICE"],
  ["Oreo Milk Shake","🍪","OREO SHAKE"],
  ["Pani Puri","🫓","PANI PURI"],
  ["Papdi Chat","🥣","PAPDI CHAT"],
  ["Pav Bhaji","🍛","PAV BHAJI"],
  ["Pineapple Juice","🍍","PINEAPPLE JUICE"],
  ["Samosa","🥟","SAMOSA"],
  ["Samosa Chat","🥟","SAMOSA CHAAT"],
  ["Sapota Juice","🥤","SAPOTA JUICE"],
  ["Schezwan Chicken","🍗","SCHEZWAN CHICKEN"],
  ["Schezwan Chicken Fried Rice","🍚","SCHEZWAN FRIED RICE"],
  ["Sev Puri","🥣","SEV PURI"],
  ["Strawberry Shake","🍓","STRAWBERRY SHAKE"],
  ["Veg Fried Rice","🍚","VEG FRIED RICE"],
  ["Watermelon Juice","🍉","WATERMELON JUICE"]
];

function slug(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const output = path.join(process.cwd(), "public", "menu-images");
fs.mkdirSync(output, { recursive: true });

for (const [name, emoji, label] of items) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="#17122b"/>
<stop offset="55%" stop-color="#111827"/>
<stop offset="100%" stop-color="#062d38"/>
</linearGradient>
<radialGradient id="glow">
<stop offset="0%" stop-color="#35dfff" stop-opacity=".35"/>
<stop offset="100%" stop-color="#35dfff" stop-opacity="0"/>
</radialGradient>
</defs>
<rect width="800" height="600" rx="36" fill="url(#bg)"/>
<circle cx="650" cy="100" r="260" fill="url(#glow)"/>
<circle cx="150" cy="500" r="220" fill="#7c3aed" opacity=".12"/>
<rect x="100" y="80" width="600" height="440" rx="34" fill="#ffffff" fill-opacity=".055" stroke="#ffffff" stroke-opacity=".12"/>
<text x="400" y="300" text-anchor="middle" dominant-baseline="middle" font-size="150">${emoji}</text>
<text x="400" y="410" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="34" font-weight="700">${label}</text>
<text x="400" y="460" text-anchor="middle" fill="#67e8f9" font-family="Arial" font-size="22">${name}</text>
</svg>`;

  fs.writeFileSync(path.join(output, `${slug(name)}.svg`), svg);
}

console.log(`Created ${items.length} menu images.`);
