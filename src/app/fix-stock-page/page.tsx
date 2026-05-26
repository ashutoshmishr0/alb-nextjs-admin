// "use client";

// import { useEffect, useState } from "react";

// type Product = {
//   productId: string;
//   variantId: string;
//   title: string;
//   sku: string | null;
//   stock: number;
//   shopifyStatus: string;
// };

// type Stage = "idle" | "fetching" | "ready" | "fixing" | "done" | "error";

// export default function FixStockPage() {
//   const [products, setProducts] = useState<Product[]>([]);
//   const [stage, setStage] = useState<Stage>("idle");
//   const [progress, setProgress] = useState(0);
//   const [progressText, setProgressText] = useState("");
//   const [errorMsg, setErrorMsg] = useState("");

//   // Products jinhe fix karna hai (stock !== 1)
//   const toFix = products.filter((p) => p.stock !== 1);
//   const alreadyOk = products.filter((p) => p.stock === 1);

//   /* ======================
//      FETCH PRODUCTS
//   ====================== */
//   async function fetchProducts() {
//     try {
//       setStage("fetching");
//       setErrorMsg("");
//       setProducts([]);

//       const res = await fetch(
//         "/api/shopify/products/by-vendor?vendor=Brahmagems"
//       );

//       if (!res.ok) throw new Error(`HTTP ${res.status}`);

//       const data = await res.json();
//       setProducts(data.products ?? []);
//       setStage("ready");
//     } catch (err) {
//       setErrorMsg(err instanceof Error ? err.message : "Fetch failed");
//       setStage("error");
//     }
//   }

//   /* ======================
//      FIX STOCK
//   ====================== */
//   async function fixStock() {
//     try {
//       setStage("fixing");
//       setProgress(0);

//       const variantIds = toFix.map((p) => p.variantId);

//       if (variantIds.length === 0) {
//         setStage("done");
//         return;
//       }

//       // 20-20 ke batches
//       const BATCH = 20;
//       let done = 0;

//       for (let i = 0; i < variantIds.length; i += BATCH) {
//         const batch = variantIds.slice(i, i + BATCH);

//         const res = await fetch("/api/shopify/update-stock", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ variantIds: batch }),
//         });

//         if (!res.ok) throw new Error(`Batch failed at ${i}`);

//         done += batch.length;
//         setProgress(Math.round((done / variantIds.length) * 100));
//         setProgressText(`Updated ${done} / ${variantIds.length}`);
//       }

//       setStage("done");
//     } catch (err) {
//       setErrorMsg(err instanceof Error ? err.message : "Fix failed");
//       setStage("error");
//     }
//   }

//   /* ======================
//      UI
//   ====================== */
//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         background: "#0a0a0a",
//         color: "#f0f0f0",
//         fontFamily: "'DM Mono', 'Courier New', monospace",
//         padding: "48px 32px",
//         maxWidth: "860px",
//         margin: "0 auto",
//       }}
//     >
//       {/* Header */}
//       <div style={{ marginBottom: "40px" }}>
//         <div
//           style={{
//             fontSize: "11px",
//             letterSpacing: "4px",
//             color: "#666",
//             textTransform: "uppercase",
//             marginBottom: "8px",
//           }}
//         >
//           Shopify Inventory Tool
//         </div>
//         <h1
//           style={{
//             fontSize: "32px",
//             fontWeight: "700",
//             margin: 0,
//             letterSpacing: "-1px",
//           }}
//         >
//           Fix Stock → 1
//         </h1>
//         <p style={{ color: "#888", marginTop: "8px", fontSize: "14px" }}>
//           Brahmagems vendor ke saare products fetch karo, phir stock 1 karo
//         </p>
//       </div>

