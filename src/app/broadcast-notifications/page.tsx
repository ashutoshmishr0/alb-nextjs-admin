'use client';
import React, { useState, Suspense, useRef } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from 'react-image-crop';

// ── Screens ───────────────────────────────────────────────────────────────────
const SCREENS = [
  { label: "Home", value: "" },
  { label: "Gemstones", value: "pages/gemstones" },
  { label: "Gemstone Calculator", value: "pages/gemstone-calculator" },
  { label: "Rudraksha Calculator", value: "pages/rudraksha-calculator" },
  { label: "Gemstone Consultation", value: "pages/gemstones-consultation" },
  { label: "Moolank Calculator", value: "pages/moolank-calculator" },
  { label: "Ratti Calculator", value: "pages/ratti-calculator" },
  { label: "Bracelet Calculator", value: "pages/bracelet-calculator" },
  { label: "About Us", value: "pages/about-us" },
];

const IMAGE_CONFIG = { maxSizeMB: 2 };

// ── Crop helpers ──────────────────────────────────────────────────────────────
const NOTIF_ASPECT = 2 / 1;
const NOTIF_OUTPUT = { w: 1024, h: 512 };

function makeCenteredCrop(mediaW: number, mediaH: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaW, mediaH),
    mediaW, mediaH
  );
}

async function getCroppedFile(
  imgEl: HTMLImageElement,
  pixelCrop: PixelCrop,
  outputW: number,
  outputH: number,
  fileName: string
): Promise<File | null> {
  const canvas = document.createElement('canvas');
  canvas.width = outputW;
  canvas.height = outputH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const scaleX = imgEl.naturalWidth / imgEl.width;
  const scaleY = imgEl.naturalHeight / imgEl.height;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    imgEl,
    pixelCrop.x * scaleX, pixelCrop.y * scaleY,
    pixelCrop.width * scaleX, pixelCrop.height * scaleY,
    0, 0, outputW, outputH
  );
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob ? new File([blob], fileName, { type: 'image/jpeg' }) : null),
      'image/jpeg', 0.92
    );
  });
}

// ── Crop Modal ────────────────────────────────────────────────────────────────
interface CropModalProps {
  imgSrc: string;
  onConfirm: (file: File) => void;
  onCancel: () => void;
}

