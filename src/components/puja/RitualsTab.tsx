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
const MAIN_ASPECT = 1536 / 1024;   // landscape ~1.5
const MOBILE_ASPECT = 300 / 300;   // portrait  ~0.857
const LAPTOP_ASPECT = 1280 / 720;  // landscape ~1.78

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
            <p className="text-xs text-gray-400 mt-0.5">
              {label}
            </p>
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
          <div className="mx-auto overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-gray-100"
            style={{ height: '160px' }}>
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
  inputFieldDetail: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
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
  // ✅ NEW: benefitPoints
  benefitPoints: any[];
  setBenefitPoints: React.Dispatch<React.SetStateAction<any[]>>;
}

const RitualsTab = ({
  inputFieldDetail,
  handleInputChange,
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
  // ✅ NEW: benefitPoints
  benefitPoints,
  setBenefitPoints
}: RitualsTabProps) => {
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const mobileImageInputRef = useRef<HTMLInputElement>(null);
  const laptopImageInputRef = useRef<HTMLInputElement>(null);

  // Crop modal state
  const [cropModal, setCropModal] = useState<{
    open: boolean;
    imgSrc: string;
    type: 'main' | 'mobile' | 'laptop';
  }>({ open: false, imgSrc: '', type: 'main' });

  // Preview URLs
  const mainPreviewSrc = imagePreview || '';
  const mobilePreviewSrc = mobileImagePreview || '';
  const laptopPreviewSrc = laptopImagePreview || '';

  // Open file picker
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

    // Size guard: 5MB
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
      // Use handleImageUpload (already works)
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
      {/* ── Images Section ─────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-red-600" />
          <h2 className="text-xl font-semibold text-gray-800">Images</h2>
        </div>

        {/* 3 Images side by side */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Desktop (Main) Image */}
          <UploadBox
            label="Desktop Image"
            required
            previewSrc={mainPreviewSrc}
            hint="Landscape · 1536×1024px · JPG/PNG · max 5MB"
            error={fieldErrors['mainImage']}
            onClick={() => openFilePicker('main')}
            aspectLabel="Landscape"
          />

          {/* Mobile Image */}
          <UploadBox
            label="Mobile Image"
            required={false}
            previewSrc={mobilePreviewSrc}
            hint="Portrait · JPG/PNG · max 5MB"
            error={fieldErrors['mobileImage']}
            onClick={() => openFilePicker('mobile')}
            aspectLabel="Portrait"
          />

          {/* Laptop Image */}
          <UploadBox
            label="Laptop Image"
            required={false}
            previewSrc={laptopPreviewSrc}
            hint="Landscape · JPG/PNG · max 5MB"
            error={fieldErrors['laptopImage']}
            onClick={() => openFilePicker('laptop')}
            aspectLabel="Landscape"
          />
        </div>

        {/* Hidden file inputs */}
        <input
          ref={mainImageInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => handleFileChange(e, 'main')}
        />
        <input
          ref={mobileImageInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => handleFileChange(e, 'mobile')}
        />
        <input
          ref={laptopImageInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => handleFileChange(e, 'laptop')}
        />
      </div>

      {/* ── Crop Modal ─────────────────────────────────────── */}
      {cropModal.open && (
        <CropModal
          imgSrc={cropModal.imgSrc}
          aspect={cropModal.type === 'main' ? MAIN_ASPECT : cropModal.type === 'mobile' ? MOBILE_ASPECT : LAPTOP_ASPECT}
          label={cropModal.type === 'main' ? 'Desktop Image' : cropModal.type === 'mobile' ? 'Mobile Image' : 'Laptop Image'}
          outputW={cropModal.type === 'main' ? MAIN_OUTPUT.w : cropModal.type === 'mobile' ? MOBILE_OUTPUT.w : LAPTOP_OUTPUT.w}
          outputH={cropModal.type === 'main' ? MAIN_OUTPUT.h : cropModal.type === 'mobile' ? MOBILE_OUTPUT.h : LAPTOP_OUTPUT.h}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      {/* ── Rest of the fields ────────────────────────────────── */}
      
      {/* Pooja Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pooja Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="pujaName"
          value={inputFieldDetail.pujaName}
          onChange={handleInputChange}
          placeholder="Enter Pooja Name"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
            fieldErrors.pujaName ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {fieldErrors.pujaName && (
          <p className="mt-1 text-sm text-red-500">{fieldErrors.pujaName}</p>
        )}
      </div>

      {/* Overview */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Overview <span className="text-red-500">*</span>
        </label>
        <textarea
          name="overview"
          value={inputFieldDetail.overview}
          onChange={handleInputChange}
          rows={4}
          placeholder="Enter Pooja Description/Overview"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
            fieldErrors.overview ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {fieldErrors.overview && (
          <p className="mt-1 text-sm text-red-500">{fieldErrors.overview}</p>
        )}
      </div>

      {/* Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Price <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="price"
          value={inputFieldDetail.price}
          onChange={handleInputChange}
          placeholder="Enter Price (e.g. 499)"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
            fieldErrors.price ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {fieldErrors.price && (
          <p className="mt-1 text-sm text-red-500">{fieldErrors.price}</p>
        )}
      </div>

      {/* Tag */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tag <span className="text-gray-400">(Optional)</span>
        </label>
        <input
          type="text"
          name="tag"
          value={inputFieldDetail.tag || ''}
          onChange={handleInputChange}
          placeholder="e.g. Most Popular, Best Value, Limited Time"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>

      {/* SubTitle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          SubTitle <span className="text-gray-400">(Optional)</span>
        </label>
        <input
          type="text"
          name="subTitle"
          value={inputFieldDetail.subTitle || ''}
          onChange={handleInputChange}
          placeholder="e.g. Book this puja for peace and prosperity"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Duration <span className="text-gray-400">(Optional)</span>
        </label>
        <input
          type="text"
          name="duration"
          value={inputFieldDetail.duration}
          onChange={handleInputChange}
          placeholder="e.g. 2-3 hours"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>

      {/* Venue */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Venue <span className="text-gray-400">(Optional)</span>
        </label>
        <input
          type="text"
          name="pujaVenue"
          value={inputFieldDetail.pujaVenue || ''}
          onChange={handleInputChange}
          placeholder="e.g. Temple Name or Location"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>

      {/* ✅ NEW: Benefit Points */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Benefit Points <span className="text-gray-400">(Optional)</span>
          </label>
          <button
            type="button"
            onClick={() => {
              const newId = benefitPoints.length > 0 ? Math.max(...benefitPoints.map(item => item.id || 0)) + 1 : 1;
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
                  const newPoints = [...benefitPoints];
                  newPoints[index].icon = e.target.value;
                  setBenefitPoints(newPoints);
                }}
                placeholder="Icon (e.g. Star)"
                className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={item.title}
                onChange={(e) => {
                  const newPoints = [...benefitPoints];
                  newPoints[index].title = e.target.value;
                  setBenefitPoints(newPoints);
                }}
                placeholder="Title"
                className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm mb-2"
              />
              <textarea
                value={item.description}
                onChange={(e) => {
                  const newPoints = [...benefitPoints];
                  newPoints[index].description = e.target.value;
                  setBenefitPoints(newPoints);
                }}
                placeholder="Description"
                rows={2}
                className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (benefitPoints.length > 1) {
                  setBenefitPoints(benefitPoints.filter((_, i) => i !== index));
                }
              }}
              className="p-1 text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* ✅ NEW: Vedic Procedure */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Vedic Procedure <span className="text-gray-400">(Optional)</span>
          </label>
          <button
            type="button"
            onClick={() => {
              const newId = vedicProcedure.length > 0 ? Math.max(...vedicProcedure.map(item => item.id || 0)) + 1 : 1;
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
                  const newVedic = [...vedicProcedure];
                  newVedic[index].pointNumber = Number(e.target.value);
                  setVedicProcedure(newVedic);
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
                  const newVedic = [...vedicProcedure];
                  newVedic[index].title = e.target.value;
                  setVedicProcedure(newVedic);
                }}
                placeholder="Step Title"
                className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm mb-2"
              />
              <textarea
                value={item.description}
                onChange={(e) => {
                  const newVedic = [...vedicProcedure];
                  newVedic[index].description = e.target.value;
                  setVedicProcedure(newVedic);
                }}
                placeholder="Step Description"
                rows={2}
                className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (vedicProcedure.length > 1) {
                  setVedicProcedure(vedicProcedure.filter((_, i) => i !== index));
                }
              }}
              className="p-1 text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* ✅ NEW: Sacred Rituals */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Sacred Rituals <span className="text-gray-400">(Optional)</span>
          </label>
          <button
            type="button"
            onClick={() => {
              const newId = sacredRituals.length > 0 ? Math.max(...sacredRituals.map(item => item.id || 0)) + 1 : 1;
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
                  const newRituals = [...sacredRituals];
                  newRituals[index].icon = e.target.value;
                  setSacredRituals(newRituals);
                }}
                placeholder="Icon (e.g. Star)"
                className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={item.title}
                onChange={(e) => {
                  const newRituals = [...sacredRituals];
                  newRituals[index].title = e.target.value;
                  setSacredRituals(newRituals);
                }}
                placeholder="Ritual Title"
                className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm mb-2"
              />
              <textarea
                value={item.description}
                onChange={(e) => {
                  const newRituals = [...sacredRituals];
                  newRituals[index].description = e.target.value;
                  setSacredRituals(newRituals);
                }}
                placeholder="Ritual Description"
                rows={2}
                className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (sacredRituals.length > 1) {
                  setSacredRituals(sacredRituals.filter((_, i) => i !== index));
                }
              }}
              className="p-1 text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* ✅ NEW: Aashirwad Box */}
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
                const newBox = [...aashirwadBox];
                newBox[index] = e.target.value;
                setAashirwadBox(newBox);
              }}
              placeholder="Enter Aashirwad message"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <button
              type="button"
              onClick={() => {
                if (aashirwadBox.length > 1) {
                  setAashirwadBox(aashirwadBox.filter((_, i) => i !== index));
                }
              }}
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