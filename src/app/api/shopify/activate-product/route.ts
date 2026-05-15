import { NextResponse } from "next/server";

const SHOPIFY_URL = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/graphql.json`;

const SHOPIFY_TOKEN =
  process.env.SHOPIFY_ADMIN_TOKEN!;

const MUTATION = `
mutation productUpdate($input: ProductInput!) {
  productUpdate(input: $input) {
    product {
      id
      status
    }

    userErrors {
      field
      message
    }
  }
}
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        {
          error: "productId required",
        },
        {
          status: 400,
        }
      );
    }

    const response = await fetch(
      SHOPIFY_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "X-Shopify-Access-Token":
            SHOPIFY_TOKEN,
        },

        body: JSON.stringify({
          query: MUTATION,

          variables: {
            input: {
              id: productId,

              status: "ACTIVE",
            },
          },
        }),
      }
    );

    const json = await response.json();

    console.log(
      "Activate response:",
      json
    );

    return NextResponse.json(json);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Failed to activate product",
      },
      {
        status: 500,
      }
    );
  }
}