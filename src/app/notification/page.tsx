'use client';

import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import Swal from 'sweetalert2';
import { Tooltip } from '@mui/material';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from 'react-image-crop';
interface Campaign {
  _id: string;
  title: string;
  body: string;
  imageUrl: string;
  targetType: 'all' | 'selected';
  targetPhones: string[];
  scheduledAt: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

interface FormState {
  title: string;
  body: string;
  imageUrl: string;
  scheduledAt: string;
  targetType: 'all' | 'selected';
  percentage: number;
}

interface FormErrors {
  title: string;
  body: string;
  scheduledAt: string;
  phones: string;
  imageUrl: string;
}

const DRAFT_KEY = 'notif_campaign_draft';
const IMAGE_MAX_MB = 2;

const INITIAL_FORM: FormState = {
  title: '',
  body: '',
  imageUrl: '',
  scheduledAt: '',
  targetType: 'all',
  percentage: 100,
};

const INITIAL_ERRORS: FormErrors = {
  title: '',
  body: '',
  scheduledAt: '',
  phones: '',
  imageUrl: '',
};

function loadDraft(): { form: FormState; phones: string[] } | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveDraft(form: FormState, phones: string[]) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, phones })); } catch {}
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}

const StatusBadge = ({ status }: { status: Campaign['status'] }) => {
  const map: Record<Campaign['status'], { label: string; classes: string }> = {
    pending: { label: 'Pending', classes: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
    running: { label: 'Running', classes: 'bg-blue-100 text-blue-700 border border-blue-200' },
    done:    { label: 'Done',    classes: 'bg-green-100 text-green-700 border border-green-200' },
    failed:  { label: 'Failed',  classes: 'bg-red-100 text-red-700 border border-red-200' },
  };
  const { label, classes } = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-pulse" />}
      {label}
    </span>
  );
};

const TargetBadge = ({ type, count }: { type: 'all' | 'selected'; count: number }) =>
  type === 'all' ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
      All customers
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200">
      {count} selected
    </span>
  );

const TrashSvg = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const NOTIF_ASPECT = 2 / 1;
const NOTIF_OUTPUT = { w: 1024, h: 512 };

function makeCenteredCrop(mediaW: number, mediaH: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaW, mediaH),
    mediaW,
    mediaH
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
            <p className="text-xs text-gray-400 mt-0.5">
              Notification banner · 2:1 ratio (1024×512px output)
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
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


