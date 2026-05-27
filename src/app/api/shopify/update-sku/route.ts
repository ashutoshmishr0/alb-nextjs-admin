import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest
) {
  try {
    const {
      variantId,
      sku,
    } = await req.json();

    // ---------------------------------------------
    // VALIDATION
    // ---------------------------------------------

    if (!variantId || !sku) {
      return NextResponse.json(
        {
          error:
            "variantId and sku are required",
        },
        {
          status: 400,
        }
      );
    }

    const SHOP =
      process.env
        .SHOPIFY_STORE_DOMAIN;

    const TOKEN =
      process.env
        .SHOPIFY_ADMIN_TOKEN;

    if (!SHOP || !TOKEN) {
      return NextResponse.json(
        {
          error:
            "Shopify credentials missing",
        },
        {
          status: 500,
        }
      );
    }

    // ---------------------------------------------
    // NORMALIZE SKU
    // ---------------------------------------------

    const normalizedSku =
      String(sku)
        .trim()
        .toUpperCase();

    console.log(
      `🏷️ Updating SKU → ${normalizedSku}`
    );

    // ---------------------------------------------
    // EXTRACT VARIANT ID
    // ---------------------------------------------

    const numericVariantId =
      String(variantId).includes("/")
        ? String(variantId)
            .split("/")
            .pop()
        : variantId;

    // ---------------------------------------------
    // CHECK DUPLICATE SKU
    // ---------------------------------------------

    const searchRes =
      await fetch(
        `https://${SHOP}/admin/api/2024-07/variants.json?sku=${normalizedSku}`,
        {
          headers: {
            "X-Shopify-Access-Token":
              TOKEN,
          },
        }
      );

    const existingVariant =
      await searchRes.json();

    const existingVariants =
      existingVariant?.variants ||
      [];

    // Ignore current variant
    const duplicateVariant =
      existingVariants.find(
        (variant: any) =>
          String(variant.id) !==
          String(
            numericVariantId
          )
      );

    if (duplicateVariant) {
      return NextResponse.json({
  success: false,

  skipped: true,

  reason:
    "SKU already exists",

  existing_variant:
    duplicateVariant,
});
    }

    // ---------------------------------------------
    // UPDATE SKU
    // ---------------------------------------------

    const updateRes =
      await fetch(
        `https://${SHOP}/admin/api/2024-07/variants/${numericVariantId}.json`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            "X-Shopify-Access-Token":
              TOKEN,
          },

          body: JSON.stringify({
            variant: {
              id: Number(
                numericVariantId
              ),

              sku: normalizedSku,
            },
          }),
        }
      );

    const data =
      await updateRes.json();

    // ---------------------------------------------
    // ERROR
    // ---------------------------------------------

    if (!updateRes.ok) {
      console.error(
        "Shopify SKU update error:",
        data
      );

      return NextResponse.json(
        {
          error:
            data.errors ||
            "Update failed",
        },
        {
          status: 500,
        }
      );
    }

    // ---------------------------------------------
    // SUCCESS
    // ---------------------------------------------

    console.log(
      `✅ SKU updated for variant ${numericVariantId}: ${normalizedSku}`
    );

    return NextResponse.json({
      success: true,

      variant: data.variant,

      updated_sku:
        normalizedSku,
    });
  } catch (error) {
    console.error(
      "Update SKU error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}