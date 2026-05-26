import { NextResponse } from "next/server";

const SHOPIFY_URL = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/graphql.json`;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;

const TAG_MAP: Record<string, string> = {
  "amethyst": "Amethyst (Jamunia)",
  "jamunia": "Amethyst (Jamunia)",
  "blue corundum": "Blue Corundum",
  "blue topaz": "Blue Topaz",
  "brown sapphire": "Brown Sapphire",
  "cats eye": "Cats Eye (Lehsunia)",
  "lehsunia": "Cats Eye (Lehsunia)",
  "citrine": "Citrine (Sunela)",
  "sunela": "Citrine (Sunela)",
  "emerald": "Emerald (Panna)",
  "panna": "Emerald (Panna)",
  "green onyx": "Green Onyx",
  "green tourmaline": "Green Tourmaline",
  "hessonite": "Hessonite (Gomed)",
  "gomed": "Hessonite (Gomed)",
  "iolite": "Iolite (Neeli)",
  "neeli": "Iolite (Neeli)",
  "moonstone": "Moonstone",
  "alexandrite": "Natural Alexandrite",
  "diamond": "Natural Diamond",
  "opal": "Opal",
  "padparadscha": "Padparadscha Stone",
  "pearl": "Pearl (Moti)",
  "moti": "Pearl (Moti)",
  "peridot": "Peridot Stone",
  "pink sapphire": "Pink Sapphire",
  "pitambari": "Pitambari",
  "red coral": "Red Coral (Moonga)",
  "moonga": "Red Coral (Moonga)",
  "ruby": "Ruby (Manik)",
  "manik": "Ruby (Manik)",
  "spinel": "Spinel Stone",
  "sulemani black": "Sulemani Black Hakik",
  "sulemani red": "Sulemani Red Hakik",
  "turquoise": "Turquoise (Feroza)",
  "feroza": "Turquoise (Feroza)",
  "white sapphire": "White Sapphire (Safed Pukhraj)",
  "safed pukhraj": "White Sapphire (Safed Pukhraj)",
  "white topaz": "White Topaz",
  "yellow sapphire": "Yellow Sapphire (Pukhraj)",
  "pukhraj": "Yellow Sapphire (Pukhraj)",
  "yellow topaz": "Yellow Topaz",
  "zircon": "Zircon (Jarkan)",
  "jarkan": "Zircon (Jarkan)",
};

export function getTagFromTitle(title: string): string | null {
  const lower = title.toLowerCase();
  for (const [keyword, tag] of Object.entries(TAG_MAP)) {
    if (lower.includes(keyword)) return tag;
  }
  return null;
}

const UPDATE_TAGS = `
  mutation productUpdate($input: ProductInput!) {
    productUpdate(input: $input) {
      product { id tags }
      userErrors { field message }
    }
  }
`;

export async function POST(req: Request) {
  // products = [{ productId, title, tags: string[] }]
  const { products } = await req.json();

  let updated = 0;
  let skipped = 0;
  const errors: any[] = [];

  for (const p of products) {
    const newTag = getTagFromTitle(p.title);

    // Title se koi tag match nahi hua
    if (!newTag) {
      skipped++;
      continue;
    }

    // Tag already hai
    if (p.tags.includes(newTag)) {
      skipped++;
      continue;
    }

    // Existing tags + new tag merge
    const mergedTags = [...p.tags, newTag];

    const res = await fetch(SHOPIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_TOKEN,
      },
      body: JSON.stringify({
        query: UPDATE_TAGS,
        variables: {
          input: {
            id: p.productId,
            tags: mergedTags,
          },
        },
      }),
    });

    const json: any = await res.json();
    const errs = json.data?.productUpdate?.userErrors;

    if (errs?.length > 0) {
      errors.push({ title: p.title, errors: errs });
    } else {
      updated++;
    }
  }

  return NextResponse.json({ updated, skipped, errors });
}