//       {/* Step 1 — Fetch */}
//       <div
//         style={{
//           background: "#141414",
//           border: "1px solid #222",
//           borderRadius: "12px",
//           padding: "24px",
//           marginBottom: "20px",
//         }}
//       >
//         <div
//           style={{
//             fontSize: "11px",
//             letterSpacing: "3px",
//             color: "#555",
//             marginBottom: "12px",
//           }}
//         >
//           STEP 01
//         </div>
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             flexWrap: "wrap",
//             gap: "12px",
//           }}
//         >
//           <div>
//             <div style={{ fontSize: "16px", fontWeight: "600" }}>
//               Fetch Products from Shopify
//             </div>
//             <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
//               vendor=Brahmagems ke saare products
//             </div>
//           </div>
//           <button
//             onClick={fetchProducts}
//             disabled={stage === "fetching" || stage === "fixing"}
//             style={{
//               background: stage === "fetching" ? "#222" : "#f0f0f0",
//               color: stage === "fetching" ? "#666" : "#0a0a0a",
//               border: "none",
//               borderRadius: "8px",
//               padding: "10px 24px",
//               fontSize: "13px",
//               fontWeight: "600",
//               cursor:
//                 stage === "fetching" || stage === "fixing"
//                   ? "not-allowed"
//                   : "pointer",
//               letterSpacing: "0.5px",
//               fontFamily: "inherit",
//             }}
//           >
//             {stage === "fetching" ? "Fetching..." : "Fetch Products"}
//           </button>
//         </div>

//         {/* Stats after fetch */}
//         {products.length > 0 && (
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(3, 1fr)",
//               gap: "12px",
//               marginTop: "20px",
//             }}
//           >
//             {[
//               {
//                 label: "Total Products",
//                 value: products.length,
//                 color: "#888",
//               },
//               {
//                 label: "Need Fix (stock ≠ 1)",
//                 value: toFix.length,
//                 color: "#f97316",
//               },
//               {
//                 label: "Already OK (stock = 1)",
//                 value: alreadyOk.length,
//                 color: "#22c55e",
//               },
//             ].map((stat) => (
//               <div
//                 key={stat.label}
//                 style={{
//                   background: "#0a0a0a",
//                   border: "1px solid #1e1e1e",
//                   borderRadius: "8px",
//                   padding: "14px 16px",
//                 }}
//               >
//                 <div
//                   style={{
//                     fontSize: "24px",
//                     fontWeight: "700",
//                     color: stat.color,
//                   }}
//                 >
//                   {stat.value}
//                 </div>
//                 <div style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>
//                   {stat.label}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Step 2 — Fix */}
//       {(stage === "ready" || stage === "fixing" || stage === "done") && (
//         <div
//           style={{
//             background: "#141414",
//             border: "1px solid #222",
//             borderRadius: "12px",
//             padding: "24px",
//             marginBottom: "20px",
//           }}
//         >
//           <div
//             style={{
//               fontSize: "11px",
//               letterSpacing: "3px",
//               color: "#555",
//               marginBottom: "12px",
//             }}
//           >
//             STEP 02
//           </div>
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "space-between",
//               flexWrap: "wrap",
//               gap: "12px",
//             }}
//           >
//             <div>
//               <div style={{ fontSize: "16px", fontWeight: "600" }}>
//                 Update Stock → 1
//               </div>
//               <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
//                 {toFix.length} products update honge · 20-20 ke batches mein
//               </div>
//             </div>
//             <button
//               onClick={fixStock}
//               disabled={stage === "fixing" || stage === "done" || toFix.length === 0}
//               style={{
//                 background:
//                   stage === "done"
//                     ? "#166534"
//                     : stage === "fixing"
//                     ? "#222"
//                     : toFix.length === 0
//                     ? "#222"
//                     : "#f97316",
//                 color:
//                   stage === "fixing" || toFix.length === 0 ? "#666" : "#fff",
//                 border: "none",
//                 borderRadius: "8px",
//                 padding: "10px 24px",
//                 fontSize: "13px",
//                 fontWeight: "600",
//                 cursor:
//                   stage === "fixing" || stage === "done" || toFix.length === 0
//                     ? "not-allowed"
//                     : "pointer",
//                 letterSpacing: "0.5px",
//                 fontFamily: "inherit",
//               }}
//             >
//               {stage === "done"
//                 ? "✓ Done!"
//                 : stage === "fixing"
//                 ? `Fixing... ${progress}%`
//                 : toFix.length === 0
//                 ? "Nothing to fix"
//                 : `Fix ${toFix.length} Products`}
//             </button>
//           </div>

