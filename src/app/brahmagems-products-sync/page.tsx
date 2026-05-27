// // src/app/shopify-compare/page.tsx

// "use client";

// import {
//   AlertTriangle,
//   CheckCircle,
//   Link2,
//   Loader2,
//   PackageSearch,
//   RefreshCcw,
//   XCircle,
// } from "lucide-react";

// import {
//   useEffect,
//   useMemo,
//   useState,
// } from "react";

// export default function Page() {
//   const [loading, setLoading] =
//     useState(false);
// const [syncingSku, setSyncingSku] =
//   useState<string | null>(null);
//   const [data, setData] =
//     useState<any>(null);

//   const [multiplier, setMultiplier] =
//     useState("2");

//   const [
//     excludedKeywords,
//     setExcludedKeywords,
//   ] = useState("");

//   // ---------------------------------------------
//   // FETCH COMPARE DATA
//   // ---------------------------------------------

//   async function fetchCompareData() {
//     try {
//       setLoading(true);

//       const res = await fetch(
//         "/api/shopify/compare-products",
//         {
//           cache: "no-store",
//         }
//       );

//       const json = await res.json();

//       setData(json);
//     } catch (error) {
//       console.error(error);
//     } finally {
//       setLoading(false);
//     }
//   }
// async function syncSku(
//   variantId: string,
//   sku: string
// ) {
//   try {
//     setSyncingSku(variantId);

//     const res = await fetch(
//       "/api/shopify/update-sku",
//       {
//         method: "POST",

//         headers: {
//           "Content-Type":
//             "application/json",
//         },

//         body: JSON.stringify({
//           variantId,
//           sku,
//         }),
//       }
//     );

//     const data = await res.json();

//     if (!res.ok) {
//       alert(
//         data.error ||
//           "Failed to update SKU"
//       );

//       return;
//     }

//     alert("SKU Updated Successfully");

//     // Refresh compare data
//     fetchCompareData();
//   } catch (error) {
//     console.error(error);

//     alert("Something went wrong");
//   } finally {
//     setSyncingSku(null);
//   }
// }
//   useEffect(() => {
//     fetchCompareData();
//   }, []);

//   // ---------------------------------------------
//   // FILTERS
//   // ---------------------------------------------

//   const excludedList = useMemo(() => {
//     return excludedKeywords
//       .split(",")
//       .map((item) =>
//         item.trim().toLowerCase()
//       )
//       .filter(Boolean);
//   }, [excludedKeywords]);

//   function isExcluded(
//     productName: string
//   ) {
//     return excludedList.some(
//       (keyword) =>
//         productName
//           ?.toLowerCase()
//           ?.includes(keyword)
//     );
//   }

//   // ---------------------------------------------
//   // FILTERED DATA
//   // ---------------------------------------------

//   const filteredPriceMismatches =
//     data?.price_mismatches?.filter(
//       (item: any) =>
//         !isExcluded(
//           item.brahma_product_name
//         )
//     ) || [];

//   const filteredMissingInShopify =
//     data?.missing_in_shopify?.filter(
//       (item: any) =>
//         !isExcluded(item.product_name)
//     ) || [];

//   const filteredMissingInBrahma =
//     data?.missing_in_brahma_api?.filter(
//       (item: any) =>
//         !isExcluded(item.product_name)
//     ) || [];

//   // ---------------------------------------------
//   // PRICE CALCULATION
//   // ---------------------------------------------

//   const finalPriceProducts =
//     filteredPriceMismatches.map(
//       (item: any) => {
//         const brahmaPrice = Number(
//           item.brahma_price
//             ?.replace("Rs.", "")
//             ?.replace(/,/g, "")
//             ?.trim()
//         );

//         const finalPrice =
//           brahmaPrice *
//           Number(multiplier || 1);

//         return {
//           ...item,

//           calculated_price:
//             finalPrice,
//         };
//       }
//     );

//   // ---------------------------------------------
//   // UI
//   // ---------------------------------------------

//   return (
//     <div className="min-h-screen bg-zinc-950 text-white p-6">
//       {/* HEADER */}
//       <div className="flex items-center justify-between mb-8">
//         <div>
//           <h1 className="text-3xl font-bold">
//             Shopify Sync Dashboard
//           </h1>

//           <p className="text-zinc-400 mt-2">
//             BrahmaGems ↔ Shopify
//             Product Sync
//           </p>
//         </div>

