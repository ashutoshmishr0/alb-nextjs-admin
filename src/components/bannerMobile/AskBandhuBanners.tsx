"use client";

import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Smartphone,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { BannerAPI, type Banner, type BannerStatus } from "@/lib/api/banners";
import { CropCanvas, type CropRegion } from "./CropCanvas";

// ── Constants ──────────────────────────────────────────────────────────────
const BANNER_W = 1280;
const BANNER_H = 720;
const PAGE_PREFIX = "/askbandhu";

const REDIRECT_OPTIONS = [
  {
    label: "Puja",
    value: "PujaScreen",
    nav: `navigation.navigate('PujaScreen')`,
  },
  {
    label: "Videos",
    value: "VideoTab",
    nav: `navigation.navigate('VideoTab', { screen: 'VideoTab' })`,
  },
] as const;

type RedirectValue = (typeof REDIRECT_OPTIONS)[number]["value"];
type View = "list" | "add" | "edit";

// ── Toast ──────────────────────────────────────────────────────────────────
interface Toast {
  id: string;
  type: "success" | "error";
  message: string;
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium pointer-events-auto bg-white border ${
            t.type === "success" ? "border-emerald-200" : "border-red-200"
          }`}
        >
          {t.type === "success" ? (
            <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
          ) : (
            <XCircle size={13} className="text-red-500 flex-shrink-0" />
          )}
          <span>{t.message}</span>
          <button
            onClick={() => onRemove(t.id)}
            className="ml-1 text-slate-400 hover:text-slate-600"
          >
            <X size={11} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Status pill ────────────────────────────────────────────────────────────
const STATUS_PILL: Record<BannerStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  DRAFT: "bg-slate-100 text-slate-500 border border-slate-200",
  SCHEDULED: "bg-amber-50 text-amber-700 border border-amber-200",
  INACTIVE: "bg-red-50 text-red-600 border border-red-200",
};

// ── List View ──────────────────────────────────────────────────────────────
function ListView({
  onAdd,
  onEdit,
  addToast,
}: {
  onAdd: () => void;
  onEdit: (banner: Banner) => void;
  addToast: (type: "success" | "error", msg: string) => void;
}) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await BannerAPI.list({
        screenType: "MOBILE",
        limit: 50,
      });

      const data = res.data;
      console.log("FDSAFA SDFS S ",data);
      const filteredData = data.filter((item)=> item.page.startsWith('/askbandhu'))
      setBanners(filteredData);
    } catch (e: any) {
      addToast("error", e.message || "Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    setDeletingId(id);
    try {
      await BannerAPI.delete(id);
      addToast("success", "Deleted");
      fetchBanners();
    } catch (e: any) {
      addToast("error", e.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className=" mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center">
            <Smartphone size={15} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">AskBandhu Banners</h1>
            <p className="text-[11px] text-slate-400">{PAGE_PREFIX} · 1280 × 720 px</p>
          </div>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
        >
          <Plus size={13} />
          Add Banner
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-slate-100 rounded-2xl h-24 animate-pulse"
            />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mb-3">
            <Smartphone size={20} className="text-violet-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No banners yet</p>
          <p className="text-xs text-slate-400 mt-1 mb-5">
            Add your first AskBandhu mobile banner
          </p>
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={13} />
            Add Banner
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => {
            const redirectLabel =
              REDIRECT_OPTIONS.find((o) => o.value === banner.description)
                ?.label ?? banner.description;

            return (
              <div
                key={banner._id}
                className="bg-white border border-slate-100 rounded-2xl flex items-center gap-4 p-3 shadow-[0_1px_4px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_10px_rgba(0,0,0,0.08)] transition-shadow"
              >
                {/* Thumbnail */}
                <div
                  className="flex-shrink-0 rounded-xl overflow-hidden border border-slate-100 bg-slate-50"
                  style={{ width: 140, height: 65 }}
                >
                  {banner.backgroundImageUrl ? (
                    <img
                      src={process.env.NEXT_PUBLIC_IMAGE_URL + banner.backgroundImageUrl}
                      alt={banner.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-300">
                      No image
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {banner.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_PILL[banner.status]}`}
                    >
                      {banner.status}
                    </span>
                    {redirectLabel && (
                      <span className="text-[10px] text-slate-400 font-mono bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                        → {redirectLabel}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-300 font-mono">
                      {banner.page}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleDelete(banner._id)}
                    disabled={deletingId === banner._id}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                    title="Delete"
                  >
                    {deletingId === banner._id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Add View ───────────────────────────────────────────────────────────────
function AddView({
  onBack,
  addToast,
}: {
  onBack: () => void;
  addToast: (type: "success" | "error", msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [redirect, setRedirect] = useState<RedirectValue>("PujaScreen");
  const [page, setPage] = useState(PAGE_PREFIX);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop state
  const [cropMode, setCropMode] = useState(false);
  const [cropPendingUrl, setCropPendingUrl] = useState<string | null>(null);
  const [cropPendingFile, setCropPendingFile] = useState<File | null>(null);
  const [cropPendingDims, setCropPendingDims] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Final cropped result
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string>("");

  // Enforce /askbandhu prefix on page field
  const handlePageChange = (val: string) => {
    // Always keep /askbandhu prefix
    if (!val.startsWith(PAGE_PREFIX)) {
      setPage(PAGE_PREFIX);
      return;
    }
    setPage(val);
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
        addToast("error", "Please upload an image file");
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        addToast("error", "Image must be under 5 MB");
        return;
    }
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        const url = URL.createObjectURL(file);
        i.onload = () => { URL.revokeObjectURL(url); resolve(i); };
        i.onerror = reject;
        i.src = url;
    });

    // ── Dimension guard ──────────────────────────────────────────
    if (img.width < BANNER_W || img.height < BANNER_H) {
        addToast(
        "error",
        `Image dimensions (${img.width} × ${img.height}px) are smaller than required ${BANNER_W} × ${BANNER_H}px`
        );
        return;
    }
    // ─────────────────────────────────────────────────────────────

    const blobUrl = URL.createObjectURL(file);
    setCropPendingUrl(blobUrl);
    setCropPendingFile(file);
    setCropPendingDims({ width: img.width, height: img.height });
    setCropMode(true);
    };

  const handleCropDone = async (crop: CropRegion) => {
    if (!cropPendingUrl || !cropPendingFile) return;
    const srcUrl = cropPendingUrl;
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = srcUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = crop.w;
      canvas.height = crop.h;
      canvas.getContext("2d")!.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
          "image/jpeg",
          0.95
        )
      );
      URL.revokeObjectURL(srcUrl);
      const newFile = new File([blob], cropPendingFile.name, { type: "image/jpeg" });
      const previewUrl = URL.createObjectURL(blob);
      setCroppedFile(newFile);
      setCroppedPreviewUrl(previewUrl);
      setCropMode(false);
      setCropPendingUrl(null);
      setCropPendingFile(null);
      setCropPendingDims(null);
    } catch (e: any) {
      addToast("error", "Crop failed: " + e.message);
    }
  };

  const handleCropCancel = () => {
    if (cropPendingUrl) URL.revokeObjectURL(cropPendingUrl);
    setCropMode(false);
    setCropPendingUrl(null);
    setCropPendingFile(null);
    setCropPendingDims(null);
  };

  const clearImage = () => {
    if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl);
    setCroppedFile(null);
    setCroppedPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!name.trim()) { addToast("error", "Name is required"); return; }
    if (!croppedFile) { addToast("error", "Upload and crop an image"); return; }

    setSaving(true);
    try {
      const slug = `askbandhu-${name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")}-${Date.now()}`;

      await BannerAPI.create(
        {
          name: name.trim(),
          slug,
          screenType: "MOBILE",
          page,
          position: "top",
          width: BANNER_W,
          height: BANNER_H,
          backgroundColor: "#ffffff",
          backgroundSize: "cover",
          backgroundPosition: "center",
          elements: [],
          status: "ACTIVE",
          priority: 0,
          description: redirect,
        },
        croppedFile
      );
      addToast("success", "Banner created!");
      onBack();
    } catch (e: any) {
      addToast("error", e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // Crop mode takes over full screen
if (cropMode && cropPendingUrl && cropPendingDims) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl h-[420px] rounded-2xl overflow-hidden shadow-2xl">
       
        <CropCanvas
          imageUrl={cropPendingUrl}
          imageWidth={cropPendingDims.width}
          imageHeight={cropPendingDims.height}
          bannerWidth={BANNER_W}
          bannerHeight={BANNER_H}
          onDone={handleCropDone}
          onCancel={handleCropCancel}
        />
              </div>
      </div>
    );
  }

  const selectedOption = REDIRECT_OPTIONS.find((o) => o.value === redirect);

  return (
    <div className=" mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors"
        >
          <ArrowLeft size={14} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center">
            <Smartphone size={15} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Add Banner</h1>
            <p className="text-[11px] text-slate-400">1280 × 720 px · mobile</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* Name */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Banner name *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Diwali Sale"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-300"
          />
        </div>

        {/* Page route */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Page route
          </label>
          <input
            value={page}
            onChange={(e) => handlePageChange(e.target.value)}
            placeholder="/askbandhu/puja"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <p className="text-[10px] text-slate-400 mt-1.5">
            Must start with <span className="font-mono text-violet-500">/askbandhu</span>. Add a sub-path like{" "}
            <span className="font-mono text-slate-500">/askbandhu/puja</span> if needed.
          </p>
        </div>

        {/* Redirect */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Redirect to *
          </label>
          <select
            value={redirect}
            onChange={(e) => setRedirect(e.target.value as RedirectValue)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 mb-3"
          >
            {REDIRECT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Image upload */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Banner image *{" "}
            <span className="text-slate-300 font-normal normal-case">
              · recommended 1280 × 720 px
            </span>
          </label>

          {croppedPreviewUrl ? (
            <div
              className="relative group rounded-xl overflow-hidden border border-slate-100"
              style={{ height: 130 }}
            >
              <img
                src={croppedPreviewUrl}
                alt="preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 bg-white text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow"
                >
                  <Upload size={11} />
                  Replace
                </button>
                <button
                  onClick={clearImage}
                  className="flex items-center gap-1.5 bg-white text-red-500 text-xs font-semibold px-3 py-1.5 rounded-lg shadow"
                >
                  <X size={11} />
                  Remove
                </button>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-mono px-2 py-0.5 rounded-lg">
                1280 × 720
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 py-10 cursor-pointer transition-colors ${
                dragging
                  ? "border-violet-400 bg-violet-50"
                  : "border-slate-200 hover:border-violet-300 hover:bg-violet-50/40"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <Upload size={16} className="text-violet-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-600">
                  Drop image or click to upload
                </p>
                <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, WebP · max 5 MB</p>
              </div>
              <p className="text-[10px] text-violet-500 font-medium bg-violet-50 px-3 py-1 rounded-full">
                You'll crop it to 1280 × 720 px after selecting
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || !name.trim() || !croppedFile}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 rounded-xl shadow-sm transition-colors"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : null}
          {saving ? "Saving…" : "Save Banner"}
        </button>
      </div>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────
export default function AskBandhuBanners() {
  const [view, setView] = useState<View>("list");
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: "success" | "error", message: string) => {
    const id = uuidv4();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setView("edit");
  };

  const handleBack = () => {
    setEditingBanner(null);
    setView("list");
  };


  return (
    <div className="min-h-screen bg-[#F7F8FC]">
      {view === "list" ? (
        <ListView onAdd={() => setView("add")} onEdit={handleEdit} addToast={addToast} />
      ) : (
        <AddView onBack={handleBack} addToast={addToast} />
      )}
      <ToastContainer
        toasts={toasts}
        onRemove={(id) => setToasts((t) => t.filter((x) => x.id !== id))}
      />
    </div>
  );
}