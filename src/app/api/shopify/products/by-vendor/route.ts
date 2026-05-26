import { NextResponse } from "next/server";

const SHOPIFY_URL = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/graphql.json`;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;
console.log("DOMAIN:", process.env.SHOPIFY_STORE_DOMAIN);
console.log("URL:", SHOPIFY_URL);
const QUERY = `
  query getProductsByVendor($vendor: String!, $cursor: String) {
    products(first: 250, after: $cursor, query: $vendor) {
      edges {
        node {
          id
          title
          vendor
          status
                    tags         

          variants(first: 1) {
            edges {
              node {
                id
                price
                sku
                                inventoryQuantity

              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vendorName = searchParams.get("vendor");

  if (!vendorName) {
    return NextResponse.json(
      { error: "vendor query param is required" },
      { status: 400 }
    );
  }

  let hasNextPage = true;
  let cursor: string | null = null;

  const products: any[] = [];

  while (hasNextPage) {
    const res = await fetch(SHOPIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_TOKEN,
      },
      body: JSON.stringify({
        query: QUERY,
        variables: {
          vendor: `vendor:${vendorName}`,
          cursor,
        },
      }),
    });

    const json : any= await res.json();
console.log("Shopify response:", JSON.stringify(json).slice(0, 500));
    const data = json.data.products;

    data.edges.forEach((edge: any) => {
      const product = edge.node;
      const variant = product.variants.edges[0]?.node;

      products.push({
        productId: product.id,
        variantId: variant?.id || null,
        sku: variant?.sku || null,
          stock: variant?.inventoryQuantity || 0,

        shopifyStatus: product.status,
        title: product.title,
        vendor: product.vendor,
        price: variant ? Number(variant.price) : null,
          tags: product.tags ?? [],  // ← YEH ADD KARO

      });
    });

    hasNextPage = data.pageInfo.hasNextPage;
    cursor = data.pageInfo.endCursor;
  }

  return NextResponse.json({
    count: products.length,
    products,
  });
}
