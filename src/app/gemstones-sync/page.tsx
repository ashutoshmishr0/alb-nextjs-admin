

// "use client";

// import { useEffect, useState } from "react";

// /* ======================
//    TYPES
// ====================== */
// type Product = {
//   id: string;
//   title: string;
//   basePrice: number;
//   shopifyPrice: number | null;
// sellingPrice: number | null;   // 👈 number → number | null
//   isEdited?: boolean;        images: string[];
//   videos: string[];
//   certificateUrl?: string;
//   status: "NEW" | "EXISTS";
//   shopifyProductId?: string;
// };

// type SyncStatus = "idle" | "syncing" | "success" | "error";

// /* ======================
//    PAGE
// ====================== */
// export default function CompareProductsPage() {
//   const [products, setProducts] = useState<Product[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [showModal, setShowModal] = useState(false);
//   const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
//   const [syncProgress, setSyncProgress] = useState(0);
//   const [errorMessage, setErrorMessage] = useState<string>("");
  
//   // 🆕 Bulk price calculator
//   const [bulkPriceInput, setBulkPriceInput] = useState<string>("");

//   /* ======================
//      FETCH DATA
//   ====================== */
//   useEffect(() => {
//     loadProducts();
    
//   }, []);

//   async function loadProducts() {
//     setLoading(true);
//     setErrorMessage("");
    
//     try {
//       const res = await fetch("/api/compare-data");
      
//       if (!res.ok) {
//         throw new Error(`HTTP ${res.status}: ${res.statusText}`);
//       }
      
//       const data = await res.json();
//       console.log("📦 Loaded products:", data.products);
// setProducts(
//   (data.products ?? []).map((p: Product) => ({
//     ...p,
//     sellingPrice: null,
//     isEdited: false,
//   }))
// );
//     } catch (error) {
//       console.error("Failed to load compare data:", error);
//       setErrorMessage(
//         error instanceof Error ? error.message : "Failed to load products"
//       );
//     } finally {
//       setLoading(false);
//     }
//   }

//   /* ======================
//      🆕 BULK PRICE CALCULATOR
//   ====================== */
//   function applyBulkPrice() {
//     const input = bulkPriceInput.trim();
//     if (!input) return;

//     setProducts((prevProducts) =>
//       prevProducts.map((product) => {
//         let newPrice = product.basePrice;

//         // Check if it's a multiplier (2x, 3x, 1.5x, etc.)
//         const multiplierMatch = input.match(/^(\d+\.?\d*)x$/i);
//         if (multiplierMatch) {
//           const multiplier = parseFloat(multiplierMatch[1]);
//           newPrice = Math.round(product.basePrice * multiplier);
//         }
//         // Check if it's a percentage (10%, 15%, -5%, etc.)
//         else if (input.match(/^-?\d+\.?\d*%$/)) {
//           const percentage = parseFloat(input.replace("%", ""));
//           newPrice = Math.round(product.basePrice * (1 + percentage / 100));
//         }
//         // Check if it's a fixed amount (+1000, -500, etc.)
//         else if (input.match(/^[+-]\d+$/)) {
//           const amount = parseInt(input);
//           newPrice = product.basePrice + amount;
//         }

//         return {
//           ...product,
//           sellingPrice: Math.max(0, newPrice), 
//             isEdited: true, // 👈 bulk = sab edited
// // Prevent negative prices
//         };
//       })
//     );

//     // Clear input after applying
//     setBulkPriceInput("");
//   }

//   /* ======================
//      SYNC BUTTON
//   ====================== */
//   async function handleSync() {
//     setSyncStatus("syncing");
//     setSyncProgress(0);
//     setErrorMessage("");

//     try {
//       // 1️⃣ ADD ALL NEW PRODUCTS
// const newProducts = products.filter(
//   (p) => p.status === "NEW" && p.isEdited && p.sellingPrice !== null
// );

//       if (newProducts.length > 0) {
//         for (let i = 0; i < newProducts.length; i++) {
//           const p = newProducts[i];

//           const res = await fetch("/api/shopify/create-product", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               title: p.title,
//               price: p.sellingPrice,
//               compareAtPrice: p.basePrice,
//               images: p.images,
//               videos: p.videos,
//               certificateUrl: p.certificateUrl,
//             }),
//           });