export default function NotificationCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>(INITIAL_ERRORS);
  const [phones, setPhones] = useState<string[]>([]);
  const [phoneInput, setPhoneInput] = useState('');
  const [showForm, setShowForm] = useState(true);
  const [eligibleCount, setEligibleCount] = useState<number | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [cropSrc, setCropSrc] = useState('');

  // Image upload state
  const [imagePreview, setImagePreview] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const phoneInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetedCount =
    eligibleCount !== null ? Math.round((form.percentage / 100) * eligibleCount) : null;

  // ── Draft restore on mount ──────────────────────────────────────────────
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setForm(draft.form);
      setPhones(draft.phones);
      if (draft.form.imageUrl) setImagePreview(draft.form.imageUrl);
      setDraftRestored(true);
      setTimeout(() => setDraftRestored(false), 4000);
    }
  }, []);

  // ── Auto-save draft on every change ────────────────────────────────────
  useEffect(() => {
    saveDraft(form, phones);
  }, [form, phones]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mobile/eligible-count`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setEligibleCount(d.count); })
      .catch(() => {});
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mobile/list`, { credentials: 'include' });
      const data = await res.json();
      if (data.success && Array.isArray(data.campaigns)) {
        setCampaigns(data.campaigns.sort(
          (a: Campaign, b: Campaign) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleTargetChange = (val: 'all' | 'selected') => {
    setForm(prev => ({ ...prev, targetType: val }));
    if (val === 'all') { setPhones([]); setErrors(prev => ({ ...prev, phones: '' })); }
  };

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, percentage: Number(e.target.value) }));
  };

  // ── Image upload helpers ────────────────────────────────────────────────
  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, imageUrl: 'Please select a valid image file.' }));
      return;
    }
    if (file.size > IMAGE_MAX_MB * 1024 * 1024) {
      setErrors(prev => ({ ...prev, imageUrl: `Image must be under ${IMAGE_MAX_MB}MB.` }));
      return;
    }

    setImageUploading(true);
    setErrors(prev => ({ ...prev, imageUrl: '' }));

    try {
      const formData = new FormData();
      formData.append('image', file);

      const uploadRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/shopify/notify/upload-image`,
        { method: 'POST', body: formData, credentials: 'include' }
      );
      const uploadData = await uploadRes.json();

      if (uploadData.success && uploadData.url) {
        setForm(prev => ({ ...prev, imageUrl: uploadData.url }));
        setImagePreview(uploadData.url);
      } else {
        setErrors(prev => ({ ...prev, imageUrl: 'Upload failed. Try again.' }));
      }
    } catch {
      setErrors(prev => ({ ...prev, imageUrl: 'Upload failed. Check your connection.' }));
    } finally {
      setImageUploading(false);
    }
  };

    // REPLACE the existing handleFileInput
    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, imageUrl: 'Please select a valid image file.' }));
        return;
    }
    if (file.size > IMAGE_MAX_MB * 1024 * 1024) {
        setErrors(prev => ({ ...prev, imageUrl: `Image must be under ${IMAGE_MAX_MB}MB.` }));
        return;
    }
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    };

    // REPLACE the existing handleDrop
    const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, imageUrl: 'Please select a valid image file.' }));
        return;
    }
    if (file.size > IMAGE_MAX_MB * 1024 * 1024) {
        setErrors(prev => ({ ...prev, imageUrl: `Image must be under ${IMAGE_MAX_MB}MB.` }));
        return;
    }
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    };
  const removeImage = () => {
    setForm(prev => ({ ...prev, imageUrl: '' }));
    setImagePreview('');
    setErrors(prev => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Phone helpers ───────────────────────────────────────────────────────
  const addPhone = () => {
    const num = phoneInput.trim();
    if (!num) return;
    if (!/^\d{7,15}$/.test(num)) {
      setErrors(prev => ({ ...prev, phones: 'Enter a valid phone number (7-15 digits).' }));
      return;
    }
    if (phones.includes(num)) {
      setErrors(prev => ({ ...prev, phones: 'This number is already added.' }));
      return;
    }
    setPhones(prev => [...prev, num]);
    setPhoneInput('');
    setErrors(prev => ({ ...prev, phones: '' }));
    phoneInputRef.current?.focus();
  };

  const removePhone = (num: string) => setPhones(prev => prev.filter(p => p !== num));

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addPhone(); }
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setPhones([]);
    setErrors(INITIAL_ERRORS);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    clearDraft();
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleCreate = async (mode: 'now' | 'schedule' = 'schedule') => {
    const newErrors = { ...INITIAL_ERRORS };
    let valid = true;

    if (!form.title.trim()) { newErrors.title = 'Title is required.'; valid = false; }
    if (!form.body.trim()) { newErrors.body = 'Message body is required.'; valid = false; }
    if (mode === 'schedule') {
      if (!form.scheduledAt) { newErrors.scheduledAt = 'Please pick a schedule date & time.'; valid = false; }
      else if (new Date(form.scheduledAt) <= new Date()) {
        newErrors.scheduledAt = 'Scheduled time must be in the future.'; valid = false;
      }
    }
    if (form.targetType === 'selected' && phones.length === 0) {
      newErrors.phones = 'Add at least one phone number.'; valid = false;
    }

    setErrors(newErrors);
    if (!valid) return;
    setSubmitting(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mobile/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title.trim(),
          body: form.body.trim(),
          imageUrl: form.imageUrl.trim(),
          scheduledAt: mode === 'now' ? new Date().toISOString() : form.scheduledAt,
          targetType: form.targetType,
          targetPhones: form.targetType === 'selected' ? phones : [],
          percentage: form.targetType === 'all' ? form.percentage : 100,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to create campaign.');

      if (mode === 'now') {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mobile/trigger/${data.campaign._id}`, {
          method: 'POST', credentials: 'include',
        });
        Swal.fire({ icon: 'success', title: 'Sent!', text: 'Notifications are being dispatched now.', timer: 2000, showConfirmButton: false });
      } else {
        Swal.fire({ icon: 'success', title: 'Campaign scheduled!', timer: 2000, showConfirmButton: false });
      }

      resetForm();
      fetchCampaigns();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrigger = async (campaign: Campaign) => {
    const result = await Swal.fire({
      title: 'Send now?',
      text: `This will immediately dispatch "${campaign.title}" to ${campaign.targetType === 'all' ? 'all customers' : `${campaign.targetPhones.length} customer(s)`}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1f2937',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, send now',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;

    Swal.fire({ title: 'Sending...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mobile/trigger/${campaign._id}`, {
        method: 'POST', credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'Triggered!', text: 'Notifications are being sent in the background.', timer: 2000, showConfirmButton: false });
        setTimeout(fetchCampaigns, 3000);
      } else throw new Error(data.message);
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    }
  };

  const handleDelete = async (campaign: Campaign) => {
    const result = await Swal.fire({
      title: 'Delete campaign?',
      text: `"${campaign.title}" will be permanently removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;

    Swal.fire({ title: 'Deleting...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mobile/campaign/${campaign._id}`, {
        method: 'DELETE', credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns(prev => prev.filter(c => c._id !== campaign._id));
        Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false });
      } else throw new Error(data.message || 'Delete failed.');
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    }
  };

  const minDatetime = moment().add(1, 'minute').format('YYYY-MM-DDTHH:mm');

  return (
    <div className="p-6 min-h-screen bg-gray-50">

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-sm flex-shrink-0">
            <img src="/logo2.png" alt="image" className="w-10 h-10 rounded-xl" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 leading-tight">Notification Campaigns</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-gray-400">Schedule push notifications to customers</p>
              {eligibleCount !== null && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs font-medium text-green-600">
                    {eligibleCount.toLocaleString()} eligible devices
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          {showForm ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Hide form
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New campaign
            </>
          )}
        </button>
      </div>

      {/* Draft restored banner */}
      {draftRestored && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Draft restored from your last session.</span>
          <button onClick={resetForm} className="ml-auto text-xs underline hover:no-underline">
            Clear draft
          </button>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">Create campaign</h2>
            <p className="text-xs text-gray-400 mt-0.5">Fill in the details and pick a time. The cron job will fire it automatically.</p>
          </div>

          <div className="p-6 space-y-5">

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notification title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleFormChange}
                placeholder="e.g. Special offer just for you!"
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-red-100 transition
                  ${errors.title ? 'border-red-400' : 'border-gray-300 focus:border-red-400'}`}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message body <span className="text-red-500">*</span>
              </label>
              <textarea
                name="body"
                value={form.body}
                onChange={handleFormChange}
                placeholder="Write your notification message here..."
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-red-100 transition resize-none
                  ${errors.body ? 'border-red-400' : 'border-gray-300 focus:border-red-400'}`}
              />
              <div className="flex justify-between mt-1">
                {errors.body ? <p className="text-red-500 text-xs">{errors.body}</p> : <span />}
                <span className="text-xs text-gray-400">{form.body.length} chars</span>
              </div>
            </div>

            {/* ── Image Upload ──────────────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Notification image <span className="text-xs font-normal text-gray-400 ml-1">(optional)</span>
                </label>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  1024 × 512 px recommended · max {IMAGE_MAX_MB}MB
                </span>
              </div>

              {/* Drop zone */}
              {!imagePreview ? (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all
                    ${dragOver
                      ? 'border-red-400 bg-red-50'
                      : errors.imageUrl
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 bg-gray-50 hover:border-red-300 hover:bg-red-50/30'}`}
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600">Drop image or <span className="text-red-500 font-medium">browse</span></p>
                      <p className="text-xs text-gray-400">PNG, JPG, WEBP</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileInput}
                    disabled={imageUploading}
                  />
                </div>
              ) : (
                /* Preview */
                <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100" style={{ aspectRatio: '2/1' }}>
                  <img src={imagePreview} alt="Notification banner preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs transition"
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                    ✓ Uploaded
                  </div>
                </div>
              )}

              {errors.imageUrl && <p className="text-red-500 text-xs mt-1">{errors.imageUrl}</p>}

              {/* URL fallback */}
              <div className="mt-2">
                <label className="text-xs text-gray-400">Or paste image URL</label>
                <input
                  type="url"
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={e => {
                    handleFormChange(e);
                    setImagePreview(e.target.value);
                  }}
                  placeholder="https://example.com/banner.jpg"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition"
                />
              </div>
            </div>

            {/* Target + Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Send to</label>
                <div className="flex gap-3">
                  {(['all', 'selected'] as const).map(val => (
                    <label
                      key={val}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border cursor-pointer text-sm font-medium transition
                        ${form.targetType === val
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                      <input
                        type="radio"
                        name="targetType"
                        value={val}
                        checked={form.targetType === val}
                        onChange={() => handleTargetChange(val)}
                        className="hidden"
                      />
                      {val === 'all' ? (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          All customers
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Select by phone
                        </>
                      )}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule date & time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  value={form.scheduledAt}
                  min={minDatetime}
                  onChange={handleFormChange}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-red-100 transition
                    ${errors.scheduledAt ? 'border-red-400' : 'border-gray-300 focus:border-red-400'}`}
                />
                {errors.scheduledAt && <p className="text-red-500 text-xs mt-1">{errors.scheduledAt}</p>}
              </div>
            </div>

            {/* Phone selector */}
            {form.targetType === 'selected' && (
              <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50 p-4">
                <label className="block text-sm font-medium text-indigo-800 mb-2">Customer phone numbers</label>
                <div className="flex gap-2">
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    value={phoneInput}
                    onChange={e => { setPhoneInput(e.target.value); setErrors(prev => ({ ...prev, phones: '' })); }}
                    onKeyDown={handlePhoneKeyDown}
                    placeholder="e.g. 9876543210"
                    className="flex-1 px-3 py-2 rounded-lg border border-indigo-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
                  />
                  <button
                    type="button"
                    onClick={addPhone}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {errors.phones
                  ? <p className="text-red-500 text-xs mt-1">{errors.phones}</p>
                  : <p className="text-indigo-500 text-xs mt-1">Press Enter or click Add after each number.</p>
                }
                {phones.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {phones.map(num => (
                      <span key={num} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-medium">
                        {num}
                        <button type="button" onClick={() => removePhone(num)} aria-label={`Remove ${num}`}
                          className="w-4 h-4 flex items-center justify-center rounded-full bg-indigo-200 hover:bg-indigo-300 text-indigo-700 transition-colors">
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-center py-3 text-indigo-400 text-xs">No numbers added yet</div>
                )}
              </div>
            )}

            {/* Submit row */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400">The cron job checks every minute for pending campaigns.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleCreate('now')}
                  disabled={submitting || imageUploading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {submitting
                    ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    : <span>&#x26A1;</span>
                  }
                  Send now
                </button>
                <button
                  type="button"
                  onClick={() => handleCreate('schedule')}
                  disabled={submitting || imageUploading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                  {submitting
                    ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    : <span>&#x1F4C5;</span>
                  }
                  Schedule campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">All campaigns</h2>
          <div className="flex items-center gap-2">
            {!loading && <span className="text-xs text-gray-400">{campaigns.length} total</span>}
            <button onClick={fetchCampaigns} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors" title="Refresh">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <svg className="w-8 h-8 animate-spin mb-3 text-red-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm">Loading campaigns...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <svg className="w-12 h-12 mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm font-medium text-gray-500">No campaigns yet</p>
            <p className="text-xs mt-1">Create your first campaign using the form above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['#', 'Title / Body', 'Image', 'Target', 'Scheduled at', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {campaigns.map((campaign, idx) => (
                  <tr key={campaign._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs w-10">{idx + 1}</td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <Tooltip title={campaign.title}>
                        <p className="font-medium text-gray-900 truncate">{campaign.title}</p>
                      </Tooltip>
                      <Tooltip title={campaign.body}>
                        <p className="text-gray-400 text-xs mt-0.5 truncate">{campaign.body}</p>
                      </Tooltip>
                    </td>
                    <td className="px-4 py-3 w-16">
                      {campaign.imageUrl ? (
                        <img src={campaign.imageUrl} alt="banner"
                          className="w-10 h-10 object-cover rounded-md border border-gray-100"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <TargetBadge type={campaign.targetType} count={campaign.targetPhones.length} />
                      {campaign.targetType === 'selected' && campaign.targetPhones.length > 0 && (
                        <Tooltip title={campaign.targetPhones.join(', ')}>
                          <p className="text-xs text-gray-400 mt-1 truncate max-w-[120px] cursor-pointer">
                            {campaign.targetPhones.slice(0, 2).join(', ')}
                            {campaign.targetPhones.length > 2 && ` +${campaign.targetPhones.length - 2} more`}
                          </p>
                        </Tooltip>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      <p>{moment(campaign.scheduledAt).format('DD MMM YYYY')}</p>
                      <p className="text-xs text-gray-400">{moment(campaign.scheduledAt).format('hh:mm A')}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={campaign.status} /></td>
                    {/* <td className="px-4 py-3">
                      {campaign.status === 'pending' ? (
                        <span className="text-gray-300 text-xs">-</span>
                      ) : (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {campaign.sentCount}
                          </span>
                          <span className="text-gray-300">/</span>
                          <span className="flex items-center gap-1 text-red-500 font-medium">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {campaign.failedCount}
                          </span>
                        </div>
                      )}
                    </td> */}
                    <td className="px-4 py-3">
                      {campaign.status === 'pending' ? (
                        <div className="flex items-center gap-1">
                          <Tooltip title="Send now">
                            <button onClick={() => handleTrigger(campaign)}
                              className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                            </button>
                          </Tooltip>
                          <Tooltip title="Delete campaign">
                            <button onClick={() => handleDelete(campaign)}
                              className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                              <TrashSvg />
                            </button>
                          </Tooltip>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs px-2">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
        {cropSrc && (
        <CropModal
            imgSrc={cropSrc}
            onConfirm={(file) => {
            setCropSrc('');
            uploadImage(file);
            }}
            onCancel={() => setCropSrc('')}
        />
        )}
    </div>
  );
}