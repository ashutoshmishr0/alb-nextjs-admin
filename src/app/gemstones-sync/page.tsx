


"use client";

import { useEffect, useState } from "react";

/* ======================
   TYPES
====================== */
type ProductStatus =
  | "NEW"
  | "EXISTS"
  | "MISSING_FROM_API";

type ShopifyStatus =
  | "ACTIVE"
  | "DRAFT"
  | "ARCHIVED"
  | null;

type Product = {
  id: string;
    stock?: number | null;
  variantId?: string | null;
  title: string;
sku?: string | null;
  basePrice: number;
  shopifyPrice: number | null;
shopifySku?: string | null;
  sellingPrice: number | null;

  isEdited?: boolean;

  images: string[];
  videos: string[];

  certificateUrl?: string | null;

  status: ProductStatus;

  shopifyProductId?: string;

  shopifyStatus?: ShopifyStatus;

  category_name?: string | null;
  color?: string | null;
  origin?: string | null;
  shape?: string | null;
  transparency?: string | null;
  treatment?: string | null;
  weight_in_carat?: string | null;
  dimension?: string | null;
  certifications_name?: string | null;
  certifications_number?: string | null;
};

type SyncStatus =
  | "idle"
  | "syncing"
  | "success"
  | "error";

/* ======================
   PAGE
====================== */
export default function CompareProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
// const [stockFixStatus, setStockFixStatus] = useState<SyncStatus>("idle");
  const [filter, setFilter] = useState<
    "ALL" | ProductStatus
  >("ALL");

  const [excludeKeywords, setExcludeKeywords] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [showModal, setShowModal] =
    useState(false);

  const [syncStatus, setSyncStatus] =
    useState<SyncStatus>("idle");

  const [syncProgress, setSyncProgress] =
    useState(0);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [bulkPriceInput, setBulkPriceInput] =
    useState("");

  /* ======================
     FETCH DATA
  ====================== */
  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch(
        "/api/compare-data"
      );

      if (!res.ok) {
        throw new Error(
          `HTTP ${res.status}`
        );
      }

      const data = await res.json();

      setProducts(
        (data.products ?? []).map(
          (p: Product) => ({
            ...p,
            sellingPrice: null,
            isEdited: false,
          })
        )
      );
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load"
      );
    } finally {
      setLoading(false);
    }
  }

  /* ======================
     FILTERED PRODUCTS
  ====================== */
  const excludedKeywords =
    excludeKeywords
      .toLowerCase()
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

  const filteredProducts = products
    .filter((p) => {
      if (filter === "ALL") {
        return true;
      }

      return p.status === filter;
    })
    .filter((p) => {
      const title =
        p.title.toLowerCase();

      return !excludedKeywords.some(
        (k) => title.includes(k)
      );
    });

  /* ======================
     BULK PRICE
  ====================== */
  function applyBulkPrice() {
    const input = bulkPriceInput
      .trim()
      .replace(/\s+/g, "");

    if (!input) return;

    const tokenRegex =
      /([+-]?(?:\d+\.?\d*x|\d+\.?\d*%|\d+))/gi;

    const tokens =
      input.match(tokenRegex);

    if (!tokens) return;

    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        let price = product.basePrice;

        for (const token of tokens) {
          const clean =
            token.replace(/[()]/g, "");

          const sign =
            clean.startsWith("-")
              ? -1
              : 1;

          const abs =
            clean.replace(/^[+-]/, "");

          if (
            /^\d+\.?\d*x$/i.test(abs)
          ) {
            price =
              price *
              parseFloat(abs);
          } else if (
            /^\d+\.?\d*%$/.test(abs)
          ) {
            price =
              price +
              sign *
                price *
                (parseFloat(abs) /
                  100);
          } else if (
            /^\d+$/.test(abs)
          ) {
            price =
              price +
              sign *
                parseInt(abs);
          }
        }

        return {
          ...product,
          sellingPrice: Math.max(
            0,
            Math.round(price)
          ),
          isEdited: true,
        };
      })
    );

    setBulkPriceInput("");
  }

  /* ======================
     SYNC
  ====================== */
  async function handleSync() {
    try {
      setSyncStatus("syncing");
      setSyncProgress(0);

      /* ======================
         NEW PRODUCTS
      ====================== */
      const newProducts =
        filteredProducts.filter(
          (p) =>
            p.status === "NEW" &&
            p.isEdited &&
            p.sellingPrice !== null
        );

  //     for (
  //       let i = 0;
  //       i < newProducts.length;
  //       i++
  //     ) {
  //       const p = newProducts[i];

  //       const res = await fetch(
  //         "/api/shopify/create-product",
  //         {
  //           method: "POST",

  //           headers: {
  //             "Content-Type":
  //               "application/json",
  //           },

  //           body: JSON.stringify({
  //             product_name:
  //               p.title,
  // sku: p.sku,              // ← add this line

  //             price:
  //               p.sellingPrice,

  //             mrp: p.basePrice,

  //             image_url:
  //               p.images[0] ??
  //               null,

  //             images:
  //               p.images.slice(1),

  //             video_url:
  //               p.videos[0] ??
  //               null,

  //             certificate_url:
  //               p.certificateUrl ??
  //               null,

  //             category_name:
  //               p.category_name,

  //             color: p.color,

  //             origin: p.origin,

  //             shape: p.shape,

  //             transparency:
  //               p.transparency,

  //             treatment:
  //               p.treatment,

  //             weight_in_carat:
  //               p.weight_in_carat,

  //             dimension:
  //               p.dimension,

  //             certifications_name:
  //               p.certifications_name,

  //             certifications_number:
  //               p.certifications_number,
  //           }),
  //         }
  //       );

  //       if (!res.ok) {
  //         throw new Error(
  //           `Failed to create ${p.title}`
  //         );
  //       }

  //       setSyncProgress(
  //         ((i + 1) /
  //           newProducts.length) *
  //           100
  //       );
  //     }
const CONCURRENCY = 15;

for (let i = 0; i < newProducts.length; i += CONCURRENCY) {
  const batch = newProducts.slice(i, i + CONCURRENCY);
  
 const results = await Promise.allSettled(
  batch.map((p) =>
    fetch("/api/shopify/create-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_name: p.title,
        sku: p.sku,
        price: p.sellingPrice,
        mrp: p.basePrice,
        image_url: p.images[0] ?? null,
        images: p.images.slice(1),
        video_url: p.videos[0] ?? null,
        certificate_url: p.certificateUrl ?? null,
        category_name: p.category_name,
        color: p.color,
        origin: p.origin,
        shape: p.shape,
        transparency: p.transparency,
        treatment: p.treatment,
        weight_in_carat: p.weight_in_carat,
        dimension: p.dimension,
        certifications_name: p.certifications_name,
        certifications_number: p.certifications_number,
      }),
    })
  )
);

