
import { NextResponse } from "next/server";


/* ======================
   UTILITIES
====================== */
function normalizeTitle(title: any): string {
  if (!title || typeof title !== "string") return "";

  return title
    .toLowerCase()
    .replace(/\s+/g, " ")        // multiple spaces → single
    .replace(/[()]/g, "")       // remove brackets
    .replace(/carats?/g, "ct")  // normalize units
    .replace(/[^a-z0-9 ]/g, "") // remove special chars
    .trim();
}

function parsePrice(price: string | number | null | undefined): number {
  if (!price) return 0;
  if (typeof price === "number") return price;
  
  // Handle "Rs. 238240" format from Brahma Gems
  const cleaned = String(price)
    .replace(/Rs\.?/gi, "")
    .replace(/₹/g, "")
    .replace(/,/g, "")
    .replace(/\s/g, "")
    .trim();
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/* ======================
   MAIN HANDLER
====================== */
export async function GET() {
  try {
    console.log("🔍 Starting compare-data fetch...");
    
    // Fetch both APIs in parallel
    const [shopifyRes, brahmaRes] = await Promise.all([
      fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/shopify/products/by-vendor?vendor=Brahmagems`,
        { cache: "no-store" }
      ),
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/brahmagems`, {
        cache: "no-store",
      }),
    ]);

    if (!shopifyRes.ok || !brahmaRes.ok) {
      console.error("❌ API fetch failed:", {
        shopify: shopifyRes.status,
        brahma: brahmaRes.status,
      });
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: 500 }
      );
    }

    const shopifyData = await shopifyRes.json();
    const brahmaData = await brahmaRes.json();

    console.log("📦 Shopify products:", shopifyData.products?.length ?? 0);
    console.log("📦 Brahma products:", brahmaData.products?.length ?? 0);

    // Build Shopify lookup map
    // Your API returns: { title, price, productId, variantId }
    const shopifyMap = new Map<string, any>();
    (shopifyData.products ?? []).forEach((product: any) => {
      const key = normalizeTitle(product.title);
      if (key) {
        shopifyMap.set(key, product);
        console.log(`📝 Shopify: "${product.title}" → ₹${product.price}`);
      }
    });

    console.log(`✅ Shopify map size: ${shopifyMap.size}`);
const brahmaKeys = new Set(
  (brahmaData.products ?? []).map((p: any) =>
    normalizeTitle(p.product_name)
  )
);
    // Map and compare products
    const products = (brahmaData.products ?? []).map((brahmaProduct: any) => {
      const title = brahmaProduct.product_name;
      const key = normalizeTitle(title);
      const shopifyMatch = shopifyMap.get(key);

      // 🔥 FIX: Your Shopify API returns price directly, not in variants!
      let shopifyPrice: number | null = null;
      if (shopifyMatch && shopifyMatch.price !== undefined) {
        shopifyPrice = typeof shopifyMatch.price === 'number' 
          ? shopifyMatch.price 
          : parseFloat(String(shopifyMatch.price));
        
        // Validate
     if (
  shopifyPrice === null ||
  isNaN(Number(shopifyPrice)) ||
  Number(shopifyPrice) <= 0
) {
  shopifyPrice = null;
}
        
        console.log(`💰 ${title}: Shopify price = ₹${shopifyPrice}`);
      }

      // Parse prices from Brahma Gems
      const basePrice = parsePrice(brahmaProduct.price);

     return {
  id: String(brahmaProduct.product_id),
  title,
  basePrice,
  shopifyPrice,
  shopifyStatus:
  shopifyMatch?.shopifyStatus ?? null,
  images: [
    ...(brahmaProduct.image_url ? [brahmaProduct.image_url] : []),
    ...(Array.isArray(brahmaProduct.images) ? brahmaProduct.images : []),
  ].filter((src, i, arr) => src && arr.indexOf(src) === i),
  videos: brahmaProduct.video_url ? [brahmaProduct.video_url] : [],
  certificateUrl: brahmaProduct.certificate_url || null,

  // ✅ Ye naye fields add kar
  category_name: brahmaProduct.category_name || null,
  color: brahmaProduct.color || null,
  origin: brahmaProduct.origin || null,
  shape: brahmaProduct.shape || null,
  transparency: brahmaProduct.transparency || null,
  treatment: brahmaProduct.treatment || null,
  weight_in_carat: brahmaProduct.weight_in_carat || null,
  dimension: brahmaProduct.dimension || null,
  certifications_name: brahmaProduct.certifications_name || null,
  certifications_number: brahmaProduct.certifications_number || null,

  status: shopifyMatch ? ("EXISTS" as const) : ("NEW" as const),
  shopifyProductId: shopifyMatch?.productId ?? null,
};
    });
const missingProducts = (shopifyData.products ?? [])
  .filter((shopifyProduct: any) => {
    const key = normalizeTitle(shopifyProduct.title);

    return !brahmaKeys.has(key);
  })
  .map((shopifyProduct: any) => ({
    id: shopifyProduct.productId,
    title: shopifyProduct.title,

    basePrice: 0,

    shopifyPrice:
      typeof shopifyProduct.price === "number"
        ? shopifyProduct.price
        : parseFloat(shopifyProduct.price),

    images: [],
    videos: [],
    certificateUrl: null,

    status: "MISSING_FROM_API" as const,
shopifyStatus:
  shopifyProduct.shopifyStatus ?? null,
    shopifyProductId: shopifyProduct.productId,
  }));  
   

  
const finalProducts = [
  ...products,
  ...missingProducts,
];
finalProducts.sort((a: any, b: any) => {
  function getPriority(p: any) {
    // NEW
    if (p.status === "NEW") {
      return 0;
    }

    // EXISTS + DRAFT
    if (
      p.status === "EXISTS" &&
      p.shopifyStatus === "DRAFT"
    ) {
      return 1;
    }

    // EXISTS + ACTIVE
    if (
      p.status === "EXISTS" &&
      p.shopifyStatus === "ACTIVE"
    ) {
      return 2;
    }

    // MISSING
    if (
      p.status ===
      "MISSING_FROM_API"
    ) {
      return 3;
    }

    return 999;
  }

  return (
    getPriority(a) -
    getPriority(b)
  );
});
 const stats = {
total: finalProducts.length,
      new: products.filter((p:any) => p.status === "NEW").length,
      missing: missingProducts.length,
      existing: products.filter((p:any) => p.status === "EXISTS").length,
      draft: finalProducts.filter(
  (p: any) =>
    p.shopifyStatus === "DRAFT"
).length,
      withShopifyPrice: products.filter((p:any) => p.shopifyPrice !== null && p.shopifyPrice > 0).length,
    };
  console.log("\n✅ Products mapped:", stats.total);
    console.log("🆕 New:", stats.new);
    console.log("♻️ Existing:", stats.existing);
    console.log("💰 With Shopify prices:", stats.withShopifyPrice);
return NextResponse.json({
  products: finalProducts,
});  } catch (error) {
    console.error("❌ Compare data error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}