//         <button
//           onClick={fetchCompareData}
//           className="bg-zinc-800 hover:bg-zinc-700 transition px-5 py-3 rounded-xl flex items-center gap-2"
//         >
//           <RefreshCcw className="w-4 h-4" />
//           Refresh Compare
//         </button>
//       </div>

//       {/* CONTROLS */}
//       <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-8">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           {/* MULTIPLIER */}
//           <div>
//             <label className="text-sm text-zinc-400 block mb-2">
//               Price Multiplier
//             </label>

//             <input
//               value={multiplier}
//               onChange={(e) =>
//                 setMultiplier(
//                   e.target.value
//                 )
//               }
//               placeholder="2"
//               className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 outline-none"
//             />
//           </div>

//           {/* EXCLUDED */}
//           <div>
//             <label className="text-sm text-zinc-400 block mb-2">
//               Excluded Keywords
//             </label>

//             <input
//               value={excludedKeywords}
//               onChange={(e) =>
//                 setExcludedKeywords(
//                   e.target.value
//                 )
//               }
//               placeholder="diamond,ruby"
//               className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 outline-none"
//             />
//           </div>

//           {/* ACTIONS */}
//           <div className="flex items-end gap-3">
//             <button className="bg-yellow-600 hover:bg-yellow-500 transition px-5 py-3 rounded-xl font-medium">
//               Sync Prices
//             </button>

//             <button className="bg-green-600 hover:bg-green-500 transition px-5 py-3 rounded-xl font-medium">
//               Create Products
//             </button>

//             <button className="bg-red-600 hover:bg-red-500 transition px-5 py-3 rounded-xl font-medium">
//               Draft Products
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* LOADING */}
//       {loading && (
//         <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 flex items-center justify-center gap-3 mb-8">
//           <Loader2 className="animate-spin w-5 h-5" />

//           <p className="text-zinc-300">
//             Comparing Products...
//           </p>
//         </div>
//       )}

//       {/* STATS */}
//       {data && (
//         <>
//           <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-6 gap-4 mb-10">
//             <StatCard
//               title="Shopify"
//               value={
//                 data.stats
//                   .shopify_products
//               }
//             />

//             <StatCard
//               title="Brahma API"
//               value={
//                 data.stats
//                   .brahma_products
//               }
//             />

//             <StatCard
//               title="SKU Matched"
//               value={
//                 data.stats
//                   .sku_matched_count
//               }
//               color="text-green-400"
//             />

//             <StatCard
//               title="SKU Not Matched"
//               value={
//                 data.stats
//                   .sku_not_matched_count
//               }
//               color="text-red-400"
//             />

           

//             <StatCard
//               title="Missing Shopify"
//               value={
//                 data.stats
//                   .missing_in_shopify
//               }
//               color="text-orange-400"
//             />
//             <StatCard
//   title="Probable SKU Matches"
//   value={
//     data.stats
//       .probable_sku_matches
//   }
//   color="text-blue-400"
// />
//           </div>

//           {/* PRICE MISMATCH */}
//           <SectionCard
//             title="Price Mismatches"
//             icon={
//               <AlertTriangle className="w-5 h-5 text-yellow-500" />
//             }
//           >
//             <Table>
//               <thead>
//                 <tr>
//                   <Th>SKU</Th>
//                   <Th>Product</Th>
//                   <Th>Brahma Price</Th>
//                   <Th>Multiplier</Th>
//                   <Th>Final Price</Th>
//                   <Th>Shopify Price</Th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {finalPriceProducts.map(
//                   (
//                     item: any,
//                     index: number
//                   ) => (
//                     <tr
//                       key={index}
//                       className="border-t border-zinc-800"
//                     >
//                       <Td>
//                         {item.sku}
//                       </Td>

//                       <Td>
//                         {
//                           item.brahma_product_name
//                         }
//                       </Td>

//                       <Td>
//                         {
//                           item.brahma_price
//                         }
//                       </Td>

//                       <Td>
//                         {multiplier}x
//                       </Td>

//                       <Td className="text-yellow-400 font-semibold">
//                         ₹
//                         {item.calculated_price.toLocaleString()}
//                       </Td>

//                       <Td className="text-green-400">
//                         ₹
//                         {Number(
//                           item.shopify_price
//                         ).toLocaleString()}
//                       </Td>
//                     </tr>
//                   )
//                 )}
//               </tbody>
//             </Table>
//           </SectionCard>