//           {/* Progress bar */}
//           {stage === "fixing" && (
//             <div style={{ marginTop: "20px" }}>
//               <div
//                 style={{
//                   width: "100%",
//                   height: "6px",
//                   background: "#1e1e1e",
//                   borderRadius: "99px",
//                   overflow: "hidden",
//                 }}
//               >
//                 <div
//                   style={{
//                     width: `${progress}%`,
//                     height: "100%",
//                     background: "#f97316",
//                     borderRadius: "99px",
//                     transition: "width 0.3s ease",
//                   }}
//                 />
//               </div>
//               <div
//                 style={{
//                   fontSize: "12px",
//                   color: "#666",
//                   marginTop: "8px",
//                 }}
//               >
//                 {progressText}
//               </div>
//             </div>
//           )}

//           {/* Done message */}
//           {stage === "done" && (
//             <div
//               style={{
//                 marginTop: "16px",
//                 background: "#052e16",
//                 border: "1px solid #166534",
//                 borderRadius: "8px",
//                 padding: "12px 16px",
//                 fontSize: "13px",
//                 color: "#22c55e",
//               }}
//             >
//               ✅ {toFix.length} products ka stock successfully 1 kar diya gaya!
//             </div>
//           )}
//         </div>
//       )}

//       {/* Error */}
//       {stage === "error" && (
//         <div
//           style={{
//             background: "#2d0a0a",
//             border: "1px solid #7f1d1d",
//             borderRadius: "8px",
//             padding: "12px 16px",
//             fontSize: "13px",
//             color: "#f87171",
//             marginBottom: "20px",
//           }}
//         >
//           ❌ {errorMsg}
//         </div>
//       )}

//       {/* Product list preview */}
//       {toFix.length > 0 && stage === "ready" && (
//         <div
//           style={{
//             background: "#141414",
//             border: "1px solid #222",
//             borderRadius: "12px",
//             overflow: "hidden",
//           }}
//         >
//           <div
//             style={{
//               padding: "16px 20px",
//               borderBottom: "1px solid #1e1e1e",
//               fontSize: "12px",
//               color: "#555",
//               letterSpacing: "2px",
//             }}
//           >
//             PRODUCTS TO FIX — {toFix.length} total (first 50 shown)
//           </div>
//           <div style={{ maxHeight: "360px", overflowY: "auto" }}>
//             <table style={{ width: "100%", borderCollapse: "collapse" }}>
//               <thead>
//                 <tr style={{ background: "#0f0f0f" }}>
//                   {["Title", "SKU", "Stock", "Status"].map((h) => (
//                     <th
//                       key={h}
//                       style={{
//                         padding: "10px 16px",
//                         textAlign: "left",
//                         fontSize: "10px",
//                         letterSpacing: "2px",
//                         color: "#444",
//                         fontWeight: "600",
//                         borderBottom: "1px solid #1e1e1e",
//                       }}
//                     >
//                       {h}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {toFix.slice(0, 50).map((p) => (
//                   <tr
//                     key={p.variantId}
//                     style={{ borderBottom: "1px solid #1a1a1a" }}
//                   >
//                     <td
//                       style={{
//                         padding: "10px 16px",
//                         fontSize: "13px",
//                         color: "#ccc",
//                         maxWidth: "280px",
//                         overflow: "hidden",
//                         textOverflow: "ellipsis",
//                         whiteSpace: "nowrap",
//                       }}
//                     >
//                       {p.title}
//                     </td>
//                     <td
//                       style={{
//                         padding: "10px 16px",
//                         fontSize: "12px",
//                         color: "#666",
//                       }}
//                     >
//                       {p.sku ?? "—"}
//                     </td>
//                     <td style={{ padding: "10px 16px" }}>
//                       <span
//                         style={{
//                           background:
//                             p.stock === 1000 ? "#431407" : "#1c1917",
//                           color: p.stock === 1000 ? "#f97316" : "#a8a29e",
//                           padding: "2px 8px",
//                           borderRadius: "4px",
//                           fontSize: "12px",
//                           fontWeight: "600",
//                         }}
//                       >
//                         {p.stock}
//                       </span>
//                     </td>
//                     <td
//                       style={{
//                         padding: "10px 16px",
//                         fontSize: "11px",
//                         color:
//                           p.shopifyStatus === "ACTIVE" ? "#22c55e" : "#f59e0b",
//                       }}
//                     >
//                       {p.shopifyStatus}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