const failed = results.filter((r) => r.status === "rejected");
if (failed.length > 0) {
  console.error(`❌ ${failed.length} products failed in this batch`);
}

  setSyncProgress(
  (Math.min(i + CONCURRENCY, newProducts.length) / newProducts.length) * 100
);
}
      /* ======================
         DRAFT MISSING PRODUCTS
      ====================== */
      const missingProducts =
        filteredProducts.filter(
          (p) =>
            p.status ===
            "MISSING_FROM_API"
        );

      for (const p of missingProducts) {
        const res = await fetch(
          "/api/shopify/draft-product",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              productId:
                p.shopifyProductId,
            }),
          }
        );

        if (!res.ok) {
          throw new Error(
            `Failed to draft ${p.title}`
          );
        }
      }

      /* ======================
         ACTIVATE DRAFT PRODUCTS
      ====================== */
      const draftProducts =
        filteredProducts.filter(
          (p) =>
            p.status === "EXISTS" &&
            p.shopifyStatus === "DRAFT"
        );

      for (const p of draftProducts) {
        const res = await fetch(
          "/api/shopify/activate-product",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              productId:
                p.shopifyProductId,
            }),
          }
        );

        if (!res.ok) {
          throw new Error(
            `Failed to activate ${p.title}`
          );
        }
      }

      /* ======================
         EXISTING PRODUCTS
      ====================== */
      const existingProducts =
        filteredProducts.filter(
          (p) =>
            p.status ===
            "EXISTS"
        );

      if (
        existingProducts.length > 0
      ) {
        setShowModal(true);
        setSyncStatus("idle");
      } else {
        setSyncStatus("success");

        setTimeout(() => {
          setSyncStatus("idle");
          loadProducts();
        }, 2000);
      }
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Sync failed"
      );

      setSyncStatus("error");
    }
  }

  /* ======================
     UPDATE EXISTING PRICES
  ====================== */
  async function updateExistingPrices() {
    try {
      setSyncStatus("syncing");

      const existing =
        filteredProducts.filter(
          (p) =>
            p.status ===
              "EXISTS" &&
            p.isEdited &&
            p.shopifyProductId &&
            p.sellingPrice !==
              null &&
            p.sellingPrice !==
              p.shopifyPrice
        );

      for (
        let i = 0;
        i < existing.length;
        i++
      ) {
        const p = existing[i];

        const res = await fetch(
          "/api/shopify/update-price",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              productId:
                p.shopifyProductId,

              price:
                p.sellingPrice,
            }),
          }
        );

        if (!res.ok) {
          throw new Error(
            `Failed to update ${p.title}`
          );
        }

        setSyncProgress(
          ((i + 1) /
            existing.length) *
            100
        );
      }

      setShowModal(false);

      setSyncStatus("success");

      setTimeout(() => {
        setSyncStatus("idle");
        loadProducts();
      }, 2000);
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Update failed"
      );

      setSyncStatus("error");
    }
  }