//           {/* MISSING SHOPIFY */}
//           <SectionCard
//             title="Missing In Shopify"
//             icon={
//               <PackageSearch className="w-5 h-5 text-orange-500" />
//             }
//           >
//             <Table>
//               <thead>
//                 <tr>
//                   <Th>SKU</Th>
//                   <Th>Product</Th>
//                   <Th>Price</Th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {filteredMissingInShopify.map(
//                   (
//                     item: any,
//                     index: number
//                   ) => (
//                     <tr
//                       key={index}
//                       className="border-t border-zinc-800"
//                     >
//                       <Td>
//                         {
//                           item.product_sku
//                         }
//                       </Td>

//                       <Td>
//                         {
//                           item.product_name
//                         }
//                       </Td>

//                       <Td>
//                         {item.price}
//                       </Td>
//                     </tr>
//                   )
//                 )}
//               </tbody>
//             </Table>
//           </SectionCard>

//           {/* SKU NOT MATCHED */}
//           <SectionCard
//             title="SKU Not Matched"
//             icon={
//               <XCircle className="w-5 h-5 text-red-500" />
//             }
//           >
//             <Table>
//               <thead>
//                 <tr>
//                   <Th>SKU</Th>
//                   <Th>Source</Th>
//                   <Th>Product</Th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {data.sku_not_matched_products.map(
//                   (
//                     item: any,
//                     index: number
//                   ) => (
//                     <tr
//                       key={index}
//                       className="border-t border-zinc-800"
//                     >
//                       <Td>
//                         {item.sku}
//                       </Td>

//                       <Td>
//                         {item.source}
//                       </Td>

//                       <Td>
//                         {
//                           item.product_name
//                         }
//                       </Td>
//                     </tr>
//                   )
//                 )}
//               </tbody>
//             </Table>
//           </SectionCard>
// {/* PROBABLE SKU MATCHES */}
// <SectionCard
//   title="Probable SKU Matches"
//   icon={
//     <Link2 className="w-5 h-5 text-blue-500" />
//   }
// >
//   <Table>
//     <thead>
//       <tr>
//         <Th>Shopify SKU</Th>

//         <Th>External SKU</Th>

//         <Th>Product</Th>

//         <Th>Action</Th>
//       </tr>
//     </thead>

//     <tbody>
//       {data.probable_sku_matches?.map(
//         (
//           item: any,
//           index: number
//         ) => (
//           <tr
//             key={index}
//             className="border-t border-zinc-800"
//           >
//             <Td>
//               {
//                 item.shopify_sku
//               }
//             </Td>

//             <Td className="text-green-400 font-semibold">
//               {
//                 item.external_sku
//               }
//             </Td>

//             <Td>
//               {
//                 item.shopify_product_name
//               }
//             </Td>

//             <Td>
//               <button
//                 onClick={() =>
//                   syncSku(
//                     item.variant_id,
//                     item.external_sku
//                   )
//                 }
//                 disabled={
//                   syncingSku ===
//                   item.variant_id
//                 }
//                 className="bg-blue-600 hover:bg-blue-500 transition px-4 py-2 rounded-lg text-sm disabled:opacity-50"
//               >
//                 {syncingSku ===
//                 item.variant_id ? (
//                   <div className="flex items-center gap-2">
//                     <Loader2 className="w-4 h-4 animate-spin" />

//                     Syncing...
//                   </div>
//                 ) : (
//                   "Sync SKU"
//                 )}
//               </button>
//             </Td>
//           </tr>
//         )
//       )}
//     </tbody>
//   </Table>
// </SectionCard>
//           {/* MATCHED */}
//           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-10">
//             <div className="flex items-center gap-3">
//               <CheckCircle className="w-6 h-6 text-green-500" />

//               <div>
//                 <h2 className="text-xl font-semibold">
//                   SKU Matched
//                   Products
//                 </h2>

//                 <p className="text-zinc-400 mt-1">
//                   Total matched SKUs:
//                   {" "}
//                   {
//                     data.stats
//                       .sku_matched_count
//                   }
//                 </p>
//               </div>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// // ---------------------------------------------
// // REUSABLES
// // ---------------------------------------------

// function StatCard({
//   title,
//   value,
//   color = "text-white",
// }: any) {
//   return (
//     <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
//       <p className="text-zinc-400 text-sm">
//         {title}
//       </p>