"use client";

import { useState } from "react";

const TAG_MAP: Record<string, string> = {
  "amethyst": "Amethyst (Jamunia)",
  "jamunia": "Amethyst (Jamunia)",
  "blue corundum": "Blue Corundum",
  "blue topaz": "Blue Topaz",
  "brown sapphire": "Brown Sapphire",
  "cats eye": "Cats Eye (Lehsunia)",
  "lehsunia": "Cats Eye (Lehsunia)",
  "citrine": "Citrine (Sunela)",
  "sunela": "Citrine (Sunela)",
  "emerald": "Emerald (Panna)",
  "panna": "Emerald (Panna)",
  "green onyx": "Green Onyx",
  "green tourmaline": "Green Tourmaline",
  "hessonite": "Hessonite (Gomed)",
  "gomed": "Hessonite (Gomed)",
  "iolite": "Iolite (Neeli)",
  "neeli": "Iolite (Neeli)",
  "moonstone": "Moonstone",
  "alexandrite": "Natural Alexandrite",
  "diamond": "Natural Diamond",
  "opal": "Opal",
  "padparadscha": "Padparadscha Stone",
  "pearl": "Pearl (Moti)",
  "moti": "Pearl (Moti)",
  "peridot": "Peridot Stone",
  "pink sapphire": "Pink Sapphire",
  "pitambari": "Pitambari",
  "red coral": "Red Coral (Moonga)",
  "moonga": "Red Coral (Moonga)",
  "ruby": "Ruby (Manik)",
  "manik": "Ruby (Manik)",
  "spinel": "Spinel Stone",
  "sulemani black": "Sulemani Black Hakik",
  "sulemani red": "Sulemani Red Hakik",
  "turquoise": "Turquoise (Feroza)",
  "feroza": "Turquoise (Feroza)",
  "white sapphire": "White Sapphire (Safed Pukhraj)",
  "safed pukhraj": "White Sapphire (Safed Pukhraj)",
  "white topaz": "White Topaz",
  "yellow sapphire": "Yellow Sapphire (Pukhraj)",
  "pukhraj": "Yellow Sapphire (Pukhraj)",
  "yellow topaz": "Yellow Topaz",
  "zircon": "Zircon (Jarkan)",
  "jarkan": "Zircon (Jarkan)",
};

function getTagFromTitle(title: string): string | null {
  const lower = title.toLowerCase();
  for (const [keyword, tag] of Object.entries(TAG_MAP)) {
    if (lower.includes(keyword)) return tag;
  }
  return null;
}

type Product = {
  productId: string;
  variantId: string;
  title: string;
  sku: string | null;
  stock: number;
  shopifyStatus: string;
  tags: string[];
  detectedTag: string | null;
  hasTag: boolean;
};

type Stage = "idle" | "fetching" | "ready" | "pushing" | "done" | "error";
type TabView = "missing" | "hasTag" | "noMatch";

