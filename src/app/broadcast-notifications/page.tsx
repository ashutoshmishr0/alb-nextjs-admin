'use client';
import React, { useState, Suspense, useRef } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

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

const IMAGE_CONFIG = {
  maxSizeMB: 2,
  label: "1024 × 512 px recommended (2:1 ratio)",
};

interface FormState {
  title: string;
  body: string;
  screen: string;
  imageUrl: string;
  scheduleType: "now" | "later";
  scheduleHours: string;
  rolloutPercent: number;
}

interface FormErrors {
  title?: string;
  body?: string;
  imageUrl?: string;
  scheduleHours?: string;
}

function BroadcastNotificationContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    title: "",
    body: "",
    screen: "",
    imageUrl: "",
    scheduleType: "now",
    scheduleHours: "",
    rolloutPercent: 100,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageUploading, setImageUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleChange = (field: keyof FormState, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, imageUrl: "Please select a valid image file" }));
      return;
    }
    if (file.size > IMAGE_CONFIG.maxSizeMB * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, imageUrl: `Image must be under ${IMAGE_CONFIG.maxSizeMB}MB` }));
      return;
    }

    setImageUploading(true);
    setErrors((prev) => ({ ...prev, imageUrl: "" }));

    try {
      const formData = new FormData();
      formData.append("image", file);

      const uploadRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/shopify/notify/upload-image`,
        { method: "POST", body: formData }
      );
      const uploadData = await uploadRes.json();

      if (uploadData.success && uploadData.url) {
        setForm((prev) => ({ ...prev, imageUrl: uploadData.url }));
        setImagePreview(uploadData.url);
      } else {
        setErrors((prev) => ({ ...prev, imageUrl: "Upload failed. Try again." }));
      }
    } catch {
      setErrors((prev) => ({ ...prev, imageUrl: "Upload failed. Check your connection." }));
    } finally {
      setImageUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadImage(file);
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, imageUrl: "" }));
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = () => {
    const newErrors: FormErrors = {};
    if (!form.title.trim()) newErrors.title = "Title is required";
    if (!form.body.trim()) newErrors.body = "Message is required";
    if (form.scheduleType === "later") {
      const hrs = parseFloat(form.scheduleHours);
      if (!form.scheduleHours || isNaN(hrs) || hrs <= 0)
        newErrors.scheduleHours = "Enter a valid number of hours (e.g. 1.5)";
      else if (hrs > 720)
        newErrors.scheduleHours = "Max 720 hours (30 days)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const isScheduled = form.scheduleType === "later";
    const isRollout = form.rolloutPercent < 100;

    const confirmText = isScheduled
      ? `Will send to ${isRollout ? `${form.rolloutPercent}% of` : "all"} devices after ${form.scheduleHours} hour(s).`
      : `This sends to ${isRollout ? `~${form.rolloutPercent}% of` : "all"} registered devices immediately.`;

    const confirm = await Swal.fire({
      title: isScheduled ? "Schedule Notification?" : "Send Notification?",
      text: confirmText,
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
      const payload: Record<string, unknown> = { title: form.title, body: form.body };
      if (form.screen) payload.data = { screen: form.screen };
      if (form.imageUrl) payload.imageUrl = form.imageUrl;
      if (isScheduled) payload.scheduleAfterHours = parseFloat(form.scheduleHours);
      if (isRollout) payload.rolloutPercent = form.rolloutPercent;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/shopify/notify/broadcast`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (result.success) {
        Swal.fire({
          icon: "success",
          title: isScheduled ? "Scheduled!" : "Sent!",
          text: isScheduled
            ? `Scheduled to send after ${form.scheduleHours} hour(s)`
            : `Sent to ${result.sent} of ${result.totalDevices} device(s)`,
          timer: 2500,
          showConfirmButton: false,
        });
        setForm({ title: "", body: "", screen: "", imageUrl: "", scheduleType: "now", scheduleHours: "", rolloutPercent: 100 });
        setImagePreview("");
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

  const scheduledTime =
    form.scheduleType === "later" && form.scheduleHours && !isNaN(parseFloat(form.scheduleHours))
      ? new Date(Date.now() + parseFloat(form.scheduleHours) * 3600000).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : null;

  const rolloutColor =
    form.rolloutPercent === 100
      ? "text-green-700 bg-green-100"
      : form.rolloutPercent >= 50
      ? "text-orange-700 bg-orange-100"
      : "text-red-700 bg-red-100";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Broadcast Notification</h1>
          <p className="text-xs text-gray-500 mt-0.5">Send push notifications to registered devices</p>
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

          {/* ── LEFT: Form ───────────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">

            {/* Warning banner */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              <span className="text-base leading-none mt-0.5">⚠️</span>
              <span>Broadcasts to <strong>all registered devices</strong> unless you set a rollout. Double-check before sending.</span>
            </div>

            {/* ── Content card ─────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Content</p>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  maxLength={65}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g. Flash Sale 🔥"
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition ${
                    errors.title ? "border-red-400 bg-red-50" : "border-gray-300"
                  }`}
                />
                <div className="flex justify-between items-center">
                  {errors.title ? <p className="text-red-500 text-xs">{errors.title}</p> : <span />}
                  <span className="text-xs text-gray-400 ml-auto">{form.title.length}/65</span>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.body}
                  maxLength={180}
                  onChange={(e) => handleChange("body", e.target.value)}
                  rows={3}
                  placeholder="e.g. 50% off all gemstones today only!"
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none transition ${
                    errors.body ? "border-red-400 bg-red-50" : "border-gray-300"
                  }`}
                />
                <div className="flex justify-between items-center">
                  {errors.body ? <p className="text-red-500 text-xs">{errors.body}</p> : <span />}
                  <span className="text-xs text-gray-400 ml-auto">{form.body.length}/180</span>
                </div>
              </div>
            </div>

            {/* ── Image card ───────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Notification Image</p>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{IMAGE_CONFIG.label}</span>
              </div>

              {/* Drop zone */}
              {!imagePreview ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    dragOver
                      ? "border-red-400 bg-red-50"
                      : errors.imageUrl
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 bg-gray-50 hover:border-red-300 hover:bg-red-50/30"
                  }`}
                >
                  {imageUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-gray-500">Uploading to S3...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 pointer-events-none">
                      <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center mb-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600">Drop image or <span className="text-red-500 font-medium">browse</span></p>
                      <p className="text-xs text-gray-400">PNG, JPG, WEBP · max {IMAGE_CONFIG.maxSizeMB}MB</p>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileInput} disabled={imageUploading} />
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100" style={{ aspectRatio: "2/1" }}>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs transition"
                  >✕</button>
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">✓ Uploaded</div>
                </div>
              )}

              {errors.imageUrl && <p className="text-red-500 text-xs">{errors.imageUrl}</p>}

              {/* URL fallback */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Or paste image URL</label>
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => { handleChange("imageUrl", e.target.value); setImagePreview(e.target.value); }}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-gray-600"
                />
              </div>
            </div>

            {/* ── Delivery card ────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Delivery</p>

              {/* Deep link */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Deep Link Screen <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  value={form.screen}
                  onChange={(e) => handleChange("screen", e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                >
                  {SCREENS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400">Tapping the notification opens this screen.</p>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Rollout slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Rollout</label>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full transition-colors ${rolloutColor}`}>
                    {form.rolloutPercent === 100 ? "100% — All devices" : `${form.rolloutPercent}% of users`}
                  </span>
                </div>

                <input
                  type="range"
                  min={1}
                  max={100}
                  step={1}
                  value={form.rolloutPercent}
                  onChange={(e) => handleChange("rolloutPercent", Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-red-500 bg-gray-200"
                />

                <div className="flex justify-between text-xs text-gray-400">
                  <span>1%</span>
                  <span className="text-gray-500 text-center">
                    {form.rolloutPercent < 100
                      ? "Random users will be selected"
                      : "Send to everyone"}
                  </span>
                  <span>100%</span>
                </div>

                {form.rolloutPercent < 100 && (
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                    <span>🎲</span>
                    <span>~{form.rolloutPercent}% of total devices will be randomly selected</span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Schedule */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Send Time</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["now", "later"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleChange("scheduleType", type)}
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
                    <label className="text-sm font-medium text-orange-800">Hours from now</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0.5"
                        max="720"
                        step="0.5"
                        value={form.scheduleHours}
                        onChange={(e) => handleChange("scheduleHours", e.target.value)}
                        placeholder="e.g. 2.5"
                        className={`w-32 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                          errors.scheduleHours ? "border-red-400" : "border-orange-200"
                        }`}
                      />
                      <span className="text-sm text-gray-500">hours</span>
                    </div>
                    {scheduledTime && (
                      <p className="text-xs text-orange-700">📅 Sends at <strong>{scheduledTime}</strong></p>
                    )}
                    {errors.scheduleHours && <p className="text-red-500 text-xs">{errors.scheduleHours}</p>}
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
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {form.scheduleType === "later" ? "Scheduling..." : "Sending..."}
                </>
              ) : form.scheduleType === "later"
                ? "🕒 Schedule Notification"
                : form.rolloutPercent < 100
                ? `🚀 Send to ${form.rolloutPercent}% of Devices`
                : "🚀 Send to All Devices"}
            </button>
          </div>

          {/* ── RIGHT: Live Preview ──────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-6 space-y-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Live Preview</p>

              {/* Android mockup */}
              <div className="bg-gray-900 rounded-2xl p-4 space-y-3">
                {/* Status bar */}
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

                {/* Notification card */}
                <div className="bg-white/[0.12] rounded-xl overflow-hidden">
                  {imagePreview ? (
                    <div className="w-full overflow-hidden" style={{ aspectRatio: "2/1" }}>
                      <img
                        src={imagePreview}
                        alt="banner"
                        className="w-full h-full object-cover"
                        onError={() => setImagePreview("")}
                      />
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-center bg-white/5" style={{ aspectRatio: "2/1" }}>
                      <span className="text-white/20 text-xs">No image</span>
                    </div>
                  )}
                  <div className="p-3 flex gap-2.5 items-start">
                    <div className="w-7 h-7 bg-red-500 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">L</div>
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
                {form.screen && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                    <span>🔗</span>
                    <span>Opens <strong>{SCREENS.find(s => s.value === form.screen)?.label}</strong></span>
                  </div>
                )}
                {form.rolloutPercent < 100 && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                    <span>🎲</span>
                    <span>Rollout: <strong>{form.rolloutPercent}%</strong> of devices</span>
                  </div>
                )}
                {form.scheduleType === "later" && scheduledTime && (
                  <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
                    <span>🕒</span>
                    <span>Scheduled: <strong>{scheduledTime}</strong></span>
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
                  { label: "Deep link", done: !!form.screen, optional: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.done ? "bg-green-500" : item.optional ? "bg-gray-100" : "bg-red-100"
                    }`}>
                      {item.done ? (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <div className={`w-1.5 h-1.5 rounded-full ${item.optional ? "bg-gray-300" : "bg-red-300"}`} />
                      )}
                    </div>
                    <span className={item.done ? "text-gray-700 font-medium" : item.optional ? "text-gray-400" : "text-gray-500"}>
                      {item.label}
                      {item.optional && !item.done && <span className="text-gray-300 ml-1">(optional)</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
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