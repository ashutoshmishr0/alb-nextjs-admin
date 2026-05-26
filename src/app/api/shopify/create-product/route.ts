

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const {
      product_name,
      mrp,
      price,
        sku,          // ← add this

      images = [],
      image_url,
      video_url,
      certificate_url,
      category_name,
      color,
      origin,
      shape,
      transparency,
      treatment,
      weight_in_carat,
      dimension,
      certifications_name,
      certifications_number,
    } = await req.json();

    // console.log("📦 Received:", {
    //   product_name, price, mrp,
    //   image_url, images, video_url, certificate_url,
    // });

    if (!product_name || !price) {
      return NextResponse.json(
        { error: "product_name and price are required" },
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

    const parsePrice = (val: string | number | null | undefined): string | null => {
      if (val === null || val === undefined || val === "") return null;
      if (typeof val === "number") return String(val);
      const cleaned = String(val).replace(/[^\d.]/g, "");
      return cleaned || null;
    };

    const parsedPrice = parsePrice(price);
    const parsedMrp = parsePrice(mrp);

    if (!parsedPrice) {
      return NextResponse.json(
        { error: "Could not parse price value" },
        { status: 400 }
      );
    }

    /* ---------- BUILD DESCRIPTION ---------- */
    let bodyHtml = `<p><strong>${product_name}</strong></p>`;

    const details: [string, string | null | undefined][] = [
      ["Category", category_name || null],
      ["Weight", weight_in_carat ? `${weight_in_carat} Carats` : null],
      ["Color", color || null],
      ["Origin", origin || null],
      ["Shape", shape || null],
      ["Transparency", transparency || null],
      ["Treatment", treatment || null],
      ["Dimension", dimension || null],
      ["Certification", certifications_name || null],
      ["Cert. Number", certifications_number || null],
    ];

    const rows = details
      .filter(([, v]) => v)
      .map(
        ([k, v]) =>
          `<tr>
            <td style="padding:8px;border:1px solid #ddd;font-weight:bold;background:#f9f9f9;width:140px;">${k}</td>
            <td style="padding:8px;border:1px solid #ddd;">${v}</td>
          </tr>`
      )
      .join("");

    if (rows) {
      bodyHtml += `
        <table style="border-collapse:collapse;width:100%;max-width:520px;margin:12px 0;font-size:14px;">
          ${rows}
        </table>
      `;
    }

    if (certificate_url) {
      bodyHtml += `<p><strong>Certificate:</strong> <a href="${certificate_url}" target="_blank" rel="noopener noreferrer">View Certificate</a></p>`;
    }

    if (video_url) {
      bodyHtml += `<p><strong>Video:</strong> <a href="${video_url}" target="_blank" rel="noopener noreferrer">Watch Video</a></p>`;
    }

    /* ---------- IMAGES + CERTIFICATE ONLY (REST — no video) ---------- */
    const allImages = [
      ...(image_url ? [image_url] : []),
      ...(Array.isArray(images) ? images : []),
      ...(certificate_url ? [certificate_url] : []),
    ].filter(
      (src, i, arr) =>
        src && typeof src === "string" && src.trim() !== "" && arr.indexOf(src) === i
    );

    // console.log("🖼️ Images + Certificate via REST:", allImages);
    // console.log("🎥 Video via GraphQL:", video_url ?? "none");

    /* ---------- CREATE PRODUCT (REST) ---------- */
    const shopifyBody = {
      product: {
        title: product_name,
        vendor: "BrahmaGems",
        product_type: category_name || "Gemstones",
        body_html: bodyHtml,
        status: "active",
        variants: [
          {
                sku: sku || null,          // ← add this

            price: parsedPrice,
            compare_at_price: parsedMrp ?? null,
            inventory_management: "shopify",
            inventory_quantity: 1,
            inventory_policy: "deny",
          },
        ],
        images: allImages.map((src: string) => ({
          src,
          alt: product_name,
        })),
      },
    };

    const createRes = await fetch(
      `https://${SHOP}/admin/api/2024-07/products.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": TOKEN,
        },
        body: JSON.stringify(shopifyBody),
      }
    );

    const createData = await createRes.json();

    if (!createRes.ok) {
      console.error("❌ Shopify create error:", JSON.stringify(createData, null, 2));
      return NextResponse.json(
        { error: createData.errors || "Product creation failed" },
        { status: 500 }
      );
    }

    const productId = createData.product.id;
   


    /* ---------- ATTACH VIDEO (GRAPHQL) ---------- */
    // let videoAttached = false;
    // let videoErrors: any[] = [];

    // if (video_url) {
    //   const gqlRes = await fetch(`https://${SHOP}/admin/api/2024-07/graphql.json`, {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //       "X-Shopify-Access-Token": TOKEN,
    //     },
    //     body: JSON.stringify({
    //       query: `
    //         mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
    //           productCreateMedia(productId: $productId, media: $media) {
    //             media {
    //               ... on Video {
    //                 id
    //                 status
    //               }
    //             }
    //             mediaUserErrors {
    //               field
    //               message
    //             }
    //           }
    //         }
    //       `,
    //       variables: {
    //         productId: `gid://shopify/Product/${productId}`,
    //         media: [
    //           {
    //             originalSource: video_url,
    //             mediaContentType: "VIDEO",
    //           },
    //         ],
    //       },
    //     }),
    //   });

    //   const gqlData = await gqlRes.json();
    //   videoErrors = gqlData?.data?.productCreateMedia?.mediaUserErrors ?? [];

    //   if (videoErrors.length > 0) {
    //     console.error("❌ Video errors:", JSON.stringify(videoErrors, null, 2));
    //   } else {
    //     videoAttached = true;
    //     console.log("✅ Video queued successfully");
    //   }
    // }

    return NextResponse.json({
      success: true,
      productId,
      product: createData.product,
      imagesUploaded: createData.product.images?.length ?? 0,
      
    });

  } catch (error) {
    console.error("❌ Create product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}