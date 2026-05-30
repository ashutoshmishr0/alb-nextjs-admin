"use client";

import { useState } from "react";

type PreviewProduct = {
  id: number;
  title: string;
  current_tags: string;
};

type ResultProduct = {
  id: number;
  title: string;
  status: "updated" | "error";
  error?: string;
};

type PreviewData = {
  total_products: number;
  products_to_fix: number;
  preview: PreviewProduct[];
};

type FixData = {
  success: boolean;
  total_scanned: number;
  updated: number;
  errors: number;
  results: ResultProduct[];
  message?: string;
};

type Phase = "idle" | "scanning" | "previewing" | "fixing" | "done";

export default function FixTagsPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [result, setResult] = useState<FixData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleScan() {
    setPhase("scanning");
    setError(null);
    setPreview(null);
    setResult(null);

    try {
      const res = await fetch("/api/shopify/update-tag");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Scan failed");

      setPreview(data);
      setPhase("previewing");
    } catch (e: any) {
      setError(e.message);
      setPhase("idle");
    }
  }

  async function handleFix() {
    setPhase("fixing");
    setError(null);

    try {
      const res = await fetch("/api/shopify/update-tag", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Fix failed");

      setResult(data);
      setPhase("done");
    } catch (e: any) {
      setError(e.message);
      setPhase("previewing");
    }
  }

  function handleReset() {
    setPhase("idle");
    setPreview(null);
    setResult(null);
    setError(null);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.gemIcon}>💎</div>
          <div>
            <h1 style={styles.title}>Tag Fixer</h1>
            <p style={styles.subtitle}>
              Find products tagged only as <span style={styles.tag}>Gemstones</span> and add{" "}
              <span style={styles.tagOther}>Other</span>
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={styles.errorBox}>
            <span style={{ fontSize: 16 }}>⚠️</span> {error}
          </div>
        )}

        {/* IDLE */}
        {phase === "idle" && (
          <div style={styles.centered}>
            <p style={styles.desc}>
              This tool scans your entire Shopify catalog, finds products whose <em>only</em> tag is{" "}
              <strong>Gemstones</strong>, and adds the <strong>Other</strong> tag to them.
            </p>
            <button style={styles.primaryBtn} onClick={handleScan}>
              🔍 Scan Products
            </button>
          </div>
        )}

        {/* SCANNING */}
        {phase === "scanning" && (
          <div style={styles.centered}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Scanning your Shopify catalog…</p>
          </div>
        )}

        {/* PREVIEWING */}
        {phase === "previewing" && preview && (
          <div>
            {/* Stats row */}
            <div style={styles.statsRow}>
              <div style={styles.statBox}>
                <div style={styles.statNum}>{preview.total_products}</div>
                <div style={styles.statLabel}>Total Products</div>
              </div>
              <div style={{ ...styles.statBox, background: preview.products_to_fix > 0 ? "#fef3c7" : "#ecfdf5", borderColor: preview.products_to_fix > 0 ? "#f59e0b" : "#10b981" }}>
                <div style={{ ...styles.statNum, color: preview.products_to_fix > 0 ? "#d97706" : "#059669" }}>
                  {preview.products_to_fix}
                </div>
                <div style={styles.statLabel}>Need Fix</div>
              </div>
            </div>

            {preview.products_to_fix === 0 ? (
              <div style={styles.allGood}>
                ✅ All products already have proper tags. Nothing to fix!
              </div>
            ) : (
              <>
                <p style={styles.listHeader}>
                  These <strong>{preview.products_to_fix}</strong> products will get the{" "}
                  <span style={styles.tagOther}>Other</span> tag added:
                </p>

                <div style={styles.listBox}>
                  {preview.preview.map((p) => (
                    <div key={p.id} style={styles.listRow}>
                      <div style={styles.listTitle}>{p.title}</div>
                      <div style={styles.listMeta}>
                        <span style={styles.tag}>Gemstones</span>
                        <span style={styles.arrow}>→</span>
                        <span style={styles.tag}>Gemstones</span>
                        <span style={{ fontSize: 11, color: "#6b7280" }}> + </span>
                        <span style={styles.tagOther}>Other</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={styles.actionRow}>
                  <button style={styles.ghostBtn} onClick={handleReset}>
                    Cancel
                  </button>
                  <button style={styles.primaryBtn} onClick={handleFix}>
                    ✅ Apply Fix to {preview.products_to_fix} Products
                  </button>
                </div>
              </>
            )}

            {preview.products_to_fix === 0 && (
              <div style={styles.centered}>
                <button style={styles.ghostBtn} onClick={handleReset}>← Back</button>
              </div>
            )}
          </div>
        )}

        {/* FIXING */}
        {phase === "fixing" && (
          <div style={styles.centered}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Updating products…</p>
            <p style={styles.subLoadingText}>This may take a moment for large catalogs</p>
          </div>
        )}

        {/* DONE */}
        {phase === "done" && result && (
          <div>
            <div style={styles.doneHeader}>
              <div style={styles.doneIcon}>🎉</div>
              <div>
                <div style={styles.doneTitle}>Done!</div>
                <div style={styles.doneDesc}>
                  Scanned <strong>{result.total_scanned}</strong> products — updated{" "}
                  <strong style={{ color: "#059669" }}>{result.updated}</strong>
                  {result.errors > 0 && (
                    <>, <strong style={{ color: "#dc2626" }}>{result.errors} errors</strong></>
                  )}
                </div>
              </div>
            </div>

            {result.results.length > 0 && (
              <div style={styles.listBox}>
                {result.results.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      ...styles.listRow,
                      borderLeft: `3px solid ${r.status === "updated" ? "#10b981" : "#ef4444"}`,
                    }}
                  >
                    <div style={styles.listTitle}>
                      {r.status === "updated" ? "✅" : "❌"} {r.title}
                    </div>
                    {r.error && <div style={styles.errorInline}>{r.error}</div>}
                  </div>
                ))}
              </div>
            )}

            <div style={{ ...styles.centered, marginTop: 20 }}>
              <button style={styles.primaryBtn} onClick={handleReset}>
                🔄 Run Again
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "40px 16px",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: "32px 28px",
    width: "100%",
    maxWidth: 640,
    boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 28,
    paddingBottom: 20,
    borderBottom: "2px solid #f1f5f9",
  },
  gemIcon: { fontSize: 40 },
  title: { margin: 0, fontSize: 22, fontWeight: 800, color: "#1e1b4b" },
  subtitle: { margin: "4px 0 0", fontSize: 13, color: "#6b7280" },
  tag: {
    display: "inline-block",
    background: "#e0e7ff",
    color: "#3730a3",
    borderRadius: 4,
    padding: "1px 7px",
    fontSize: 12,
    fontWeight: 600,
  },
  tagOther: {
    display: "inline-block",
    background: "#fef3c7",
    color: "#92400e",
    borderRadius: 4,
    padding: "1px 7px",
    fontSize: 12,
    fontWeight: 600,
  },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    borderRadius: 8,
    padding: "10px 14px",
    marginBottom: 20,
    fontSize: 14,
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  centered: { textAlign: "center", padding: "12px 0" },
  desc: { color: "#4b5563", fontSize: 14, lineHeight: 1.7, marginBottom: 24 },
  primaryBtn: {
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "12px 28px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(79,70,229,0.4)",
    transition: "opacity 0.15s",
  },
  ghostBtn: {
    background: "transparent",
    color: "#6b7280",
    border: "1.5px solid #e5e7eb",
    borderRadius: 10,
    padding: "12px 24px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginRight: 12,
  },
  spinner: {
    width: 44,
    height: 44,
    border: "4px solid #e0e7ff",
    borderTop: "4px solid #4f46e5",
    borderRadius: "50%",
    margin: "0 auto 16px",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: { color: "#374151", fontWeight: 600, fontSize: 16, margin: 0 },
  subLoadingText: { color: "#9ca3af", fontSize: 12, marginTop: 6 },
  statsRow: {
    display: "flex",
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    background: "#f8fafc",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    padding: "14px 16px",
    textAlign: "center",
  },
  statNum: { fontSize: 28, fontWeight: 800, color: "#1e1b4b" },
  statLabel: { fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: 500 },
  allGood: {
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    color: "#065f46",
    borderRadius: 10,
    padding: "14px 16px",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
  },
  listHeader: { fontSize: 14, color: "#374151", margin: "0 0 12px" },
  listBox: {
    border: "1.5px solid #e5e7eb",
    borderRadius: 10,
    overflow: "hidden",
    maxHeight: 320,
    overflowY: "auto",
    marginBottom: 20,
  },
  listRow: {
    padding: "10px 14px",
    borderBottom: "1px solid #f1f5f9",
    borderLeft: "3px solid transparent",
  },
  listTitle: { fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 4 },
  listMeta: { display: "flex", alignItems: "center", gap: 5 },
  arrow: { color: "#9ca3af", fontSize: 14 },
  errorInline: { fontSize: 12, color: "#dc2626", marginTop: 4 },
  actionRow: { display: "flex", justifyContent: "flex-end", alignItems: "center" },
  doneHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: "#f0fdf4",
    border: "1.5px solid #bbf7d0",
    borderRadius: 10,
    padding: "14px 18px",
    marginBottom: 20,
  },
  doneIcon: { fontSize: 36 },
  doneTitle: { fontSize: 18, fontWeight: 800, color: "#065f46" },
  doneDesc: { fontSize: 14, color: "#374151", marginTop: 4 },
};