const CropModal: React.FC<CropModalProps> = ({ imgSrc, onConfirm, onCancel }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(makeCenteredCrop(width, height, NOTIF_ASPECT));
  };

  const handleConfirm = async () => {
    if (!imgRef.current || !completedCrop || completedCrop.width === 0) return;
    const file = await getCroppedFile(
      imgRef.current, completedCrop,
      NOTIF_OUTPUT.w, NOTIF_OUTPUT.h,
      `notif-${Date.now()}.jpg`
    );
    if (file) onConfirm(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Crop Image</h2>
            <p className="text-xs text-gray-400 mt-0.5">Notification banner · 2:1 ratio (1024×512px)</p>
          </div>
          <button type="button" onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex justify-center max-h-[55vh] overflow-auto rounded-lg bg-gray-50 border border-gray-200">
          <ReactCrop
            crop={crop}
            onChange={(_, pct) => setCrop(pct)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={NOTIF_ASPECT}
            keepSelection
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imgSrc}
              alt="Crop source"
              onLoad={onImageLoad}
              style={{ maxHeight: '55vh' }}
            />
          </ReactCrop>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Crop &amp; Use
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface FormState {
  title: string;
  body: string;
  screen: string;
  imageUrl: string;
  scheduleType: "now" | "later";
  externalUrl: string;     
  linkType: "screen" | "external"; // ← new, replaces relying on screen alone
  scheduledAt: string;
  targetType: "all" | "selected";
}

interface FormErrors {
  title?: string;
  body?: string;
  imageUrl?: string;
  scheduledAt?: string;
  deviceIds?: string;
  externalUrl?: string; // ← new
}

// ── Main Component ────────────────────────────────────────────────────────────
function BroadcastNotificationContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    title: "",
    body: "",
    screen: "",
    externalUrl: "",
    linkType: "screen",
    imageUrl: "",
    scheduleType: "now",
    scheduledAt: "",
    targetType: "all",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [cropSrc, setCropSrc] = useState("");

  // Device targeting
  const [deviceIds, setDeviceIds] = useState<string[]>([]);
  const [deviceInput, setDeviceInput] = useState("");
  const [totalDevices, setTotalDevices] = useState<number | null>(null);

  // Fetch total device count on mount
  React.useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shopify/notify/device-count`)
      .then(r => r.json())
      .then(d => { if (d.success) setTotalDevices(d.count); })
      .catch(() => {});
  }, []);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // ── Image helpers ─────────────────────────────────────────────────────────
  const uploadImage = async (file: File) => {
    setImageUploading(true);
    setErrors(prev => ({ ...prev, imageUrl: "" }));
    try {
      const formData = new FormData();
      formData.append("image", file);
      const uploadRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/shopify/notify/upload-image`,
        { method: "POST", body: formData }
      );
      const uploadData = await uploadRes.json();
      if (uploadData.success && uploadData.url) {
        setForm(prev => ({ ...prev, imageUrl: uploadData.url }));
        setImagePreview(uploadData.url);
      } else {
        setErrors(prev => ({ ...prev, imageUrl: "Upload failed. Try again." }));
      }
    } catch {
      setErrors(prev => ({ ...prev, imageUrl: "Upload failed. Check your connection." }));
    } finally {
      setImageUploading(false);
    }
  };

  const openCropper = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrors(prev => ({ ...prev, imageUrl: "Please select a valid image file" }));
      return;
    }
    if (file.size > IMAGE_CONFIG.maxSizeMB * 1024 * 1024) {
      setErrors(prev => ({ ...prev, imageUrl: `Image must be under ${IMAGE_CONFIG.maxSizeMB}MB` }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { e.target.value = ''; openCropper(file); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) openCropper(file);
  };

  const removeImage = () => {
    setForm(prev => ({ ...prev, imageUrl: "" }));
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Device ID helpers ─────────────────────────────────────────────────────
  const addDeviceId = () => {
    const id = deviceInput.trim();
    if (!id) return;
    if (deviceIds.includes(id)) {
      setErrors(prev => ({ ...prev, deviceIds: "This device ID is already added." }));
      return;
    }
    setDeviceIds(prev => [...prev, id]);
    setDeviceInput("");
    setErrors(prev => ({ ...prev, deviceIds: "" }));
  };

  const removeDeviceId = (id: string) => setDeviceIds(prev => prev.filter(d => d !== id));

  const handleDeviceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addDeviceId(); }
  };

  // ── Validation ────────────────────────────────────────────────────────────
const validate = () => {
  const newErrors: FormErrors = {};
  if (!form.title.trim()) newErrors.title = "Title is required";
  if (!form.body.trim()) newErrors.body = "Message is required";
  if (form.scheduleType === "later") {
    if (!form.scheduledAt) {
      newErrors.scheduledAt = "Please pick a date & time";
    } else if (new Date(form.scheduledAt) <= new Date()) {
      newErrors.scheduledAt = "Scheduled time must be in the future";
    }
  }
  if (form.targetType === "selected" && deviceIds.length === 0) {
    newErrors.deviceIds = "Add at least one device ID";
  }
  if (form.linkType === "external") {
    if (!form.externalUrl.trim()) {
      newErrors.externalUrl = "Enter a URL";
    } else {
      try {
        const parsed = new URL(form.externalUrl.trim());
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      } catch {
        newErrors.externalUrl = "Enter a valid http(s) URL";
      }
    }
  }
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;

    const isScheduled = form.scheduleType === "later";
    const targetLabel = form.targetType === "selected"
      ? `${deviceIds.length} selected device(s)`
      : `all ${totalDevices ?? ''} devices`;

    const confirm = await Swal.fire({
      title: isScheduled ? "Schedule Notification?" : "Send Notification?",
      text: isScheduled
        ? `Will send to ${targetLabel} at ${new Date(form.scheduledAt).toLocaleString('en-IN')}.`
        : `This sends to ${targetLabel} immediately.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#d1d5db",
      confirmButtonText: isScheduled ? "Yes, Schedule" : "Yes, Send",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      
      const payload: Record<string, unknown> = {
        title: form.title,
        body: form.body,
        scheduledAt: isScheduled ? form.scheduledAt : new Date().toISOString(),
        targetType: form.targetType,
        targetDeviceIds: form.targetType === "selected" ? deviceIds : [],
      };
      if (form.linkType === "screen" && form.screen) payload.screen = form.screen;
      if (form.linkType === "external" && form.externalUrl.trim()) payload.externalUrl = form.externalUrl.trim();
      if (form.imageUrl) payload.imageUrl = form.imageUrl;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/shopify/notify/broadcast`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      );
      const result = await response.json();

      if (result.success) {
        // If send now, trigger immediately
        if (!isScheduled && result.campaign?._id) {
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/shopify/notify/broadcast/trigger/${result.campaign._id}`,
            { method: "POST" }
          );
        }

        Swal.fire({
          icon: "success",
          title: isScheduled ? "Scheduled!" : "Sent!",
          text: isScheduled
            ? `Scheduled for ${new Date(form.scheduledAt).toLocaleString('en-IN')}`
            : "Notifications are being dispatched.",
          timer: 2500,
          showConfirmButton: false,
        });

        setForm({ title: "", body: "", screen: "", externalUrl: "", linkType: "screen", imageUrl: "", scheduleType: "now", scheduledAt: "", targetType: "all" });
        setImagePreview("");
        setDeviceIds([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        Swal.fire({ icon: "error", title: "Failed", text: result.message || "Something went wrong", confirmButtonColor: "#d33" });
      }
    } catch {
      Swal.fire({ icon: "error", title: "Network Error", text: "Check your connection and try again.", confirmButtonColor: "#d33" });
    } finally {
      setLoading(false);
    }
  };

  const minDatetime = new Date(Date.now() + 60000).toISOString().slice(0, 16);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className=" flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center shadow-sm flex-shrink-0">
            <img src="/image.png" alt="image" className="w-10 h-10 rounded-xl" />
          </div>
          <div>
          <h1 className="text-lg font-semibold text-gray-900">Broadcast Notification</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-gray-500">Send push notifications to registered devices</p>
            {totalDevices !== null && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-xs font-medium text-green-600">{totalDevices.toLocaleString()} registered devices</span>
              </>
            )}
          </div>
        </div>
        </div>


        

        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
        >
          ← Back
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── LEFT: Form ─────────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">

            {/* Warning banner */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              <span className="text-base leading-none mt-0.5">⚠️</span>
              <span>Broadcasts to <strong>all registered devices</strong> unless you target specific devices. Double-check before sending.</span>
            </div>

            {/* ── Content card ──────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Content</p>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.title}
                  maxLength={65}
                  onChange={e => handleChange("title", e.target.value)}
                  placeholder="e.g. Flash Sale 🔥"
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition ${errors.title ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                />
                <div className="flex justify-between items-center">
                  {errors.title ? <p className="text-red-500 text-xs">{errors.title}</p> : <span />}
                  <span className="text-xs text-gray-400 ml-auto">{form.title.length}/65</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Message <span className="text-red-500">*</span></label>
                <textarea
                  value={form.body}
                  maxLength={180}
                  onChange={e => handleChange("body", e.target.value)}
                  rows={3}
                  placeholder="e.g. 50% off all gemstones today only!"
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none transition ${errors.body ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                />
                <div className="flex justify-between items-center">
                  {errors.body ? <p className="text-red-500 text-xs">{errors.body}</p> : <span />}
                  <span className="text-xs text-gray-400 ml-auto">{form.body.length}/180</span>
                </div>
              </div>
            </div>

            {/* ── Image card ────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Notification Image</p>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">1024×512px · 2:1 · max {IMAGE_CONFIG.maxSizeMB}MB</span>
              </div>

              {!imagePreview ? (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    dragOver ? "border-red-400 bg-red-50"
                    : errors.imageUrl ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-gray-50 hover:border-red-300 hover:bg-red-50/30"
                  }`}
                >
                  {imageUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-gray-500">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 pointer-events-none">
                      <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center mb-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600">Drop image or <span className="text-red-500 font-medium">browse</span></p>
                      <p className="text-xs text-gray-400">PNG, JPG, WEBP</p>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileInput} disabled={imageUploading} />
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100" style={{ aspectRatio: "2/1" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button onClick={removeImage} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs transition">✕</button>
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">✓ Uploaded</div>
                </div>
              )}

              {errors.imageUrl && <p className="text-red-500 text-xs">{errors.imageUrl}</p>}

              <div className="space-y-1">
                <label className="text-xs text-gray-400">Or paste image URL</label>
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={e => { handleChange("imageUrl", e.target.value); setImagePreview(e.target.value); }}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-gray-600"
                />
              </div>
            </div>

            {/* ── Delivery card ─────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Delivery</p>

              {/* Link / redirect */}
<div className="space-y-2">
  <label className="text-sm font-medium text-gray-700">
    Tap Action <span className="text-xs text-gray-400 font-normal">(optional)</span>
  </label>
  <div className="grid grid-cols-2 gap-2">
    {(["screen", "external"] as const).map(type => (
      <button
        key={type}
        type="button"
        onClick={() => handleChange("linkType", type)}
        className={`py-2 rounded-lg border text-xs font-medium transition ${
          form.linkType === type
            ? "bg-red-500 text-white border-red-500 shadow-sm"
            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
        }`}
      >
        { type === "screen" ? "In-App Screen" : "External Link"}
      </button>
    ))}
  </div>

  {form.linkType === "screen" && (
    <select
      value={form.screen}
      onChange={e => handleChange("screen", e.target.value)}
      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
    >
      {SCREENS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
    </select>
  )}

  {form.linkType === "external" && (
    <div className="space-y-1">
      <input
        type="text"
        value={form.externalUrl}
        onChange={e => handleChange("externalUrl", e.target.value)}
        placeholder="https://example.com/promo"
        className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 ${
          errors.externalUrl ? "border-red-400 bg-red-50" : "border-gray-300"
        }`}
      />
      {errors.externalUrl && <p className="text-red-500 text-xs">{errors.externalUrl}</p>}
    </div>
  )}

  <p className="text-xs text-gray-400">
    {form.linkType === "screen" && "Tapping the notification opens this in-app screen."}
    {form.linkType === "external" && "Tapping the notification opens this link in the in-app browser."}
  </p>
</div>

              <div className="border-t border-gray-100" />

              {/* Target type */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Send to</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["all", "selected"] as const).map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => { handleChange("targetType", val); if (val === "all") setErrors(p => ({ ...p, deviceIds: "" })); }}
                      className={`py-2.5 rounded-lg border text-sm font-medium transition flex items-center justify-center gap-2 ${
                        form.targetType === val
                          ? "bg-red-500 text-white border-red-500 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {val === "all" ? (
                        <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> All devices</>
                      ) : (
                        <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" /></svg> By device ID</>
                      )}
                    </button>
                  ))}
                </div>

                {/* Device ID input */}
                {form.targetType === "selected" && (
                  <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50 p-4 space-y-3">
                    <label className="block text-sm font-medium text-indigo-800">Target Device IDs</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={deviceInput}
                        onChange={e => { setDeviceInput(e.target.value); setErrors(p => ({ ...p, deviceIds: "" })); }}
                        onKeyDown={handleDeviceKeyDown}
                        placeholder="e.g. abc123-device-id"
                        className="flex-1 px-3 py-2 rounded-lg border border-indigo-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
                      />
                      <button
                        type="button"
                        onClick={addDeviceId}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    {errors.deviceIds
                      ? <p className="text-red-500 text-xs">{errors.deviceIds}</p>
                      : <p className="text-indigo-500 text-xs">Press Enter or click Add after each device ID.</p>
                    }
                    {deviceIds.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {deviceIds.map(id => (
                          <span key={id} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-medium max-w-[200px]">
                            <span className="truncate">{id}</span>
                            <button
                              type="button"
                              onClick={() => removeDeviceId(id)}
                              className="w-4 h-4 flex items-center justify-center rounded-full bg-indigo-200 hover:bg-indigo-300 text-indigo-700 transition-colors flex-shrink-0"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-indigo-400 text-xs">No device IDs added yet</div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100" />

              {/* Schedule */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Send Time</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["now", "later"] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { handleChange("scheduleType", type); setErrors(p => ({ ...p, scheduledAt: "" })); }}
                      className={`py-2.5 rounded-lg border text-sm font-medium transition ${
                        form.scheduleType === type
                          ? "bg-red-500 text-white border-red-500 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {type === "now" ? "🚀 Send Now" : "🕒 Schedule"}
                    </button>
                  ))}
                </div>

                {form.scheduleType === "later" && (
                  <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 space-y-2">
                    <label className="text-sm font-medium text-orange-800">Pick date &amp; time</label>
                    <input
                      type="datetime-local"
                      value={form.scheduledAt}
                      min={minDatetime}
                      onChange={e => { handleChange("scheduledAt", e.target.value); }}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 ${errors.scheduledAt ? "border-red-400" : "border-orange-200"}`}
                    />
                    {form.scheduledAt && !errors.scheduledAt && (
                      <p className="text-xs text-orange-700">
                        📅 Sends at <strong>{new Date(form.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</strong>
                      </p>
                    )}
                    {errors.scheduledAt && <p className="text-red-500 text-xs">{errors.scheduledAt}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading || imageUploading}
              className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {form.scheduleType === "later" ? "Scheduling..." : "Sending..."}</>
              ) : form.scheduleType === "later"
                ? "🕒 Schedule Notification"
                : form.targetType === "selected"
                ? `🚀 Send to ${deviceIds.length} Device(s)`
                : `🚀 Send to All ${totalDevices ? `(${totalDevices})` : ''} Devices`
              }
            </button>
          </div>

          {/* ── RIGHT: Live Preview ────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-6 space-y-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Live Preview</p>

              {/* Android mockup */}
              <div className="bg-gray-900 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-white text-xs font-medium">9:41</span>
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-px items-end h-3">
                      {[2, 3, 4, 3].map((h, i) => (
                        <div key={i} className="w-0.5 bg-white/80 rounded-sm" style={{ height: `${h * 3}px` }} />
                      ))}
                    </div>
                    <div className="w-5 h-2.5 border border-white/80 rounded-sm relative">
                      <div className="absolute inset-[1.5px] right-[3px] bg-white/80 rounded-sm" />
                      <div className="absolute right-[-2.5px] top-1/2 -translate-y-1/2 w-[2px] h-[5px] bg-white/80 rounded-r-sm" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.12] rounded-xl overflow-hidden">
                  {imagePreview ? (
                    <div className="w-full overflow-hidden" style={{ aspectRatio: "2/1" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="banner" className="w-full h-full object-cover" onError={() => setImagePreview("")} />
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-center bg-white/5" style={{ aspectRatio: "2/1" }}>
                      <span className="text-white/20 text-xs">No image</span>
                    </div>
                  )}
                  <div className="p-3 flex gap-2.5 items-start">
                    <div className="w-7 h-7 bg-slate-500 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      <img src="/image.png" alt="life changing astro" className=" w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold leading-tight truncate">
                        {form.title || "Notification title"}
                      </p>
                      <p className="text-white/60 text-xs mt-0.5 leading-snug line-clamp-2">
                        {form.body || "Your notification message appears here"}
                      </p>
                    </div>
                    <span className="text-white/40 text-[10px] flex-shrink-0 mt-0.5">now</span>
                  </div>
                </div>

                <div className="flex justify-center pt-1">
                  <div className="w-20 h-1 bg-white/20 rounded-full" />
                </div>
              </div>

              {/* Status chips */}
              <div className="space-y-2">
                {form.linkType === "screen" && form.screen && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                    <span>🔗</span>
                    <span>Opens <strong>{SCREENS.find(s => s.value === form.screen)?.label}</strong></span>
                  </div>
                )}
                {form.linkType === "external" && form.externalUrl && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                    <span>🌐</span>
                    <span>Opens external link</span>
                  </div>
                )}
                {form.targetType === "selected" && deviceIds.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-2">
                    <span>🎯</span>
                    <span>Targeting <strong>{deviceIds.length}</strong> specific device(s)</span>
                  </div>
                )}
                {form.scheduleType === "later" && form.scheduledAt && (
                  <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
                    <span>🕒</span>
                    <span>Scheduled: <strong>{new Date(form.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</strong></span>
                  </div>
                )}
                {form.imageUrl && (
                  <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">
                    <span>🖼️</span>
                    <span>Image attached</span>
                  </div>
                )}
              </div>

              {/* Checklist */}
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Checklist</p>
                {[
                  { label: "Title", done: !!form.title.trim(), optional: false },
                  { label: "Message", done: !!form.body.trim(), optional: false },
                  { label: "Image", done: !!form.imageUrl, optional: true },
                  { label: "Link",
                    done: (form.linkType === "screen" ? !!form.screen : !!form.externalUrl),
                    optional: true,
                  },
                  { label: form.targetType === "selected" ? "Device IDs" : "Target", done: form.targetType === "all" || deviceIds.length > 0, optional: false },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2.5 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? "bg-green-500" : item.optional ? "bg-gray-100" : "bg-red-100"}`}>
                      {item.done ? (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <div className={`w-1.5 h-1.5 rounded-full ${item.optional ? "bg-gray-300" : "bg-red-300"}`} />
                      )}
                    </div>
                    <span className={item.done ? "text-gray-700 font-medium" : item.optional ? "text-gray-400" : "text-gray-500"}>
                      {item.label}{item.optional && !item.done && <span className="text-gray-300 ml-1">(optional)</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Crop Modal */}
      {cropSrc && (
        <CropModal
          imgSrc={cropSrc}
          onConfirm={file => { setCropSrc(''); uploadImage(file); }}
          onCancel={() => setCropSrc('')}
        />
      )}
    </div>
  );
}

const BroadcastNotification = () => (
  <Suspense fallback={
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
    </div>
  }>
    <BroadcastNotificationContent />
  </Suspense>
);

export default BroadcastNotification;