//           if (!res.ok) {
//             const error = await res.json();
//             throw new Error(
//               `Failed to create "${p.title}": ${JSON.stringify(error)}`
//             );
//           }

//           setSyncProgress(((i + 1) / newProducts.length) * 100);
//         }
//       }

//       // 2️⃣ SHOW MODAL FOR EXISTING
//       const existingProducts = products.filter((p) => p.status === "EXISTS");
      
//       if (existingProducts.length > 0) {
//         setShowModal(true);
//         setSyncStatus("idle");
//       } else {
//         setSyncStatus("success");
//         setTimeout(() => {
//           setSyncStatus("idle");
//           loadProducts(); // Refresh data
//         }, 2000);
//       }
//     } catch (error) {
//       console.error("Sync error:", error);
//       setErrorMessage(
//         error instanceof Error ? error.message : "Sync failed"
//       );
//       setSyncStatus("error");
//     }
//   }

//   /* ======================
//      UPDATE EXISTING PRICES
//   ====================== */
//   async function updateExistingPrices() {
//     setSyncStatus("syncing");
//     setSyncProgress(0);
//     setErrorMessage("");

//     try {
//       const existing = products.filter(
//   (p) =>
//     p.status === "EXISTS" &&
//     p.isEdited &&
//     p.shopifyProductId &&
//     p.sellingPrice !== null
// );


//       for (let i = 0; i < existing.length; i++) {
//         const p = existing[i];

//         const res = await fetch("/api/shopify/update-price", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             productId: p.shopifyProductId,
//             price: p.sellingPrice,
//           }),
//         });

//         if (!res.ok) {
//           const error = await res.json();
//           throw new Error(
//             `Failed to update "${p.title}": ${JSON.stringify(error)}`
//           );
//         }

//         setSyncProgress(((i + 1) / existing.length) * 100);
//       }

//       setShowModal(false);
//       setSyncStatus("success");
      
//       setTimeout(() => {
//         setSyncStatus("idle");
//         loadProducts(); // Refresh data
//       }, 2000);
//     } catch (error) {
//       console.error("Update error:", error);
//       setErrorMessage(
//         error instanceof Error ? error.message : "Update failed"
//       );
//       setSyncStatus("error");
//     }
//   }

//   /* ======================
//      COMPUTED VALUES
//   ====================== */
//   const newCount = products.filter((p) => p.status === "NEW").length;
//   const existingCount = products.filter((p) => p.status === "EXISTS").length;
//  const priceChanges = products.filter(
//   (p) =>
//     p.status === "EXISTS" &&
//     p.sellingPrice !== null &&          // 👈 MOST IMPORTANT
//     p.shopifyPrice !== null &&
//     p.sellingPrice !== p.shopifyPrice
// ).length;

//   /* ======================
//      RENDER
//   ====================== */
//   if (loading) {
//     return (
//       <div className="p-6 flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading products...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <div className="mb-6">
//         <h1 className="text-2xl font-bold mb-2">Product Sync Dashboard</h1>
//         <p className="text-gray-600">
//           Compare and sync products from BrahmaGems to Shopify
//         </p>
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-3 gap-4 mb-6">
//         <div className="bg-blue-50 p-4 rounded-lg">
//           <div className="text-2xl font-bold text-blue-600">{newCount}</div>
//           <div className="text-sm text-gray-600">New Products</div>
//         </div>
//         <div className="bg-green-50 p-4 rounded-lg">
//           <div className="text-2xl font-bold text-green-600">
//             {existingCount}
//           </div>
//           <div className="text-sm text-gray-600">Existing Products</div>
//         </div>
//         <div className="bg-orange-50 p-4 rounded-lg">
//           <div className="text-2xl font-bold text-orange-600">
//             {priceChanges}
//           </div>
//           <div className="text-sm text-gray-600">Price Changes</div>
//         </div>
//       </div>

//       {/* 🆕 BULK PRICE CALCULATOR */}
//       <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-5 rounded-lg mb-6 border border-purple-200">
//         <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
//           🧮 Bulk Price Calculator
//         </h2>
        
