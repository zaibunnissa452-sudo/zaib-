const menuImageByName: Record<string, string> = {
  "chicken manchurian": "/menu-images/chicken-manchurian.jpg",
  "chicken lollipop": "/menu-images/chicken-lollipop.jpg",
  "chicken 65": "/menu-images/chicken-65.jpg",
  "chilli chicken": "/menu-images/chilli-chicken.jpg",
  "veg fried rice": "/menu-images/veg-fried-rice.jpg",
  "double egg noodles": "/menu-images/double-egg-noodles.jpg",
  "schezwan chicken": "/menu-images/schezwan-chicken.jpg",
  "chicken noodles": "/menu-images/chicken-noodles.jpg",
  "schezwan chicken fried rice": "/menu-images/schezwan-chicken-fried-rice.jpg",
  samosa: "/menu-images/samosa.jpg",
  "hot dog": "/menu-images/hot-dog.jpg",
  "chicken burger": "/menu-images/chicken-burger.jpg",
  "egg chicken puff": "/menu-images/egg-chicken-puff.jpg",
  "chicken 65 roll": "/menu-images/chicken-65-roll.jpg",
  "chicken grilled sandwich": "/menu-images/chicken-grilled-sandwich.jpg",
  "mosambi juice": "/menu-images/mosambi-juice.jpg",
  "watermelon juice": "/menu-images/watermelon-juice.jpg",
  "banana juice": "/menu-images/banana-juice.jpg",
  "grapes juice": "/menu-images/grapes-juice.jpg",
  "pineapple juice": "/menu-images/pineapple-juice.jpg",
  "sapota juice": "/menu-images/sapota-juice.jpg",
  "cold coffee": "/menu-images/cold-coffee.jpg",
  "oreo milk shake": "/menu-images/oreo-milk-shake.jpg",
  "strawberry shake": "/menu-images/strawberry-shake.jpg",
  "chocolate shake": "/menu-images/chocolate-shake.jpg",
  "black current shake": "/menu-images/black-current-shake.jpg",
  bhel: "/menu-images/bhel.jpg",
  "dhai puri": "/menu-images/dhai-puri.jpg",
  "papdi chat": "/menu-images/papdi-chat.jpg",
  "dhai papdi": "/menu-images/dhai-papdi.jpg",
  "samosa chat": "/menu-images/samosa-chat.jpg",
  "pani puri": "/menu-images/pani-puri.jpg",
  "sev puri": "/menu-images/sev-puri.jpg",
  "pav bhaji": "/menu-images/pav-bhaji.jpg",
};

const canteenImageByName: Record<string, string> = {
  "food and beverages": "/menu-images/chicken-burger.jpg",
  "fresh juice and milk shakes": "/menu-images/watermelon-juice.jpg",
  "chaat corner": "/menu-images/pani-puri.jpg",
};

function normalizeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function menuImageFor(name: string) {
  return menuImageByName[normalizeName(name)];
}

export function canteenImageFor(name: string) {
  return canteenImageByName[normalizeName(name)];
}
