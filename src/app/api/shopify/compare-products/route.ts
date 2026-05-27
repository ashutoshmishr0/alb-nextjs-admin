// // src/app/api/compare-products/route.ts

// import { NextResponse } from "next/server";

// const SHOPIFY_STORE_DOMAIN =
//   process.env.SHOPIFY_STORE_DOMAIN!;

// const SHOPIFY_ADMIN_TOKEN =
//   process.env.SHOPIFY_ADMIN_TOKEN!;

// // ---------------------------------------------
// // FETCH SHOPIFY PRODUCTS
// // ---------------------------------------------

// async function fetchShopifyProducts() {
//   let hasNextPage = true;
//   let cursor: string | null = null;

//   const allProducts: any[] = [];

//   while (hasNextPage) {
// const response: Response = await fetch(
//           `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2025-01/graphql.json`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "X-Shopify-Access-Token":
//             SHOPIFY_ADMIN_TOKEN,
//         },
//         body: JSON.stringify({
//           query: `
//             query ($cursor: String) {
//               products(
//                 first: 250,
//                 after: $cursor,
//                 query: "vendor:Brahmagems"
//               ) {
//                 edges {
//                   cursor

//                   node {
//                     title
//                     vendor
//                     status

//                     variants(first: 50) {
//                       edges {
//                         node {
//                           sku
//                           price
//                         }
//                       }
//                     }
//                   }
//                 }

//                 pageInfo {
//                   hasNextPage
//                 }
//               }
//             }
//           `,
//           variables: {
//             cursor,
//           },
//         }),
//       }
//     );

// const data: any = await response.json();
//     const products: any[] =
//   data?.data?.products?.edges || [];

//     for (const productEdge of products) {
//       const product = productEdge.node;

//       for (const variantEdge of product.variants
//         .edges) {
//         allProducts.push({
//           product_name: product.title,
//           sku: variantEdge.node.sku,
//           price: variantEdge.node.price,
//           status: product.status,
//           vendor: product.vendor,
//         });
//       }
//     }

//     hasNextPage =
//       data?.data?.products?.pageInfo
//         ?.hasNextPage || false;

//     cursor =
//       products.length > 0
//         ? products[products.length - 1].cursor
//         : null;
//   }

//   return allProducts;
// }

// // ---------------------------------------------
// // FETCH BRAHMAGEMS API PRODUCTS
// // ---------------------------------------------

// async function fetchBrahmaGemsProducts() {
//   const TOTAL_PAGES = 132;
//   const BATCH_SIZE = 15;

//   const allProducts: any[] = [];

//   for (
//     let startPage = 1;
//     startPage <= TOTAL_PAGES;
//     startPage += BATCH_SIZE
//   ) {
//     const endPage = Math.min(
//       startPage + BATCH_SIZE - 1,
//       TOTAL_PAGES
//     );

//     const requests = [];

//     for (
//       let page = startPage;
//       page <= endPage;
//       page++
//     ) {
//       requests.push(
//         fetch(
//           `https://api.brahmagems.com/gemstones/products?page=${page}`,
//           {
//             cache: "no-store",
//           }
//         ).then((res) => res.json())
//       );
//     }

//     const responses = await Promise.all(
//       requests
//     );

//     for (const response of responses) {
//       const products =
//         response?.data?.products || [];

//       allProducts.push(...products);
//     }
//   }

//   return allProducts;
// }

// // ---------------------------------------------
// // NORMALIZE PRICE
// // ---------------------------------------------

// function normalizePrice(price: string) {
//   return Number(
//     price
//       ?.replace("Rs.", "")
//       ?.replace(/,/g, "")
//       ?.trim()
//   );
// }

// // ---------------------------------------------
// // API
// // ---------------------------------------------

// export async function GET() {
//   try {
//     console.log(
//       "Fetching Shopify Products..."
//     );

//     console.log(
//       "Fetching BrahmaGems Products..."
//     );

//     const [
//       shopifyProducts,
//       brahmaProducts,
//     ] = await Promise.all([
//       fetchShopifyProducts(),
//       fetchBrahmaGemsProducts(),
//     ]);