//         <div className="flex gap-3 items-start">
//           <div className="flex-1">
//             <input
//               type="text"
//               value={bulkPriceInput}
//               onChange={(e) => setBulkPriceInput(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && applyBulkPrice()}
//               placeholder="e.g., 2x, 10%, +5000, -10%"
//               className="w-full border-2 border-purple-300 rounded-lg px-4 py-2 text-lg focus:border-purple-500 focus:outline-none"
//             />
//             <div className="text-xs text-gray-600 mt-2 flex flex-wrap gap-3">
//               <span>📊 <strong>2x</strong> = Double price</span>
//               <span>📈 <strong>10%</strong> = Add 10%</span>
//               <span>📉 <strong>-5%</strong> = Reduce 5%</span>
//               <span>➕ <strong>+5000</strong> = Add ₹5000</span>
//               <span>➖ <strong>-1000</strong> = Reduce ₹1000</span>
//             </div>
//           </div>
          
//           <button
//             onClick={applyBulkPrice}
//             disabled={!bulkPriceInput.trim()}
//             className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold whitespace-nowrap"
//           >
//             Apply to All
//           </button>
//         </div>
//       </div>

//       {/* Error Message */}
//       {errorMessage && (
//         <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
//           <div className="flex items-center justify-between">
//             <span>{errorMessage}</span>
//             <button
//               onClick={() => setErrorMessage("")}
//               className="text-red-700 hover:text-red-900"
//             >
//               ✕
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Success Message */}
//       {syncStatus === "success" && (
//         <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
//           ✓ Sync completed successfully!
//         </div>
//       )}

//       {/* Sync Button */}
//       <div className="mb-4 flex gap-2">
//         <button
//           onClick={handleSync}
//           disabled={syncStatus === "syncing"}
//           className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
//         >
//           {syncStatus === "syncing" ? (
//             <>
//               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//               Syncing... {Math.round(syncProgress)}%
//             </>
//           ) : (
//             <>🔄 Sync Products</>
//           )}
//         </button>

//         <button
//           onClick={loadProducts}
//           disabled={syncStatus === "syncing"}
//           className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 disabled:opacity-50"
//         >
//           🔃 Refresh
//         </button>
//       </div>

//       {/* Table */}
//       <div className="border rounded-lg overflow-hidden">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="border-b p-3 text-left font-semibold">Product</th>
//                <th className="border-b p-3 text-center font-semibold">
//                 Shopify Price
//               </th>
//               <th className="border-b p-3 text-center font-semibold">
//                 Third Party Api Price
//               </th>
             
//               <th className="border-b p-3 text-center font-semibold">
//                 New Price
//               </th>
//               <th className="border-b p-3 text-center font-semibold">Status</th>
//             </tr>
//           </thead>
//           <tbody>
//             {products.length === 0 ? (
//               <tr>
//                 <td colSpan={5} className="p-8 text-center text-gray-500">
//                   No products found
//                 </td>
//               </tr>
//             ) : (
//               products.map((p) => {
//                const priceChanged =
//   p.sellingPrice !== null &&
//   p.shopifyPrice !== null &&
//   p.sellingPrice !== p.shopifyPrice;

//                 return (
//                   <tr key={p.id} className="hover:bg-gray-50">
//                     <td className="border-b p-3">
//                       <div className="font-medium">{p.title}</div>
//                       <div className="text-xs text-gray-500 mt-1 flex gap-3">
//                         {p.images.length > 0 && (
//                           <span>📷 {p.images.length} image(s)</span>
//                         )}
//                         {p.videos.length > 0 && (
//                           <span>🎥 {p.videos.length} video(s)</span>
//                         )}
//                         {p.certificateUrl && <span>📜 Certificate</span>}
//                       </div>
//                     </td>
// <td className="border-b p-3 text-center">
//                       {p.shopifyPrice !== null && p.shopifyPrice > 0 ? (
//                         <span className="font-medium text-green-700">
//                           ₹{p.shopifyPrice.toLocaleString("en-IN")}
//                         </span>
//                       ) : (
//                         <span className="text-gray-400">—</span>
//                       )}
//                     </td>

//                     <td className="border-b p-3 text-center">
//                       <span className="font-medium">
//                         ₹{p.basePrice.toLocaleString("en-IN")}
//                       </span>
//                     </td>

                    
//                     <td className="border-b p-3 text-center">
//                       <input
//                         type="number"
//                         value={p.sellingPrice}
//                         onChange={(e) =>
//   setProducts((prev) =>
//     prev.map((x) =>
//       x.id === p.id
//         ? {
//             ...x,
//             sellingPrice:
//               e.target.value === "" ? null : Number(e.target.value),
//             isEdited: e.target.value !== "", // 👈 yahin magic
//           }
//         : x
//     )
//   )
// }


