import { NextResponse } from "next/server";

function normalizeSku(sku: any): string {
  if (!sku || typeof sku !== "string") return "";
  return sku.toUpperCase().replace(/\s/g, "").trim();
}

export async function GET() {
  const base = process.env.NEXT_PUBLIC_BASE_URL;

  const [shopifyRes, brahmaRes] = await Promise.all([
    fetch(`${base}/api/shopify/products/by-vendor?vendor=Brahmagems`, { cache: "no-store" }),
    fetch(`${base}/api/brahmagems`, { cache: "no-store" }),
  ]);

  const shopifyData = await shopifyRes.json();
  const brahmaData = await brahmaRes.json();

  // Build maps
  const shopifyMap = new Map<string, any>();
  shopifyData.products.forEach((p: any) => {
    const key = normalizeSku(p.sku);
    if (key) shopifyMap.set(key, p);
  });

  const brahmaMap = new Map<string, any>();
  brahmaData.products.forEach((p: any) => {
    const key = normalizeSku(p.product_sku);
    if (key) brahmaMap.set(key, p);
  });

  const rows: string[] = [
    // CSV header
    "Type,Brahma SKU,Brahma Title,Brahma Price,Shopify SKU,Shopify Title,Shopify Price"
  ];

  // Brahma products missing from Shopify
  brahmaData.products.forEach((p: any) => {
    const key = normalizeSku(p.product_sku);
    if (!shopifyMap.has(key)) {
      rows.push(`NOT_IN_SHOPIFY,${p.product_sku},"${p.product_name}",${p.price},,, `);
    }
  });

  // Shopify products missing from Brahma
  shopifyData.products.forEach((p: any) => {
    const key = normalizeSku(p.sku);
    if (!brahmaMap.has(key)) {
      rows.push(`NOT_IN_BRAHMA,,,,"${p.sku}","${p.title}",${p.price}`);
    }
  });

  const csv = rows.join("\n");

  // Return as downloadable CSV file
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=sku-mismatches.csv",
    },
  });
}