//     // ---------------------------------------------
//     // CREATE MAPS
//     // ---------------------------------------------

//     const shopifyMap = new Map();
//     const brahmaMap = new Map();

//     for (const product of shopifyProducts) {
//       if (!product.sku) continue;

//       shopifyMap.set(
//         product.sku.trim().toLowerCase(),
//         product
//       );
//     }

//     for (const product of brahmaProducts) {
//       if (!product.product_sku) continue;

//       brahmaMap.set(
//         product.product_sku
//           .trim()
//           .toLowerCase(),
//         product
//       );
//     }

//     // ---------------------------------------------
//     // COMPARE
//     // ---------------------------------------------

//     const missingInShopify: any[] = [];

//     const missingInBrahmaAPI: any[] = [];

//     const matchedProducts: any[] = [];

//     const priceMismatches: any[] = [];

//     // BRAHMA API -> SHOPIFY
//     for (const [
//       sku,
//       brahmaProduct,
//     ] of brahmaMap) {
//       const shopifyProduct =
//         shopifyMap.get(sku);

//       if (!shopifyProduct) {
//         missingInShopify.push(
//           brahmaProduct
//         );

//         continue;
//       }

//       matchedProducts.push({
//         sku,
//         brahma_product_name:
//           brahmaProduct.product_name,
//         shopify_product_name:
//           shopifyProduct.product_name,
//       });

//       // PRICE CHECK
//       const brahmaPrice = normalizePrice(
//         brahmaProduct.price
//       );

//       const shopifyPrice = Number(
//         shopifyProduct.price
//       );

//       if (brahmaPrice !== shopifyPrice) {
//         priceMismatches.push({
//           sku,

//           brahma_price:
//             brahmaProduct.price,

//           shopify_price:
//             shopifyProduct.price,

//           brahma_product_name:
//             brahmaProduct.product_name,

//           shopify_product_name:
//             shopifyProduct.product_name,
//         });
//       }
//     }

//     // SHOPIFY -> BRAHMA API
//     for (const [
//       sku,
//       shopifyProduct,
//     ] of shopifyMap) {
//       const brahmaProduct =
//         brahmaMap.get(sku);

//       if (!brahmaProduct) {
//         missingInBrahmaAPI.push(
//           shopifyProduct
//         );
//       }
//     }

//     return NextResponse.json({
//       success: true,

//       stats: {
//         shopify_products:
//           shopifyProducts.length,

//         brahma_products:
//           brahmaProducts.length,

//         matched_products:
//           matchedProducts.length,

//         missing_in_shopify:
//           missingInShopify.length,

//         missing_in_brahma_api:
//           missingInBrahmaAPI.length,

//         price_mismatches:
//           priceMismatches.length,
//       },

//       missing_in_shopify:
//         missingInShopify,

//       missing_in_brahma_api:
//         missingInBrahmaAPI,

//       price_mismatches:
//         priceMismatches,

//       matched_products:
//         matchedProducts,
//     });
//   } catch (error) {
//     console.error(error);

//     return NextResponse.json(
//       {
//         success: false,
//         message:
//           "Failed to compare products",
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }

// src/app/api/shopify/compare-products/route.ts

import { NextResponse } from "next/server";

const SHOPIFY_STORE_DOMAIN =
  process.env.SHOPIFY_STORE_DOMAIN!;

const SHOPIFY_ADMIN_TOKEN =
  process.env.SHOPIFY_ADMIN_TOKEN!;

