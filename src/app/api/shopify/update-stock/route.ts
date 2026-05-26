// import { NextResponse } from "next/server";

// const SHOPIFY_URL = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/graphql.json`;
// const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;

// const GET_LOCATION = `
//   query {
//     locations(first: 1) {
//       edges { node { id } }
//     }
//   }
// `;

// const UPDATE_INVENTORY = `
//   mutation inventorySetQuantities($input: InventorySetQuantitiesInput!) {
//     inventorySetQuantities(input: $input) {
//       userErrors { field message }
//     }
//   }
// `;

// export async function POST(req: Request) {
//   const { variantIds } = await req.json();

//   // Location ek baar fetch
//   const locRes = await fetch(SHOPIFY_URL, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "X-Shopify-Access-Token": SHOPIFY_TOKEN,
//     },
//     body: JSON.stringify({ query: GET_LOCATION }),
//   });
//   const locJson: any = await locRes.json();
//   const locationId = locJson.data.locations.edges[0].node.id;

//   // inventoryItemIds — chunks of 50
//   const CHUNK = 50;
//   const inventoryItemIds: string[] = [];

//   for (let i = 0; i < variantIds.length; i += CHUNK) {
//     const chunk = variantIds.slice(i, i + CHUNK);

//     const results = await Promise.all(
//       chunk.map(async (variantId: string) => {
//         const res = await fetch(SHOPIFY_URL, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             "X-Shopify-Access-Token": SHOPIFY_TOKEN,
//           },
//           body: JSON.stringify({
//             query: `query {
//               productVariant(id: "${variantId}") {
//                 inventoryItem { id }
//               }
//             }`,
//           }),
//         });
//         const json: any = await res.json();
//         return json.data.productVariant.inventoryItem.id;
//       })
//     );

//     inventoryItemIds.push(...results);
//   }

//   // Ek mutation mein sab update
//   const updateRes = await fetch(SHOPIFY_URL, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "X-Shopify-Access-Token": SHOPIFY_TOKEN,
//     },
//     body: JSON.stringify({
//       query: UPDATE_INVENTORY,
//       variables: {
//         input: {
//           name: "available",
//           reason: "correction",
//           quantities: inventoryItemIds.map((inventoryItemId) => ({
//             inventoryItemId,
//             locationId,
//             quantity: 1,
//           })),
//         },
//       },
//     }),
//   });

//   const updateJson: any = await updateRes.json();
//   const errors = updateJson.data?.inventorySetQuantities?.userErrors;

//   if (errors?.length > 0) {
//     return NextResponse.json({ error: errors }, { status: 400 });
//   }

//   return NextResponse.json({ success: true, updated: inventoryItemIds.length });
// }



import { NextResponse } from "next/server";

const SHOPIFY_URL = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/graphql.json`;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;

const GET_LOCATION = `
  query {
    locations(first: 1) {
      edges { node { id } }
    }
  }
`;

const UPDATE_INVENTORY = `
  mutation inventorySetQuantities($input: InventorySetQuantitiesInput!) {
    inventorySetQuantities(input: $input) {
      userErrors { field message }
    }
  }
`;

export async function POST(req: Request) {
  const { variantIds } = await req.json();

  // Location ek baar
  const locRes = await fetch(SHOPIFY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_TOKEN,
    },
    body: JSON.stringify({ query: GET_LOCATION }),
  });
  const locJson: any = await locRes.json();
  const locationId = locJson.data.locations.edges[0].node.id;

  // inventoryItemIds — chunks of 20
  const CHUNK = 20;
  const inventoryItemIds: string[] = [];

  for (let i = 0; i < variantIds.length; i += CHUNK) {
    const chunk = variantIds.slice(i, i + CHUNK);

    const results = await Promise.all(
      chunk.map(async (variantId: string) => {
        const res = await fetch(SHOPIFY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": SHOPIFY_TOKEN,
          },
          body: JSON.stringify({
            query: `query {
              productVariant(id: "${variantId}") {
                inventoryItem { id }
              }
            }`,
          }),
        });
        const json: any = await res.json();
        return json.data.productVariant.inventoryItem.id;
      })
    );

    inventoryItemIds.push(...results);
  }

  // 20-20 ke batches mein update
  let totalUpdated = 0;

  for (let i = 0; i < inventoryItemIds.length; i += CHUNK) {
    const batch = inventoryItemIds.slice(i, i + CHUNK);

    const updateRes = await fetch(SHOPIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_TOKEN,
      },
      body: JSON.stringify({
        query: UPDATE_INVENTORY,
        variables: {
          input: {
            name: "available",
            reason: "correction",
                ignoreCompareQuantity: true,  // ← YEH ADD KARO

            quantities: batch.map((inventoryItemId) => ({
              inventoryItemId,
              locationId,
              quantity: 1,
            })),
          },
        },
      }),
    });

    const updateJson: any = await updateRes.json();
    const errors = updateJson.data?.inventorySetQuantities?.userErrors;

    if (errors?.length > 0) {
      console.error(`❌ Batch ${i}-${i + CHUNK} errors:`, errors);
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    totalUpdated += batch.length;
    console.log(`✅ Updated ${totalUpdated}/${inventoryItemIds.length}`);
  }

  return NextResponse.json({ success: true, updated: totalUpdated });
}