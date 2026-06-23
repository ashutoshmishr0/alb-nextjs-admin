// components/puja/RitualsTab.tsx
import React, { useState, useRef } from 'react';
import { X, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from 'react-image-crop';

// ── Crop helpers ──────────────────────────────────────────────
const MAIN_ASPECT = 1536 / 1024;
const MOBILE_ASPECT = 300 / 300;
const LAPTOP_ASPECT = 1280 / 720;

const MAIN_OUTPUT = { w: 1536, h: 1024 };
const MOBILE_OUTPUT = { w: 300, h: 300 };
const LAPTOP_OUTPUT = { w: 1280, h: 720 };

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
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0, 0, outputW, outputH
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { resolve(null); return; }
        resolve(new File([blob], fileName, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.92
    );
  });
}

// ── Crop Modal ────────────────────────────────────────────────
interface CropModalProps {
  imgSrc: string;
  aspect: number;
  label: string;
  outputW: number;
  outputH: number;
  onConfirm: (file: File, preview: string) => void;
  onCancel: () => void;
}

const CropModal: React.FC<CropModalProps> = ({
  imgSrc, aspect, label, outputW, outputH, onConfirm, onCancel
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(makeCenteredCrop(width, height, aspect));
  };

  const handleConfirm = async () => {
    if (!imgRef.current || !completedCrop || completedCrop.width === 0) return;
    const file = await getCroppedFile(
      imgRef.current, completedCrop, outputW, outputH,
      `image-${Date.now()}.jpg`
    );
    if (!file) return;
    onConfirm(file, URL.createObjectURL(file));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Crop Image</h2>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex justify-center max-h-[55vh] overflow-auto rounded-lg bg-gray-50 border border-gray-200">
          {imgSrc && (
            <ReactCrop
              crop={crop}
              onChange={(_, pct) => setCrop(pct)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
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
          )}
        </div>

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Crop & Use
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

// ── Image Upload Box ──────────────────────────────────────────
interface UploadBoxProps {
  label: string;
  required?: boolean;
  previewSrc: string;
  hint: string;
  error?: string;
  onClick: () => void;
  aspectLabel: string;
}

const UploadBox: React.FC<UploadBoxProps> = ({
  label, required, previewSrc, hint, error, onClick, aspectLabel
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
      <span className="ml-2 text-xs text-gray-400 font-normal">({aspectLabel})</span>
    </label>
    <div
      onClick={onClick}
      className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all hover:border-red-400 hover:bg-red-50/20 ${
        error ? 'border-red-400 bg-red-50' : previewSrc ? 'border-gray-300 bg-white' : 'border-gray-300 bg-gray-50'
      }`}
    >
      {previewSrc ? (
        <div className="space-y-2">
          <div
            className="mx-auto overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-gray-100"
            style={{ height: '160px' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSrc} alt="Preview" className="w-full h-full object-contain" />
          </div>
          <p className="text-xs text-gray-500">Click to change image</p>
        </div>
      ) : (
        <div className="py-4">
          <Upload className="w-9 h-9 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700 mb-1">Upload {label}</p>
          <p className="text-xs text-gray-400">{hint}</p>
        </div>
      )}
    </div>
    {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
  </div>
);

// ── Main Component ────────────────────────────────────────────
interface RitualsTabProps {
  fieldErrors: Record<string, string>;
  // Images
  imagePreview: string;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  mobileImagePreview: string;
  handleMobileImageUpload: (file: File, previewUrl: string) => void;
  setMobileImage: React.Dispatch<React.SetStateAction<{ file: string; bytes: File | null; url: string }>>;
  mobileImage: { file: string; bytes: File | null; url: string };
  setMobileImagePreview: React.Dispatch<React.SetStateAction<string>>;
  // Laptop Image
  laptopImagePreview: string;
  handleLaptopImageUpload: (file: File, previewUrl: string) => void;
  setLaptopImage: React.Dispatch<React.SetStateAction<{ file: string; bytes: File | null; url: string }>>;
  laptopImage: { file: string; bytes: File | null; url: string };
  setLaptopImagePreview: React.Dispatch<React.SetStateAction<string>>;
  // Vedic Procedure
  vedicProcedure: any[];
  setVedicProcedure: React.Dispatch<React.SetStateAction<any[]>>;
  // Sacred Rituals
  sacredRituals: any[];
  setSacredRituals: React.Dispatch<React.SetStateAction<any[]>>;
  // Aashirwad Box
  aashirwadBox: string[];
  setAashirwadBox: React.Dispatch<React.SetStateAction<string[]>>;
  // Benefit Points
  benefitPoints: any[];
  setBenefitPoints: React.Dispatch<React.SetStateAction<any[]>>;
}

const RitualsTab = ({
  fieldErrors,
  imagePreview,
  handleImageUpload,
  mobileImagePreview,
  handleMobileImageUpload,
  setMobileImage,
  mobileImage,
  setMobileImagePreview,
  laptopImagePreview,
  handleLaptopImageUpload,
  setLaptopImage,
  laptopImage,
  setLaptopImagePreview,
  vedicProcedure,
  setVedicProcedure,
  sacredRituals,
  setSacredRituals,
  aashirwadBox,
  setAashirwadBox,
  benefitPoints,
  setBenefitPoints,
}: RitualsTabProps) => {
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const mobileImageInputRef = useRef<HTMLInputElement>(null);
  const laptopImageInputRef = useRef<HTMLInputElement>(null);

  const [cropModal, setCropModal] = useState<{
    open: boolean;
    imgSrc: string;
    type: 'main' | 'mobile' | 'laptop';
  }>({ open: false, imgSrc: '', type: 'main' });

  const mainPreviewSrc = imagePreview || '';
  const mobilePreviewSrc = mobileImagePreview || '';
  const laptopPreviewSrc = laptopImagePreview || '';

  const openFilePicker = (type: 'main' | 'mobile' | 'laptop') => {
    if (type === 'main') mainImageInputRef.current?.click();
    else if (type === 'mobile') mobileImageInputRef.current?.click();
    else laptopImageInputRef.current?.click();
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'main' | 'mobile' | 'laptop'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropModal({ open: true, imgSrc: reader.result as string, type });
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = (file: File, preview: string) => {
    if (cropModal.type === 'main') {
      const dt = new DataTransfer();
      dt.items.add(file);
      const fakeEvent = {
        target: { files: dt.files, value: '' },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleImageUpload(fakeEvent);
    } else if (cropModal.type === 'mobile') {
      handleMobileImageUpload(file, preview);
    } else if (cropModal.type === 'laptop') {
      handleLaptopImageUpload(file, preview);
    }
    setCropModal({ open: false, imgSrc: '', type: 'main' });
  };

  const handleCropCancel = () => {
    setCropModal({ open: false, imgSrc: '', type: 'main' });
  };

  return (
    <div className="space-y-8">

      {/* ── Benefit Points ────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Benefit Points <span className="text-gray-400">(Optional)</span>
          </label>
          <button
            type="button"
            onClick={() => {
              const newId = benefitPoints.length > 0
                ? Math.max(...benefitPoints.map(item => item.id || 0)) + 1
                : 1;
              setBenefitPoints([...benefitPoints, { id: newId, title: '', description: '', icon: 'Star' }]);
            }}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
          >
            <Plus className="w-3 h-3" /> Add Benefit Point
          </button>
        </div>
        {benefitPoints.map((item, index) => (
          <div key={item.id || index} className="flex gap-3 mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
            <div className="w-20">
              <input
                type="text"
                value={item.icon}
                onChange={(e) => {
                  const updated = [...benefitPoints];
                  updated[index].icon = e.target.value;
                  setBenefitPoints(updated);
                }}
                placeholder="Icon"
                className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={item.title}
                onChange={(e) => {
                  const updated = [...benefitPoints];
                  updated[index].title = e.target.value;
                  setBenefitPoints(updated);
                }}
                placeholder="Title"
                className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm mb-2"
              />
              <textarea
                value={item.description}
                onChange={(e) => {
                  const updated = [...benefitPoints];
                  updated[index].description = e.target.value;
                  setBenefitPoints(updated);
                }}
                placeholder="Description"
                rows={2}
                className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => benefitPoints.length > 1 && setBenefitPoints(benefitPoints.filter((_, i) => i !== index))}
              className="p-1 text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* ── Vedic Procedure ───────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Vedic Procedure <span className="text-gray-400">(Optional)</span>
          </label>
          <button
            type="button"
            onClick={() => {
              const newId = vedicProcedure.length > 0
                ? Math.max(...vedicProcedure.map(item => item.id || 0)) + 1
                : 1;
              setVedicProcedure([...vedicProcedure, { id: newId, pointNumber: vedicProcedure.length + 1, title: '', description: '' }]);
            }}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
          >
            <Plus className="w-3 h-3" /> Add Step
          </button>
        </div>
        {vedicProcedure.map((item, index) => (
          <div key={item.id || index} className="flex gap-3 mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
            <div className="w-16">
              <input
                type="number"
                value={item.pointNumber}
                onChange={(e) => {
                  const updated = [...vedicProcedure];
                  updated[index].pointNumber = Number(e.target.value);
                  setVedicProcedure(updated);
                }}
                placeholder="#"
                className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={item.title}
                onChange={(e) => {
                  const updated = [...vedicProcedure];
                  updated[index].title = e.target.value;
                  setVedicProcedure(updated);
                }}
                placeholder="Step Title"
                className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm mb-2"
              />
              <textarea
                value={item.description}
                onChange={(e) => {
                  const updated = [...vedicProcedure];
                  updated[index].description = e.target.value;
                  setVedicProcedure(updated);
                }}
                placeholder="Step Description"
                rows={2}
                className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => vedicProcedure.length > 1 && setVedicProcedure(vedicProcedure.filter((_, i) => i !== index))}
              className="p-1 text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* ── Sacred Rituals ────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Sacred Rituals <span className="text-gray-400">(Optional)</span>
          </label>
          <button
            type="button"
            onClick={() => {
              const newId = sacredRituals.length > 0
                ? Math.max(...sacredRituals.map(item => item.id || 0)) + 1
                : 1;
              setSacredRituals([...sacredRituals, { id: newId, icon: '', title: '', description: '' }]);
            }}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
          >
            <Plus className="w-3 h-3" /> Add Ritual
          </button>
        </div>
        {sacredRituals.map((item, index) => (
          <div key={item.id || index} className="flex gap-3 mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
            <div className="w-20">
              <input
                type="text"
                value={item.icon}
                onChange={(e) => {
                  const updated = [...sacredRituals];
                  updated[index].icon = e.target.value;
                  setSacredRituals(updated);
                }}
                placeholder="Icon"
                className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={item.title}
                onChange={(e) => {
                  const updated = [...sacredRituals];
                  updated[index].title = e.target.value;
                  setSacredRituals(updated);
                }}
                placeholder="Ritual Title"
                className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm mb-2"
              />
              <textarea
                value={item.description}
                onChange={(e) => {
                  const updated = [...sacredRituals];
                  updated[index].description = e.target.value;
                  setSacredRituals(updated);
                }}
                placeholder="Ritual Description"
                rows={2}
                className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => sacredRituals.length > 1 && setSacredRituals(sacredRituals.filter((_, i) => i !== index))}
              className="p-1 text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* ── Aashirwad Box ─────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Aashirwad Box <span className="text-gray-400">(Optional)</span>
          </label>
          <button
            type="button"
            onClick={() => setAashirwadBox([...aashirwadBox, ''])}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
          >
            <Plus className="w-3 h-3" /> Add Message
          </button>
        </div>
        {aashirwadBox.map((msg, index) => (
          <div key={index} className="flex gap-3 mb-3">
            <input
              type="text"
              value={msg}
              onChange={(e) => {
                const updated = [...aashirwadBox];
                updated[index] = e.target.value;
                setAashirwadBox(updated);
              }}
              placeholder="Enter Aashirwad message"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <button
              type="button"
              onClick={() => aashirwadBox.length > 1 && setAashirwadBox(aashirwadBox.filter((_, i) => i !== index))}
              className="p-2 text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};

export default RitualsTab;