//                         className={`border px-3 py-1 w-32 rounded text-center ${
//                           priceChanged
//                             ? "border-orange-400 bg-orange-50"
//                             : "border-gray-300"
//                         }`}
//                       />
//                       {priceChanged && (
//                         <div className="text-xs text-orange-600 mt-1">
//                           Changed
//                         </div>
//                       )}
//                     </td>

//                     <td className="border-b p-3 text-center">
//                       <span
//                         className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
//                           p.status === "NEW"
//                             ? "bg-blue-100 text-blue-700"
//                             : "bg-green-100 text-green-700"
//                         }`}
//                       >
//                         {p.status === "NEW" ? "🆕 NEW" : "♻️ EXISTS"}
//                       </span>
//                     </td>
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* ======================
//           PRICE UPDATE MODAL
//       ====================== */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white p-6 w-96 rounded-lg shadow-xl">
//             <h2 className="font-bold text-lg mb-3">Update Existing Products</h2>
//             <p className="text-sm text-gray-600 mb-4">
//               {priceChanges > 0
//                 ? `${priceChanges} product(s) have price changes. Do you want to update them in Shopify?`
//                 : "No price changes detected for existing products."}
//             </p>

//             <div className="flex gap-2 justify-end">
//               {priceChanges > 0 && (
//                 <button
//                   onClick={updateExistingPrices}
//                   disabled={syncStatus === "syncing"}
//                   className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
//                 >
//                   {syncStatus === "syncing" ? (
//                     <>
//                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//                       Updating... {Math.round(syncProgress)}%
//                     </>
//                   ) : (
//                     "Update Prices"
//                   )}
//                 </button>
//               )}
//               <button
//                 onClick={() => {
//                   setShowModal(false);
//                   setSyncStatus("idle");
//                 }}
//                 disabled={syncStatus === "syncing"}
//                 className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 disabled:opacity-50"
//               >
//                 {priceChanges > 0 ? "Skip" : "Close"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }




"use client";

import { useEffect, useState } from "react";