async function pushAllSku() {
  try {
    setSyncStatus("syncing");

   const existing = filteredProducts.filter(
  (p) =>
    p.shopifyProductId &&
    p.sku &&
    (
      !p.shopifySku ||
      p.shopifySku.trim() === ""
    )
);
console.log(
  existing.map((p) => ({
    title: p.title,
    sku: p.sku,
    productId: p.shopifyProductId,
  }))
);
    for (let i = 0; i < existing.length; i++) {
      const p = existing[i];

      const res = await fetch(
        "/api/shopify/update-sku",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            productId:
              p.shopifyProductId,

            sku: p.sku,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(
          `Failed SKU update for ${p.title}`
        );
      }

      setSyncProgress(
        ((i + 1) / existing.length) *
          100
      );
    }

    setSyncStatus("success");

    setTimeout(() => {
      setSyncStatus("idle");
      loadProducts();
    }, 2000);
  } catch (error) {
    console.error(error);

    setErrorMessage(
      error instanceof Error
        ? error.message
        : "SKU update failed"
    );

    setSyncStatus("error");
  }
}

  /* ======================
     STATS
  ====================== */
  const newCount =
    products.filter(
      (p) => p.status === "NEW"
    ).length;

  const existingCount =
    products.filter(
      (p) => p.status === "EXISTS"
    ).length;

  const missingCount =
    products.filter(
      (p) =>
        p.status ===
        "MISSING_FROM_API"
    ).length;

  const draftCount =
    products.filter(
      (p) =>
        p.shopifyStatus ===
        "DRAFT"
    ).length;

  const activeCount =
    products.filter(
      (p) =>
        p.shopifyStatus ===
        "ACTIVE"
    ).length;
const withoutSkuCount =
  products.filter(
    (p) =>
      p.shopifyProductId &&
      (
        !p.shopifySku ||
        p.shopifySku.trim() === ""
      )
  ).length;
  const priceChanges =
    products.filter(
      (p) =>
        p.status === "EXISTS" &&
        p.sellingPrice !== null &&
        p.shopifyPrice !== null &&
        p.sellingPrice !==
          p.shopifyPrice
    ).length;

  /* ======================
     LOADING
  ====================== */
  const [loadingProgress, setLoadingProgress] =
  useState(1);

useEffect(() => {
  if (!loading) return;

  let current = 1;

  const interval = setInterval(() => {
    current += Math.floor(
      Math.random() * 12
    );

    if (current >= 95) {
      current = 95;
    }

    setLoadingProgress(current);
  }, 400);

  return () => clearInterval(interval);
}, [loading]);

useEffect(() => {
  if (!loading) {
    setLoadingProgress(100);
  }
}, [loading]);
 if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-xl">
        <div className="mb-5">
          <h1 className="text-3xl font-bold mb-2">
            Loading Products
          </h1>

          <p className="text-gray-500">
            This may take upto 2–5 minutes depending on product count.
          </p>
        </div>

        <div className="w-full h-5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-black transition-all duration-500"
            style={{
              width: `${loadingProgress}%`,
            }}
          />
        </div>

        <div className="mt-3 flex justify-between text-sm text-gray-600">
          <span>
            Fetching products...
          </span>

          <span>
            {loadingProgress}%
          </span>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">
        Product Sync Dashboard
      </h1>

      <p className="text-gray-600 mb-6">
        Compare BrahmaGems and
        Shopify products
      </p>

      <div className="grid grid-cols-6 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {newCount}
          </div>

          <div className="text-sm text-gray-600">
            New Products
          </div>
        </div>
<div className="bg-purple-50 p-4 rounded-lg">
  <div className="text-2xl font-bold text-purple-600">
    {withoutSkuCount}
  </div>

  <div className="text-sm text-gray-600">
    Without SKU
  </div>