export default function ManageTagsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [tab, setTab] = useState<TabView>("missing");
  const [pushResult, setPushResult] = useState<{ updated: number; skipped: number } | null>(null);

  /* ====================== FETCH ====================== */
  async function fetchProducts() {
    try {
      setStage("fetching");
      setErrorMsg("");
      setProducts([]);
      setPushResult(null);

      const res = await fetch("/api/shopify/products/by-vendor?vendor=Brahmagems");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      const mapped: Product[] = (data.products ?? []).map((p: any) => {
        const detectedTag = getTagFromTitle(p.title);
        const hasTag = detectedTag ? p.tags.includes(detectedTag) : false;
        return { ...p, detectedTag, hasTag };
      });

      setProducts(mapped);
      setStage("ready");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Fetch failed");
      setStage("error");
    }
  }

  /* ====================== PUSH TAGS ====================== */
  async function pushTags() {
    try {
      setStage("pushing");
      setProgress(0);
      setPushResult(null);

      // Only products jinhe tag chahiye aur abhi nahi hai
      const toUpdate = products.filter((p) => p.detectedTag && !p.hasTag);

      if (toUpdate.length === 0) {
        setStage("done");
        setPushResult({ updated: 0, skipped: products.length });
        return;
      }

      const BATCH = 20;
      let totalUpdated = 0;
      let totalSkipped = 0;
      let done = 0;

      for (let i = 0; i < toUpdate.length; i += BATCH) {
        const batch = toUpdate.slice(i, i + BATCH).map((p) => ({
          productId: p.productId,
          title: p.title,
          tags: p.tags,
        }));

        const res = await fetch("/api/shopify/update-tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ products: batch }),
        });

        if (!res.ok) throw new Error(`Batch failed at ${i}`);

        const result = await res.json();
        totalUpdated += result.updated ?? 0;
        totalSkipped += result.skipped ?? 0;
        done += batch.length;

        setProgress(Math.round((done / toUpdate.length) * 100));
        setProgressText(`Updated ${done} / ${toUpdate.length}`);
      }

      setPushResult({ updated: totalUpdated, skipped: totalSkipped });
      setStage("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Push failed");
      setStage("error");
    }
  }

  /* ====================== STATS ====================== */
  const missingTag = products.filter((p) => p.detectedTag && !p.hasTag);
  const hasTag = products.filter((p) => p.detectedTag && p.hasTag);
  const noMatch = products.filter((p) => !p.detectedTag);

  const currentList =
    tab === "missing" ? missingTag : tab === "hasTag" ? hasTag : noMatch;

  /* ====================== UI ====================== */
  const s = {
    page: {
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#f0f0f0",
      fontFamily: "'DM Mono', 'Courier New', monospace",
      padding: "48px 32px",
      maxWidth: "960px",
      margin: "0 auto",
    } as React.CSSProperties,
    card: {
      background: "#141414",
      border: "1px solid #222",
      borderRadius: "12px",
      padding: "24px",
      marginBottom: "20px",
    } as React.CSSProperties,
    label: {
      fontSize: "11px",
      letterSpacing: "3px",
      color: "#555",
      marginBottom: "12px",
    } as React.CSSProperties,
    btn: (bg: string, disabled?: boolean) =>
      ({
        background: disabled ? "#1a1a1a" : bg,
        color: disabled ? "#444" : "#fff",
        border: "none",
        borderRadius: "8px",
        padding: "10px 24px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        letterSpacing: "0.5px",
      } as React.CSSProperties),
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ fontSize: "11px", letterSpacing: "4px", color: "#666", marginBottom: "8px" }}>
          Shopify Tag Manager
        </div>
        <h1 style={{ fontSize: "32px", fontWeight: "700", margin: 0, letterSpacing: "-1px" }}>
          Manage Product Tags
        </h1>
        <p style={{ color: "#888", marginTop: "8px", fontSize: "14px" }}>
          Title se gemstone tag detect karo — missing tags add karo, existing touch nahi honge
        </p>
      </div>

      {/* Step 1 — Fetch */}
      <div style={s.card}>
        <div style={s.label}>STEP 01</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "600" }}>Fetch Products</div>
            <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
              Brahmagems vendor ke saare products + existing tags
            </div>
          </div>
          <button
            onClick={fetchProducts}
            disabled={stage === "fetching" || stage === "pushing"}
            style={s.btn("#f0f0f0", stage === "fetching" || stage === "pushing")}
          >
            <span style={{ color: stage === "fetching" || stage === "pushing" ? "#444" : "#0a0a0a" }}>
              {stage === "fetching" ? "Fetching..." : "Fetch Products"}
            </span>
          </button>
        </div>

        {/* Stats */}
        {products.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginTop: "20px" }}>
            {[
              { label: "Total", value: products.length, color: "#888" },
              { label: "Tag Missing", value: missingTag.length, color: "#f97316" },
              { label: "Tag Present", value: hasTag.length, color: "#22c55e" },
              { label: "No Match", value: noMatch.length, color: "#6366f1" },
            ].map((stat) => (
              <div key={stat.label} style={{ background: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: "8px", padding: "14px 16px" }}>
                <div style={{ fontSize: "24px", fontWeight: "700", color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 2 — Push */}
      {(stage === "ready" || stage === "pushing" || stage === "done") && (
        <div style={s.card}>
          <div style={s.label}>STEP 02</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "600" }}>Push Missing Tags</div>
              <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
                {missingTag.length} products mein tag add hoga · existing tags safe rahenge
              </div>
            </div>
            <button
              onClick={pushTags}
              disabled={stage === "pushing" || stage === "done" || missingTag.length === 0}
              style={s.btn(
                stage === "done" ? "#166534" : "#f97316",
                stage === "pushing" || stage === "done" || missingTag.length === 0
              )}
            >
              {stage === "done"
                ? "✓ Done!"
                : stage === "pushing"
                ? `Pushing... ${progress}%`
                : missingTag.length === 0
                ? "Nothing to push"
                : `Push ${missingTag.length} Tags`}
            </button>
          </div>

          {/* Progress */}
          {stage === "pushing" && (
            <div style={{ marginTop: "20px" }}>
              <div style={{ width: "100%", height: "6px", background: "#1e1e1e", borderRadius: "99px", overflow: "hidden" }}>
                <div style={{ width: `${progress}%`, height: "100%", background: "#f97316", borderRadius: "99px", transition: "width 0.3s ease" }} />
              </div>
              <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>{progressText}</div>
            </div>
          )}

          {/* Result */}
          {stage === "done" && pushResult && (
            <div style={{ marginTop: "16px", background: "#052e16", border: "1px solid #166534", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", color: "#22c55e" }}>
              ✅ {pushResult.updated} products mein tag add hua · {pushResult.skipped} skipped
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {stage === "error" && (
        <div style={{ background: "#2d0a0a", border: "1px solid #7f1d1d", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", color: "#f87171", marginBottom: "20px" }}>
          ❌ {errorMsg}
        </div>
      )}

      {/* Product List */}
      {products.length > 0 && (
        <div style={{ background: "#141414", border: "1px solid #222", borderRadius: "12px", overflow: "hidden" }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #1e1e1e" }}>
            {([
              { key: "missing", label: `Tag Missing (${missingTag.length})`, color: "#f97316" },
              { key: "hasTag", label: `Tag Present (${hasTag.length})`, color: "#22c55e" },
              { key: "noMatch", label: `No Match (${noMatch.length})`, color: "#6366f1" },
            ] as { key: TabView; label: string; color: string }[]).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: "14px 20px",
                  fontSize: "12px",
                  fontFamily: "inherit",
                  fontWeight: "600",
                  border: "none",
                  borderBottom: tab === t.key ? `2px solid ${t.color}` : "2px solid transparent",
                  background: "transparent",
                  color: tab === t.key ? t.color : "#444",
                  cursor: "pointer",
                  letterSpacing: "0.5px",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ maxHeight: "480px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#0f0f0f" }}>
                  {["Title", "Detected Tag", "Existing Tags", "Status"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "10px", letterSpacing: "2px", color: "#444", fontWeight: "600", borderBottom: "1px solid #1e1e1e" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentList.slice(0, 100).map((p) => (
                  <tr key={p.productId} style={{ borderBottom: "1px solid #1a1a1a" }}>
                    <td style={{ padding: "10px 16px", fontSize: "13px", color: "#ccc", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.title}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      {p.detectedTag ? (
                        <span style={{ background: p.hasTag ? "#052e16" : "#431407", color: p.hasTag ? "#22c55e" : "#f97316", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>
                          {p.detectedTag}
                        </span>
                      ) : (
                        <span style={{ color: "#444", fontSize: "12px" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 16px", maxWidth: "220px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {p.tags.slice(0, 4).map((tag) => (
                          <span key={tag} style={{ background: "#1a1a1a", color: "#666", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}>
                            {tag}
                          </span>
                        ))}
                        {p.tags.length > 4 && (
                          <span style={{ color: "#444", fontSize: "11px", padding: "2px 6px" }}>
                            +{p.tags.length - 4} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: "11px", color: p.shopifyStatus === "ACTIVE" ? "#22c55e" : "#f59e0b" }}>
                      {p.shopifyStatus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {currentList.length > 100 && (
              <div style={{ padding: "12px 16px", fontSize: "12px", color: "#444", borderTop: "1px solid #1a1a1a" }}>
                Showing 100 of {currentList.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}