/* ======================
   TYPES
====================== */
type Product = {
  id: string;
  title: string;
  basePrice: number;
  shopifyPrice: number | null;
  sellingPrice: number | null;
  isEdited?: boolean;
  images: string[];
  videos: string[];
  certificateUrl?: string | null;
  status: "NEW" | "EXISTS";
  shopifyProductId?: string;

  // ✅ Naye fields add kar
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

type SyncStatus = "idle" | "syncing" | "success" | "error";

/* ======================
   PAGE
====================== */
export default function CompareProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncProgress, setSyncProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  // 🆕 Bulk price calculator
  const [bulkPriceInput, setBulkPriceInput] = useState<string>("");

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
      const res = await fetch("/api/compare-data");
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log("📦 Loaded products:", data.products);
setProducts(
  (data.products ?? []).map((p: Product) => ({
    ...p,
    sellingPrice: null,
    isEdited: false,
  }))
);
    } catch (error) {
      console.error("Failed to load compare data:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  }

  /* ======================
     🆕 BULK PRICE CALCULATOR
  ====================== */
 function applyBulkPrice() {
  const input = bulkPriceInput.trim().replace(/\s+/g, "");
  if (!input) return;

  // Tokenize formula into steps: 2x, +10%, -20%, +500, -1000, 1.5x, etc.
  const tokenRegex = /([+-]?(?:\d+\.?\d*x|\d+\.?\d*%|\d+))/gi;
  const tokens = input.match(tokenRegex);

  if (!tokens) return;

  setProducts((prevProducts) =>
    prevProducts.map((product) => {
      let price = product.basePrice;

      for (const token of tokens) {
        const clean = token.replace(/[()]/g, "");
        const sign = clean.startsWith("-") ? -1 : 1;
        const abs = clean.replace(/^[+-]/, "");

        if (/^\d+\.?\d*x$/i.test(abs)) {
          // Multiplier: 2x, 1.5x
          price = price * parseFloat(abs);
        } else if (/^\d+\.?\d*%$/.test(abs)) {
          // Percentage: +10%, -20%
          price = price + sign * price * (parseFloat(abs) / 100);
        } else if (/^\d+$/.test(abs)) {
          // Fixed amount: +5000, -1000
          price = price + sign * parseInt(abs);
        }
      }

      return {
        ...product,
        sellingPrice: Math.max(0, Math.round(price)),
        isEdited: true,
      };
    })
  );

  setBulkPriceInput("");
}

  /* ======================
     SYNC BUTTON
  ====================== */
  async function handleSync() {
    setSyncStatus("syncing");
    setSyncProgress(0);
    setErrorMessage("");

    try {
      // 1️⃣ ADD ALL NEW PRODUCTS
const newProducts = products.filter(
  (p) => p.status === "NEW" && p.isEdited && p.sellingPrice !== null
);

      if (newProducts.length > 0) {
        for (let i = 0; i < newProducts.length; i++) {
          const p = newProducts[i];

          const res = await fetch("/api/shopify/create-product", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
  product_name: p.title,
  price: p.sellingPrice,
  mrp: p.basePrice,
  image_url: p.images[0] ?? null,
  images: p.images.slice(1),
  video_url: p.videos[0] ?? null,
  certificate_url: p.certificateUrl ?? null,

  // ✅ Ye naye fields
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
          });

          if (!res.ok) {
            const error = await res.json();
            throw new Error(
              `Failed to create "${p.title}": ${JSON.stringify(error)}`
            );
          }

          setSyncProgress(((i + 1) / newProducts.length) * 100);
        }
      }

      // 2️⃣ SHOW MODAL FOR EXISTING
      const existingProducts = products.filter((p) => p.status === "EXISTS");
      
      if (existingProducts.length > 0) {
        setShowModal(true);
        setSyncStatus("idle");
      } else {
        setSyncStatus("success");
        setTimeout(() => {
          setSyncStatus("idle");
          loadProducts(); // Refresh data
        }, 2000);
      }
    } catch (error) {
      console.error("Sync error:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Sync failed"
      );
      setSyncStatus("error");
    }
  }

  /* ======================
     UPDATE EXISTING PRICES
  ====================== */
  async function updateExistingPrices() {
    setSyncStatus("syncing");
    setSyncProgress(0);
    setErrorMessage("");

    try {
    const existing = products.filter(
  (p) =>
    p.status === "EXISTS" &&
    p.isEdited &&                          // 👈 yahi missing tha
    p.shopifyProductId &&
    p.sellingPrice !== null &&
    p.sellingPrice !== p.shopifyPrice      // 👈 extra safety: actual change
);


      for (let i = 0; i < existing.length; i++) {
        const p = existing[i];

        const res = await fetch("/api/shopify/update-price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: p.shopifyProductId,
            price: p.sellingPrice,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(
            `Failed to update "${p.title}": ${JSON.stringify(error)}`
          );
        }

        setSyncProgress(((i + 1) / existing.length) * 100);
      }

      setShowModal(false);
      setSyncStatus("success");
      
      setTimeout(() => {
        setSyncStatus("idle");
        loadProducts(); // Refresh data
      }, 2000);
    } catch (error) {
      console.error("Update error:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Update failed"
      );
      setSyncStatus("error");
    }
  }

  /* ======================
     COMPUTED VALUES
  ====================== */
  const newCount = products.filter((p) => p.status === "NEW").length;
  const existingCount = products.filter((p) => p.status === "EXISTS").length;
 const priceChanges = products.filter(
  (p) =>
    p.status === "EXISTS" &&
    p.sellingPrice !== null &&          // 👈 MOST IMPORTANT
    p.shopifyPrice !== null &&
    p.sellingPrice !== p.shopifyPrice
).length;

  /* ======================
     RENDER
  ====================== */
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Product Sync Dashboard</h1>
        <p className="text-gray-600">
          Compare and sync products from BrahmaGems to Shopify
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{newCount}</div>
          <div className="text-sm text-gray-600">New Products</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {existingCount}
          </div>
          <div className="text-sm text-gray-600">Existing Products</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {priceChanges}
          </div>
          <div className="text-sm text-gray-600">Price Changes</div>
        </div>
      </div>

      {/* 🆕 BULK PRICE CALCULATOR */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-5 rounded-lg mb-6 border border-purple-200">
        <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
          🧮 Bulk Price Calculator
        </h2>
        
        <div className="flex gap-3 items-start">
          <div className="flex-1">
            <input
              type="text"
              value={bulkPriceInput}
              onChange={(e) => setBulkPriceInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyBulkPrice()}
              placeholder="e.g., 2x, 10%, +5000, -10%"
              className="w-full border-2 border-purple-300 rounded-lg px-4 py-2 text-lg focus:border-purple-500 focus:outline-none"
            />
            <div className="text-xs text-gray-600 mt-2 flex flex-wrap gap-3">
              <span>📊 <strong>2x</strong> = Double price</span>
              <span>📈 <strong>10%</strong> = Add 10%</span>
              <span>📉 <strong>-5%</strong> = Reduce 5%</span>
              <span>➕ <strong>+5000</strong> = Add ₹5000</span>
              <span>➖ <strong>-1000</strong> = Reduce ₹1000</span>
            </div>
          </div>
          
          <button
            onClick={applyBulkPrice}
            disabled={!bulkPriceInput.trim()}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold whitespace-nowrap"
          >
            Apply to All
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage("")}
              className="text-red-700 hover:text-red-900"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {syncStatus === "success" && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          ✓ Sync completed successfully!
        </div>
      )}

      {/* Sync Button */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={handleSync}
          disabled={syncStatus === "syncing"}
          className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {syncStatus === "syncing" ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Syncing... {Math.round(syncProgress)}%
            </>
          ) : (
            <>🔄 Sync Products</>
          )}
        </button>

        <button
          onClick={loadProducts}
          disabled={syncStatus === "syncing"}
          className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          🔃 Refresh
        </button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="border-b p-3 text-left font-semibold">Product</th>
               <th className="border-b p-3 text-center font-semibold">
                Shopify Price
              </th>
              <th className="border-b p-3 text-center font-semibold">
                Third Party Api Price
              </th>
             
              <th className="border-b p-3 text-center font-semibold">
                New Price
              </th>
              <th className="border-b p-3 text-center font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              products.map((p) => {
               const priceChanged =
  p.sellingPrice !== null &&
  p.shopifyPrice !== null &&
  p.sellingPrice !== p.shopifyPrice;

                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="border-b p-3">
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-gray-500 mt-1 flex gap-3">
                        {p.images.length > 0 && (
                          <span>📷 {p.images.length} image(s)</span>
                        )}
                        {p.videos.length > 0 && (
                          <span>🎥 {p.videos.length} video(s)</span>
                        )}
                        {p.certificateUrl && <span>📜 Certificate</span>}
                      </div>
                    </td>
