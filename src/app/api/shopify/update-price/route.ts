// import { NextRequest, NextResponse } from "next/server";

// export async function POST(req: NextRequest) {
//   try {
//     const { productId, price } = await req.json();

//     const body = {
//       product: {
//         id: productId,
//         variants: [
//           {
//             price: String(price),
//           },
//         ],
//       },
//     };

//     const res = await fetch(
//       `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-07/products/${productId}.json`,
//       {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN!,
//         },
//         body: JSON.stringify(body),
//       }
//     );

//     const data = await res.json();

//     if (!res.ok) {
//       return NextResponse.json(data, { status: 500 });
//     }

//     return NextResponse.json({ success: true });
//   } catch {
//     return NextResponse.json(
//       { error: "Update failed" },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";



export async function POST(req: NextRequest) {
  try {
    const { productId, price } = await req.json(); // price already in INR

    // Validation
    if (!productId || !price) {
      return NextResponse.json(
        { error: "productId and price are required" },
        { status: 400 }
      );
    }

    const SHOP = process.env.SHOPIFY_STORE_DOMAIN;
    const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

    if (!SHOP || !TOKEN) {
      return NextResponse.json(
        { error: "Shopify credentials missing" },
        { status: 500 }
      );
    }

    console.log(`💰 Updating price to: ₹${price}`);
    
    // Extract numeric ID from GraphQL ID if needed
    // "gid://shopify/Product/9460392001777" → "9460392001777"
    const numericId = productId.includes('/')
      ? productId.split('/').pop()
      : productId;

    // First, get current product to preserve variant IDs
    const getRes = await fetch(
      `https://${SHOP}/admin/api/2024-07/products/${numericId}.json`,
      {
        headers: {
          "X-Shopify-Access-Token": TOKEN,
        },
      }
    );

    if (!getRes.ok) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const currentProduct = await getRes.json();
    const variantId = currentProduct.product?.variants?.[0]?.id;

    if (!variantId) {
      return NextResponse.json(
        { error: "No variant found" },
        { status: 404 }
      );
    }

    // Update variant price
    const updateRes = await fetch(
      `https://${SHOP}/admin/api/2024-07/variants/${variantId}.json`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": TOKEN,
        },
        body: JSON.stringify({
          variant: {
            id: variantId,
            price: String(price), // ✅ Direct INR price
          },
        }),
      }
    );

    const data = await updateRes.json();

    if (!updateRes.ok) {
      console.error("Shopify update error:", data);
      return NextResponse.json(
        { error: data.errors || "Update failed" },
        { status: 500 }
      );
    }

    console.log(`✅ Price updated for product ${numericId}: ₹${price}`);

    return NextResponse.json({
      success: true,
      variant: data.variant,
      priceINR: price,
    });
  } catch (error) {
    console.error("Update price error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}