// ---------------------------------------------
// FETCH SHOPIFY PRODUCTS
// ---------------------------------------------
function normalizeTitle(
  title: string
) {
  return title
    ?.toLowerCase()
    ?.replace(/[^a-z0-9]/g, "")
    ?.trim();
}
async function fetchShopifyProducts() {
  let hasNextPage = true;
  let cursor: string | null = null;

  const allProducts: any[] = [];

  while (hasNextPage) {
    console.log(
      `Fetching Shopify Batch...`
    );

    const response: Response =
      await fetch(
        `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2025-01/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",

            "X-Shopify-Access-Token":
              SHOPIFY_ADMIN_TOKEN,
          },

          body: JSON.stringify({
            query: `
            query ($cursor: String) {
              products(
                first: 250,
                after: $cursor,
                query: "vendor:Brahmagems"
              ) {
                edges {
                  cursor

                  node {
                    title
                    vendor
                    status

                    variants(first: 50) {
                      edges {
                        node {
                              id

                          sku
                          price
                        }
                      }
                    }
                  }
                }

                pageInfo {
                  hasNextPage
                }
              }
            }
          `,
            variables: {
              cursor,
            },
          }),
        }
      );

    const data: any =
      await response.json();

    const products: any[] =
      data?.data?.products?.edges || [];

    for (const productEdge of products) {
      const product =
        productEdge.node;

      for (const variantEdge of product
        .variants.edges) {
        allProducts.push({
          product_name:
            product.title,

          sku: variantEdge.node.sku,
 variant_id:
    variantEdge.node.id,
          price:
            variantEdge.node.price,

          status: product.status,

          vendor: product.vendor,
        });
      }
    }

    hasNextPage =
      data?.data?.products?.pageInfo
        ?.hasNextPage || false;

    cursor =
      products.length > 0
        ? products[
            products.length - 1
          ].cursor
        : null;
  }

  console.log(
    `Total Shopify Products: ${allProducts.length}`
  );

  return allProducts;
}

// ---------------------------------------------
// FETCH BRAHMAGEMS PRODUCTS
// ---------------------------------------------

async function fetchBrahmaGemsProducts() {
  const TOTAL_PAGES = 132;

  const BATCH_SIZE = 15;

  const allProducts: any[] = [];

  for (
    let startPage = 1;
    startPage <= TOTAL_PAGES;
    startPage += BATCH_SIZE
  ) {
    const endPage = Math.min(
      startPage + BATCH_SIZE - 1,
      TOTAL_PAGES
    );

    console.log(
      `Fetching Brahma Batch ${startPage} → ${endPage}`
    );

    const requests = [];

    for (
      let page = startPage;
      page <= endPage;
      page++
    ) {
      requests.push(
        fetch(
          `https://api.brahmagems.com/gemstones/products?page=${page}`,
          {
            cache: "no-store",
          }
        ).then((res) => res.json())
      );
    }

    const responses =
      await Promise.all(requests);

    for (const response of responses as any[]) {
      const products =
        response?.data?.products || [];

      allProducts.push(...products);
    }

    console.log(
      `Fetched till now: ${allProducts.length}`
    );
  }

  console.log(
    `Total Brahma Products: ${allProducts.length}`
  );

  return allProducts;
}

// ---------------------------------------------
// NORMALIZE PRICE
// ---------------------------------------------

function normalizePrice(
  price: string
) {
  return Number(
    price
      ?.replace("Rs.", "")
      ?.replace(/,/g, "")
      ?.trim()
  );
}

// ---------------------------------------------
// API
// ---------------------------------------------