</div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {existingCount}
          </div>

          <div className="text-sm text-gray-600">
            Existing Products
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {priceChanges}
          </div>

          <div className="text-sm text-gray-600">
            Price Changes
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {missingCount}
          </div>

          <div className="text-sm text-gray-600">
            Missing Products
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {draftCount}
          </div>

          <div className="text-sm text-gray-600">
            Draft Products
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          "ALL",
          "NEW",
          "EXISTS",
          "MISSING_FROM_API",
        ].map((f) => (
          <button
            key={f}
            onClick={() =>
              setFilter(f as any)
            }
            className={`px-4 py-2 rounded border ${
              filter === f
                ? "bg-black text-white"
                : "bg-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Exclude keywords. Example: diamond,ruby,test"
          value={excludeKeywords}
          onChange={(e) =>
            setExcludeKeywords(
              e.target.value
            )
          }
          className="border px-4 py-2 rounded w-full"
        />
      </div>

      <div className="bg-purple-50 p-5 rounded-lg mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={bulkPriceInput}
            onChange={(e) =>
              setBulkPriceInput(
                e.target.value
              )
            }
            placeholder="2x, +10%, +5000"
            className="border px-4 py-2 rounded w-full"
          />

          <button
            onClick={applyBulkPrice}
            className="bg-purple-600 text-white px-6 rounded"
          >
            Apply
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}

      {syncStatus === "success" && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          Sync completed successfully
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleSync}
          disabled={
            syncStatus === "syncing"
          }
          className="bg-black text-white px-6 py-2 rounded"
        >
          {syncStatus === "syncing"
            ? `Syncing ${Math.round(
                syncProgress
              )}%`
            : "Sync Products"}
        </button>
{/* <button
  onClick={pushAllSku}
  disabled={syncStatus === "syncing"}
  className="bg-blue-600 text-white px-6 py-2 rounded"
>
  Push All SKU
</button> */}
{/* <button
  onClick={fixStock}
  disabled={stockFixStatus === "syncing"}
  className="bg-orange-500 text-white px-6 py-2 rounded"
>
  {stockFixStatus === "syncing" ? "Fixing..." : "Fix Stock (1000→1)"}
</button> */}
        <button
          onClick={loadProducts}
          className="border px-4 py-2 rounded"
        >
          Refresh
        </button>
      </div>

      <div className="border rounded-lg overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="border-b p-3 text-left">
                Product
              </th>

              <th className="border-b p-3 text-center">
                Shopify Price
              </th>

              <th className="border-b p-3 text-center">
                API Price
              </th>

              <th className="border-b p-3 text-center">
                New Price
              </th>

              <th className="border-b p-3 text-center">
                Shopify Status
              </th>

              <th className="border-b p-3 text-center">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((p) => {
              const priceChanged =
                p.sellingPrice !==
                  null &&
                p.shopifyPrice !==
                  null &&
                p.sellingPrice !==
                  p.shopifyPrice;

              return (
                <tr
key={p.shopifyProductId || p.sku || p.id}                  className="hover:bg-gray-50"
                >
                  <td className="border-b p-3">
                    <div className="font-medium">
                      {p.title}
                    </div>
                  </td>

                  <td className="border-b p-3 text-center">
                    {p.shopifyPrice !==
                    null ? (
                      <span className="text-green-700 font-medium">
                        ₹
                        {p.shopifyPrice.toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="border-b p-3 text-center">
                    ₹
                    {p.basePrice.toLocaleString(
                      "en-IN"
                    )}
                  </td>

                  <td className="border-b p-3 text-center">
                    <input
                      type="number"
                      value={
                        p.sellingPrice ??
                        ""
                      }
                      onChange={(
                        e
                      ) =>
                        setProducts(
                          (prev) =>
                            prev.map(
                              (
                                x
                              ) =>
                                x.id ===
                                p.id
                                  ? {
                                      ...x,
                                      sellingPrice:
                                        e
                                          .target
                                          .value ===
                                        ""
                                          ? null
                                          : Number(
                                              e
                                                .target
                                                .value
                                            ),
                                      isEdited:
                                        true,
                                    }
                                  : x
                            )
                        )
                      }
                      className={`border px-3 py-1 w-32 rounded text-center ${
                        priceChanged
                          ? "border-orange-400 bg-orange-50"
                          : "border-gray-300"
                      }`}
                    />
                  </td>

                  <td className="border-b p-3 text-center">
                    {p.shopifyStatus ? (
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          p.shopifyStatus ===
                          "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : p.shopifyStatus ===
                              "DRAFT"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {p.shopifyStatus}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="border-b p-3 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        p.status === "NEW"
                          ? "bg-blue-100 text-blue-700"
                          : p.status ===
                            "MISSING_FROM_API"
                          ? "bg-red-100 text-red-700"
                          : p.shopifyStatus ===
                            "DRAFT"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {p.status === "NEW"
                        ? "🆕 NEW"
                        : p.status ===
                          "MISSING_FROM_API"
                        ? "⚠️ MISSING"
                        : p.shopifyStatus ===
                          "DRAFT"
                        ? "📝 DRAFT"
                        : "♻️ ACTIVE"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="font-bold text-lg mb-3">
              Update Existing
              Products
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              {priceChanges} price
              changes found
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={
                  updateExistingPrices
                }
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Update Prices
              </button>

              <button
                onClick={() =>
                  setShowModal(false)
                }
                className="border px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