<td className="border-b p-3 text-center">
                      {p.shopifyPrice !== null && p.shopifyPrice > 0 ? (
                        <span className="font-medium text-green-700">
                          ₹{p.shopifyPrice.toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="border-b p-3 text-center">
                      <span className="font-medium">
                        ₹{p.basePrice.toLocaleString("en-IN")}
                      </span>
                    </td>

                    
                    <td className="border-b p-3 text-center">
                      <input
                        type="number"
value={p.sellingPrice ?? ""}
                        onChange={(e) =>
  setProducts((prev) =>
    prev.map((x) =>
      x.id === p.id
        ? {
            ...x,
            sellingPrice:
              e.target.value === "" ? null : Number(e.target.value),
            isEdited: e.target.value !== "", // 👈 yahin magic
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
                      {priceChanged && (
                        <div className="text-xs text-orange-600 mt-1">
                          Changed
                        </div>
                      )}
                    </td>

                    <td className="border-b p-3 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          p.status === "NEW"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {p.status === "NEW" ? "🆕 NEW" : "♻️ EXISTS"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ======================
          PRICE UPDATE MODAL
      ====================== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 w-96 rounded-lg shadow-xl">
            <h2 className="font-bold text-lg mb-3">Update Existing Products</h2>
            <p className="text-sm text-gray-600 mb-4">
              {priceChanges > 0
                ? `${priceChanges} product(s) have price changes. Do you want to update them in Shopify?`
                : "No price changes detected for existing products."}
            </p>

            <div className="flex gap-2 justify-end">
              {priceChanges > 0 && (
                <button
                  onClick={updateExistingPrices}
                  disabled={syncStatus === "syncing"}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  {syncStatus === "syncing" ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating... {Math.round(syncProgress)}%
                    </>
                  ) : (
                    "Update Prices"
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  setShowModal(false);
                  setSyncStatus("idle");
                }}
                disabled={syncStatus === "syncing"}
                className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                {priceChanges > 0 ? "Skip" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