export async function GET() {
  try {
    console.time("COMPARE_PRODUCTS");

    console.log(
      "Fetching Shopify Products..."
    );

    console.log(
      "Fetching Brahma Products..."
    );

    const [
      shopifyProducts,
      brahmaProducts,
    ] = await Promise.all([
      fetchShopifyProducts(),
      fetchBrahmaGemsProducts(),
    ]);

    // ---------------------------------------------
    // CREATE MAPS
    // ---------------------------------------------

    const shopifyMap = new Map();

    const brahmaMap = new Map();

    for (const product of shopifyProducts) {
      if (!product.sku) continue;

      shopifyMap.set(
        product.sku
          .trim()
          .toLowerCase(),

        product
      );
    }

    for (const product of brahmaProducts) {
      if (!product.product_sku)
        continue;

      brahmaMap.set(
        product.product_sku
          .trim()
          .toLowerCase(),

        product
      );
    }

    // ---------------------------------------------
    // ARRAYS
    // ---------------------------------------------

    const missingInShopify: any[] =
      [];

    const missingInBrahmaAPI: any[] =
      [];

    const matchedProducts: any[] =
      [];

    const priceMismatches: any[] =
      [];

    const skuMatchedProducts: any[] =
      [];

    const skuNotMatchedProducts: any[] =
      [];
const probableSkuMatches: any[] = [];
    // ---------------------------------------------
    // BRAHMA -> SHOPIFY
    // ---------------------------------------------

    for (const [
      sku,
      brahmaProduct,
    ] of brahmaMap) {
      const shopifyProduct =
        shopifyMap.get(sku);

      // SKU NOT FOUND
      if (!shopifyProduct) {
        missingInShopify.push(
          brahmaProduct
        );

        skuNotMatchedProducts.push({
          sku,

          source: "BRAHMA_API",

          product_name:
            brahmaProduct.product_name,
        });

        continue;
      }

      // SKU MATCHED
      skuMatchedProducts.push({
        sku,

        brahma_product_name:
          brahmaProduct.product_name,

        shopify_product_name:
          shopifyProduct.product_name,
      });

      matchedProducts.push({
        sku,

        brahma_product_name:
          brahmaProduct.product_name,

        shopify_product_name:
          shopifyProduct.product_name,
      });

      // PRICE CHECK
      const brahmaPrice =
        normalizePrice(
          brahmaProduct.price
        );

      const shopifyPrice = Number(
        shopifyProduct.price
      );

      if (
        brahmaPrice !== shopifyPrice
      ) {
        priceMismatches.push({
          sku,

          brahma_price:
            brahmaProduct.price,

          shopify_price:
            shopifyProduct.price,

          brahma_product_name:
            brahmaProduct.product_name,

          shopify_product_name:
            shopifyProduct.product_name,
        });
      }
    }

    // ---------------------------------------------
    // SHOPIFY -> BRAHMA
    // ---------------------------------------------

    for (const [
      sku,
      shopifyProduct,
    ] of shopifyMap) {
      const brahmaProduct =
        brahmaMap.get(sku);

      if (!brahmaProduct) {
        missingInBrahmaAPI.push(
          shopifyProduct
        );

        skuNotMatchedProducts.push({
          sku,

          source: "SHOPIFY",

          product_name:
            shopifyProduct.product_name,
        });
      }
    }

    console.timeEnd(
      "COMPARE_PRODUCTS"
    );

    for (const shopifyProduct of shopifyProducts) {
  for (const brahmaProduct of brahmaProducts) {
    const shopifyTitle =
      normalizeTitle(
        shopifyProduct.product_name
      );

    const brahmaTitle =
      normalizeTitle(
        brahmaProduct.product_name
      );

    if (
      shopifyTitle === brahmaTitle &&
      shopifyProduct.sku
        ?.trim()
        ?.toLowerCase() !==
        brahmaProduct.product_sku
          ?.trim()
          ?.toLowerCase()
    ) {
      probableSkuMatches.push({
        variant_id:
          shopifyProduct.variant_id,

        shopify_sku:
          shopifyProduct.sku,

        external_sku:
          brahmaProduct.product_sku,

        shopify_product_name:
          shopifyProduct.product_name,

        external_product_name:
          brahmaProduct.product_name,
      });
    }
  }
}
    return NextResponse.json({
      success: true,

      stats: {
        shopify_products:
          shopifyProducts.length,

        brahma_products:
          brahmaProducts.length,

        matched_products:
          matchedProducts.length,

        sku_matched_count:
          skuMatchedProducts.length,

        sku_not_matched_count:
          skuNotMatchedProducts.length,

        missing_in_shopify:
          missingInShopify.length,

        missing_in_brahma_api:
          missingInBrahmaAPI.length,

        price_mismatches:
          priceMismatches.length,
          probable_sku_matches:
  probableSkuMatches.length,
      },

      missing_in_shopify:
        missingInShopify,

      missing_in_brahma_api:
        missingInBrahmaAPI,

      price_mismatches:
        priceMismatches,

      sku_matched_products:
        skuMatchedProducts,

      sku_not_matched_products:
        skuNotMatchedProducts,
        probable_sku_matches:
  probableSkuMatches,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to compare products",
      },

      {
        status: 500,
      }
    );
  }
}