import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_API_VERSION = "2024-07";

async function getAllProducts(shop: string, token: string) {
  const allProducts: any[] = [];
  let url: string | null =
    `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=250&fields=id,title,tags`;

  while (url) {
    const res = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.errors || "Failed to fetch products");
    }

    const data = await res.json();
    allProducts.push(...data.products);

    // Handle pagination via Link header
    const linkHeader = res.headers.get("Link");
    url = null;
    if (linkHeader) {
      const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      if (match) url = match[1];
    }
  }

  return allProducts;
}

async function addTagToProduct(
  shop: string,
  token: string,
  productId: number,
  currentTags: string[]
) {
  const newTags = [...currentTags, "Other"].join(", ");

  const res = await fetch(
    `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/products/${productId}.json`,
    {
      method: "PUT",
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product: { id: productId, tags: newTags },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.errors || `Failed to update product ${productId}`);
  }

  return await res.json();
}

export async function GET(req: NextRequest) {
  // Preview mode — just return which products WOULD be updated, no changes made
  try {
    const SHOP = process.env.SHOPIFY_STORE_DOMAIN;
    const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

    if (!SHOP || !TOKEN) {
      return NextResponse.json({ error: "Shopify credentials missing" }, { status: 500 });
    }

    const products = await getAllProducts(SHOP, TOKEN);

    const toFix = products.filter((p) => {
      const tags = (p.tags as string)
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean);
      return tags.length === 1 && tags[0] === "Gemstones";
    });

    return NextResponse.json({
      total_products: products.length,
      products_to_fix: toFix.length,
      preview: toFix.map((p) => ({
        id: p.id,
        title: p.title,
        current_tags: p.tags,
      })),
    });
  } catch (error: any) {
    console.error("❌ Preview error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Fix mode — actually add "Other" tag to qualifying products
  try {
    const SHOP = process.env.SHOPIFY_STORE_DOMAIN;
    const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

    if (!SHOP || !TOKEN) {
      return NextResponse.json({ error: "Shopify credentials missing" }, { status: 500 });
    }

    const products = await getAllProducts(SHOP, TOKEN);

    const toFix = products.filter((p) => {
      const tags = (p.tags as string)
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean);
      return tags.length === 1 && tags[0] === "Gemstones";
    });

    if (toFix.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No products needed fixing",
        updated: 0,
        results: [],
      });
    }

    const results: { id: number; title: string; status: "updated" | "error"; error?: string }[] = [];

    // Process in small batches to avoid rate limits
    const BATCH_SIZE = 5;
    for (let i = 0; i < toFix.length; i += BATCH_SIZE) {
      const batch = toFix.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (p) => {
          try {
            const currentTags = (p.tags as string)
              .split(",")
              .map((t: string) => t.trim())
              .filter(Boolean);

            await addTagToProduct(SHOP, TOKEN, p.id, currentTags);
            results.push({ id: p.id, title: p.title, status: "updated" });
          } catch (err: any) {
            results.push({ id: p.id, title: p.title, status: "error", error: err.message });
          }
        })
      );

      // Small delay between batches to respect rate limits
      if (i + BATCH_SIZE < toFix.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    const successCount = results.filter((r) => r.status === "updated").length;
    const errorCount = results.filter((r) => r.status === "error").length;

    return NextResponse.json({
      success: true,
      total_scanned: products.length,
      updated: successCount,
      errors: errorCount,
      results,
    });
  } catch (error: any) {
    console.error("❌ Fix tags error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}