//       <h2
//         className={`text-3xl font-bold mt-2 ${color}`}
//       >
//         {value}
//       </h2>
//     </div>
//   );
// }

// function SectionCard({
//   title,
//   icon,
//   children,
// }: any) {
//   return (
//     <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-10">
//       <div className="p-5 border-b border-zinc-800 flex items-center gap-2">
//         {icon}

//         <h2 className="text-xl font-semibold">
//           {title}
//         </h2>
//       </div>

//       <div className="overflow-auto">
//         {children}
//       </div>
//     </div>
//   );
// }

// function Table({
//   children,
// }: any) {
//   return (
//     <table className="w-full text-sm">
//       {children}
//     </table>
//   );
// }

// function Th({
//   children,
// }: any) {
//   return (
//     <th className="text-left p-4 bg-zinc-800 text-zinc-300 whitespace-nowrap">
//       {children}
//     </th>
//   );
// }

// function Td({
//   children,
//   className = "",
// }: any) {
//   return (
//     <td
//       className={`p-4 whitespace-nowrap ${className}`}
//     >
//       {children}
//     </td>
//   );
// }


// src/app/shopify-compare/page.tsx

"use client";

import {
  AlertTriangle,
  CheckCircle,
  Link2,
  Loader2,
  PackageSearch,
  RefreshCcw,
  XCircle,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

export default function Page() {
  // ---------------------------------------------
  // STATES
  // ---------------------------------------------

  const [loading, setLoading] =
    useState(false);

  const [
    syncingAllSkus,
    setSyncingAllSkus,
  ] = useState(false);

  const [initialized, setInitialized] =
    useState(false);

  const [data, setData] =
    useState<any>(null);

  const [multiplier, setMultiplier] =
    useState("2");

  const [
    excludedKeywords,
    setExcludedKeywords,
  ] = useState("");

  // ---------------------------------------------
  // FETCH COMPARE DATA
  // ---------------------------------------------

  async function fetchCompareData() {
    try {
      setLoading(true);

      const res = await fetch(
        "/api/shopify/compare-products",
        {
          cache: "no-store",
        }
      );

      const json = await res.json();

      setData(json);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------
  // BULK SKU SYNC
  // ---------------------------------------------

  async function syncAllSkus() {
    try {
      setSyncingAllSkus(true);

      const products =
        data?.probable_sku_matches || [];

      for (const item of products) {
        try {
          const res = await fetch(
            "/api/shopify/update-sku",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                variantId:
                  item.variant_id,

                sku: item.external_sku,
              }),
            }
          );

          const response =
            await res.json();

          if (!res.ok) {
            console.error(
              response.error
            );

            continue;
          }

          console.log(
            `✅ Synced SKU → ${item.external_sku}`
          );
        } catch (error) {
          console.error(
            "SKU Sync Failed:",
            item.external_sku
          );
        }
      }

      alert(
        "All SKUs Synced Successfully"
      );

      fetchCompareData();
    } catch (error) {
      console.error(error);

      alert("Bulk SKU Sync Failed");
    } finally {
      setSyncingAllSkus(false);
    }
  }

  // ---------------------------------------------
  // INITIAL FETCH
  // ---------------------------------------------

  useEffect(() => {
    if (initialized) return;

    setInitialized(true);

    fetchCompareData();
  }, [initialized]);

  // ---------------------------------------------
  // FILTERS
  // ---------------------------------------------

  const excludedList = useMemo(() => {
    return excludedKeywords
      .split(",")
      .map((item) =>
        item.trim().toLowerCase()
      )
      .filter(Boolean);
  }, [excludedKeywords]);

  function isExcluded(
    productName: string
  ) {
    return excludedList.some(
      (keyword) =>
        productName
          ?.toLowerCase()
          ?.includes(keyword)
    );
  }

  // ---------------------------------------------
  // FILTERED DATA
  // ---------------------------------------------

  const filteredPriceMismatches =
    data?.price_mismatches?.filter(
      (item: any) =>
        !isExcluded(
          item.brahma_product_name
        )
    ) || [];

  const filteredMissingInShopify =
    data?.missing_in_shopify?.filter(
      (item: any) =>
        !isExcluded(item.product_name)
    ) || [];

  const filteredMissingInBrahma =
    data?.missing_in_brahma_api?.filter(
      (item: any) =>
        !isExcluded(item.product_name)
    ) || [];

  // ---------------------------------------------
  // PRICE CALCULATION
  // ---------------------------------------------

  const finalPriceProducts =
    filteredPriceMismatches.map(
      (item: any) => {
        const brahmaPrice = Number(
          item.brahma_price
            ?.replace("Rs.", "")
            ?.replace(/,/g, "")
            ?.trim()
        );

        const finalPrice =
          brahmaPrice *
          Number(multiplier || 1);

        return {
          ...item,

          calculated_price:
            finalPrice,
        };
      }
    );

  // ---------------------------------------------
  // UI
  // ---------------------------------------------

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            Shopify Sync Dashboard
          </h1>

          <p className="text-zinc-400 mt-2">
            BrahmaGems ↔ Shopify
            Product Sync
          </p>
        </div>

        <button
          onClick={fetchCompareData}
          className="bg-zinc-800 hover:bg-zinc-700 transition px-5 py-3 rounded-xl flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh Compare
        </button>
      </div>

      {/* CONTROLS */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* MULTIPLIER */}
          <div>
            <label className="text-sm text-zinc-400 block mb-2">
              Price Multiplier
            </label>

            <input
              value={multiplier}
              onChange={(e) =>
                setMultiplier(
                  e.target.value
                )
              }
              placeholder="2"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 outline-none"
            />
          </div>

          {/* EXCLUDED */}
          <div>
            <label className="text-sm text-zinc-400 block mb-2">
              Excluded Keywords
            </label>

            <input
              value={excludedKeywords}
              onChange={(e) =>
                setExcludedKeywords(
                  e.target.value
                )
              }
              placeholder="diamond,ruby"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 outline-none"
            />
          </div>

          {/* ACTIONS */}
          <div className="flex flex-wrap items-end gap-3">
            <button className="bg-yellow-600 hover:bg-yellow-500 transition px-5 py-3 rounded-xl font-medium">
              Sync Prices
            </button>

            <button className="bg-green-600 hover:bg-green-500 transition px-5 py-3 rounded-xl font-medium">
              Create Products
            </button>

            <button className="bg-red-600 hover:bg-red-500 transition px-5 py-3 rounded-xl font-medium">
              Draft Products
            </button>

            <button
              onClick={syncAllSkus}
              disabled={
                syncingAllSkus
              }
              className="bg-blue-600 hover:bg-blue-500 transition px-5 py-3 rounded-xl font-medium disabled:opacity-50"
            >
              {syncingAllSkus ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />

                  Syncing SKUs...
                </div>
              ) : (
                "Sync SKUs"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 flex items-center justify-center gap-3 mb-8">
          <Loader2 className="animate-spin w-5 h-5" />

          <p className="text-zinc-300">
            Comparing Products...
          </p>
        </div>
      )}

      {/* STATS */}
      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-6 gap-4 mb-10">
            <StatCard
              title="Shopify"
              value={
                data.stats
                  .shopify_products
              }
            />

            <StatCard
              title="Brahma API"
              value={
                data.stats
                  .brahma_products
              }
            />

            <StatCard
              title="SKU Matched"
              value={
                data.stats
                  .sku_matched_count
              }
              color="text-green-400"
            />

            <StatCard
              title="SKU Not Matched"
              value={
                data.stats
                  .sku_not_matched_count
              }
              color="text-red-400"
            />

            <StatCard
              title="Missing Shopify"
              value={
                data.stats
                  .missing_in_shopify
              }
              color="text-orange-400"
            />

            <StatCard
              title="Probable SKU Matches"
              value={
                data.stats
                  .probable_sku_matches
              }
              color="text-blue-400"
            />
          </div>

          {/* PRICE MISMATCH */}
          <SectionCard
            title="Price Mismatches"
            icon={
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            }
          >
            <Table>
              <thead>
                <tr>
                  <Th>SKU</Th>
                  <Th>Product</Th>
                  <Th>Brahma Price</Th>
                  <Th>Multiplier</Th>
                  <Th>Final Price</Th>
                  <Th>Shopify Price</Th>
                </tr>
              </thead>

              <tbody>
                {finalPriceProducts.map(
                  (
                    item: any,
                    index: number
                  ) => (
                    <tr
                      key={index}
                      className="border-t border-zinc-800"
                    >
                      <Td>
                        {item.sku}
                      </Td>

                      <Td>
                        {
                          item.brahma_product_name
                        }
                      </Td>

                      <Td>
                        {
                          item.brahma_price
                        }
                      </Td>

                      <Td>
                        {multiplier}x
                      </Td>

                      <Td className="text-yellow-400 font-semibold">
                        ₹
                        {item.calculated_price.toLocaleString()}
                      </Td>

                      <Td className="text-green-400">
                        ₹
                        {Number(
                          item.shopify_price
                        ).toLocaleString()}
                      </Td>
                    </tr>
                  )
                )}
              </tbody>
            </Table>
          </SectionCard>

          {/* MISSING SHOPIFY */}
          <SectionCard
            title="Missing In Shopify"
            icon={
              <PackageSearch className="w-5 h-5 text-orange-500" />
            }
          >
            <Table>
              <thead>
                <tr>
                  <Th>SKU</Th>
                  <Th>Product</Th>
                  <Th>Price</Th>
                </tr>
              </thead>

              <tbody>
                {filteredMissingInShopify.map(
                  (
                    item: any,
                    index: number
                  ) => (
                    <tr
                      key={index}
                      className="border-t border-zinc-800"
                    >
                      <Td>
                        {
                          item.product_sku
                        }
                      </Td>

                      <Td>
                        {
                          item.product_name
                        }
                      </Td>

                      <Td>
                        {item.price}
                      </Td>
                    </tr>
                  )
                )}
              </tbody>
            </Table>
          </SectionCard>

          {/* SKU NOT MATCHED */}
          <SectionCard
            title="SKU Not Matched"
            icon={
              <XCircle className="w-5 h-5 text-red-500" />
            }
          >
            <Table>
              <thead>
                <tr>
                  <Th>SKU</Th>
                  <Th>Source</Th>
                  <Th>Product</Th>
                </tr>
              </thead>

              <tbody>
                {data.sku_not_matched_products?.map(
                  (
                    item: any,
                    index: number
                  ) => (
                    <tr
                      key={index}
                      className="border-t border-zinc-800"
                    >
                      <Td>
                        {item.sku}
                      </Td>

                      <Td>
                        {item.source}
                      </Td>

                      <Td>
                        {
                          item.product_name
                        }
                      </Td>
                    </tr>
                  )
                )}
              </tbody>
            </Table>
          </SectionCard>

          {/* PROBABLE SKU MATCHES */}
          <SectionCard
            title="Probable SKU Matches"
            icon={
              <Link2 className="w-5 h-5 text-blue-500" />
            }
          >
            <Table>
              <thead>
                <tr>
                  <Th>Shopify SKU</Th>

                  <Th>External SKU</Th>

                  <Th>Product</Th>
                </tr>
              </thead>

              <tbody>
                {data.probable_sku_matches?.map(
                  (
                    item: any,
                    index: number
                  ) => (
                    <tr
                      key={index}
                      className="border-t border-zinc-800"
                    >
                      <Td>
                        {
                          item.shopify_sku
                        }
                      </Td>

                      <Td className="text-green-400 font-semibold">
                        {
                          item.external_sku
                        }
                      </Td>

                      <Td>
                        {
                          item.shopify_product_name
                        }
                      </Td>
                    </tr>
                  )
                )}
              </tbody>
            </Table>
          </SectionCard>

          {/* MATCHED */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-10">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-500" />

              <div>
                <h2 className="text-xl font-semibold">
                  SKU Matched Products
                </h2>

                <p className="text-zinc-400 mt-1">
                  Total matched SKUs:
                  {" "}
                  {
                    data.stats
                      .sku_matched_count
                  }
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------
// REUSABLES
// ---------------------------------------------

function StatCard({
  title,
  value,
  color = "text-white",
}: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <p className="text-zinc-400 text-sm">
        {title}
      </p>

      <h2
        className={`text-3xl font-bold mt-2 ${color}`}
      >
        {value}
      </h2>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-10">
      <div className="p-5 border-b border-zinc-800 flex items-center gap-2">
        {icon}

        <h2 className="text-xl font-semibold">
          {title}
        </h2>
      </div>

      <div className="overflow-auto">
        {children}
      </div>
    </div>
  );
}

function Table({
  children,
}: any) {
  return (
    <table className="w-full text-sm">
      {children}
    </table>
  );
}

function Th({
  children,
}: any) {
  return (
    <th className="text-left p-4 bg-zinc-800 text-zinc-300 whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: any) {
  return (
    <td
      className={`p-4 whitespace-nowrap ${className}`}
    >
      {children}
    </td>
  );
}