'use client';

import React, { useRef, useState } from 'react';
import { Info, Upload, Image as ImageIcon, X, Plus } from 'lucide-react';
import Image from 'next/image';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from 'react-image-crop';

interface Props {
  inputFieldDetail: any;
  handleInputChange: (e: any) => void;
  categories: any[];
  image: any;
  imagePreview: string;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  mobileImage?: any;
  mobileImagePreview?: string;
  handleMobileImageUpload?: (file: File, previewUrl: string) => void;
  handleMainImageUpload?: (file: File, previewUrl: string) => void;
  desktopImage?: any;
  desktopImagePreview?: string;
  handleDesktopImageUpload?: (file: File, previewUrl: string) => void;
  galleryImages: File[];
  galleryPreviews: string[];
  handleGalleryImages: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeGalleryImage: (index: number) => void;
  editId?: string | null;
  fieldErrors?: Record<string, string>;
  existingGalleryImages?: string[];
  removeExistingGalleryImage?: (index: number) => void;
}

// ── Crop helpers ──────────────────────────────────────────────
const MAIN_ASPECT = 1536 / 1024;
const MOBILE_ASPECT = 300 / 300;
const DESKTOP_ASPECT = 1920 / 750;
const MAIN_OUTPUT = { w: 1536, h: 1024 };
const MOBILE_OUTPUT = { w: 300, h: 300 };
const DESKTOP_OUTPUT = { w: 1920, h: 750 };

type ImageType = 'main' | 'mobile' | 'desktop';

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
const BasicInfoTab: React.FC<Props> = ({
  inputFieldDetail,
  handleInputChange,
  categories,
  image,
  imagePreview,
  handleImageUpload,
  mobileImage,
  mobileImagePreview = '',
  handleMobileImageUpload,
  handleMainImageUpload,
  desktopImage,
  desktopImagePreview = '',
  handleDesktopImageUpload,
  galleryImages,
  galleryPreviews,
  handleGalleryImages,
  removeGalleryImage,
  editId,
  fieldErrors = {},
  existingGalleryImages = [],
  removeExistingGalleryImage,
}) => {
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const mobileImageInputRef = useRef<HTMLInputElement>(null);
  const desktopImageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [cropModal, setCropModal] = useState<{
    open: boolean;
    imgSrc: string;
    type: ImageType;
  }>({ open: false, imgSrc: '', type: 'main' });

  // ── Preview sources ──
  const mainPreviewSrc = image?.bytes
    ? imagePreview
    : image?.file
      ? `${process.env.NEXT_PUBLIC_IMAGE_URL3}${image.file}`
      : '';

  const mobilePreviewSrc = mobileImage?.bytes
    ? mobileImagePreview
    : mobileImage?.file
      ? `${process.env.NEXT_PUBLIC_IMAGE_URL3}${mobileImage.file}`
      : mobileImagePreview || '';

  const desktopPreviewSrc = desktopImage?.bytes
    ? desktopImagePreview
    : desktopImage?.file
      ? `${process.env.NEXT_PUBLIC_IMAGE_URL3}${desktopImage.file}`
      : desktopImagePreview || '';

  // ── File picker ──
  const openFilePicker = (type: ImageType) => {
    if (type === 'main') mainImageInputRef.current?.click();
    else if (type === 'mobile') mobileImageInputRef.current?.click();
    else desktopImageInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: ImageType) => {
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
      if (handleMainImageUpload) {
        handleMainImageUpload(file, preview);
      } else {
        const dt = new DataTransfer();
        dt.items.add(file);
        const fakeEvent = {
          target: { files: dt.files, value: '' },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleImageUpload(fakeEvent);
      }
    } else if (cropModal.type === 'mobile') {
      handleMobileImageUpload?.(file, preview);
    } else {
      handleDesktopImageUpload?.(file, preview);
    }
    setCropModal({ open: false, imgSrc: '', type: 'main' });
  };

  const handleCropCancel = () => {
    setCropModal({ open: false, imgSrc: '', type: 'main' });
  };

  // ── Crop modal config by type ──
  const cropConfig = {
    main:    { aspect: MAIN_ASPECT,    outputW: MAIN_OUTPUT.w,    outputH: MAIN_OUTPUT.h,    label: 'Main Image (Landscape 1536×1024)' },
    mobile:  { aspect: MOBILE_ASPECT,  outputW: MOBILE_OUTPUT.w,  outputH: MOBILE_OUTPUT.h,  label: 'Mobile Image (Square 300×300)' },
    desktop: { aspect: DESKTOP_ASPECT, outputW: DESKTOP_OUTPUT.w, outputH: DESKTOP_OUTPUT.h, label: 'Desktop Image (Wide Banner 1920×750)' },
  };

  return (
    <div className="space-y-8">

      {/* ── Images Section ─────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-800">Images</h2>
          </div>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add Gallery Images
          </button>
        </div>

        {/* ── 3-column image upload grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <UploadBox
            label="Main Image"
            required
            previewSrc={mainPreviewSrc}
            hint="Landscape · 1536×1024px · JPG/PNG · max 5MB"
            error={fieldErrors['mainImage']}
            onClick={() => openFilePicker('main')}
            aspectLabel="Landscape"
          />
          <UploadBox
            label="Mobile Image"
            required={!editId}
            previewSrc={mobilePreviewSrc}
            hint="Square · 300×300px · JPG/PNG · max 5MB"
            error={fieldErrors['mobileImage']}
            onClick={() => openFilePicker('mobile')}
            aspectLabel="Portrait square"
          />
          <UploadBox
            label="Desktop Image"
            previewSrc={desktopPreviewSrc}
            hint="Wide Banner · 1920×750px · JPG/PNG · max 5MB"
            error={fieldErrors['desktopImage']}
            onClick={() => openFilePicker('desktop')}
            aspectLabel="Wide banner"
          />
        </div>

        {/* ── Hidden file inputs ── */}
        <input ref={mainImageInputRef}    type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'main')} />
        <input ref={mobileImageInputRef}  type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'mobile')} />
        <input ref={desktopImageInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'desktop')} />
        <input ref={galleryInputRef}      type="file" className="hidden" accept="image/*" multiple onChange={handleGalleryImages} />

        {/* ── Gallery grid ── */}
        {(existingGalleryImages.length > 0 || galleryPreviews.length > 0) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Gallery Images ({existingGalleryImages.length + galleryPreviews.length})
            </label>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {existingGalleryImages.map((url, index) => (
                <div key={`existing-${index}`} className="relative group">
                  <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_IMAGE_URL3}${url}`}
                      alt={`Gallery ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 33vw, (max-width: 1024px) 20vw, 16vw"
                      className="object-cover"
                    />
                    <span className="absolute bottom-1 right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                      Existing
                    </span>
                  </div>
                  {removeExistingGalleryImage && (
                    <button
                      type="button"
                      onClick={() => removeExistingGalleryImage(index)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {galleryPreviews.map((preview, index) => (
                <div key={`new-${index}`} className="relative group">
                  <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <Image
                      src={preview}
                      alt={`Gallery ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 33vw, (max-width: 1024px) 20vw, 16vw"
                      className="object-cover"
                    />
                    <span className="absolute bottom-1 right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">
                      New
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200" />

      {/* ── Basic Information Section ───────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-red-600" />
          <h2 className="text-xl font-semibold text-gray-800">Puja Information</h2>
          <span className="ml-auto text-xs text-red-600 bg-red-50 px-3 py-1 rounded-full font-medium">
            <span className="text-red-500">*</span> Required Fields
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="categoryId"
              value={inputFieldDetail.categoryId}
              onChange={handleInputChange}
              className={`w-full h-10 px-3 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all ${
                fieldErrors['categoryId'] ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.categoryName}
                </option>
              ))}
            </select>
            {fieldErrors['categoryId'] && (
              <p className="text-red-500 text-xs mt-1.5">{fieldErrors['categoryId']}</p>
            )}
          </div>

          {/* Puja Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Puja Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="pujaName"
              value={inputFieldDetail.pujaName}
              onChange={handleInputChange}
              className={`w-full h-10 px-3 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all ${
                fieldErrors['pujaName'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter puja name"
              required
            />
            {fieldErrors['pujaName'] && (
              <p className="text-red-500 text-xs mt-1.5">{fieldErrors['pujaName']}</p>
            )}
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              value={inputFieldDetail.price}
              onChange={handleInputChange}
              className={`w-full h-10 px-3 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all ${
                fieldErrors['price'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter price"
              required
              min="0"
              step="0.01"
            />
            {fieldErrors['price'] && (
              <p className="text-red-500 text-xs mt-1.5">{fieldErrors['price']}</p>
            )}
          </div>

          {/* Discounted Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Original Price (₹)
            </label>
            <input
              type="number"
              name="discountedPrice"
              value={inputFieldDetail.discountedPrice || ''}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              onChange={handleInputChange}
              className={`w-full h-10 px-3 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all ${
                fieldErrors['discountedPrice'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter original price"
            />
            {fieldErrors['discountedPrice'] && (
              <p className="text-red-500 text-xs mt-1.5">{fieldErrors['discountedPrice']}</p>
            )}
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtitle (Puja)
            </label>
            <input
              type="text"
              name="subTitle"
              value={inputFieldDetail.subTitle || ''}
              onChange={handleInputChange}
              className={`w-full h-10 px-3 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all ${
                fieldErrors['subTitle'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter subtitle"
            />
            {fieldErrors['subTitle'] && (
              <p className="text-red-500 text-xs mt-1.5">{fieldErrors['subTitle']}</p>
            )}
          </div>

          {/* Admin Commission */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Commission (%) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="adminCommission"
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              value={inputFieldDetail.adminCommission}
              onChange={handleInputChange}
              className={`w-full h-10 px-3 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all ${
                fieldErrors['adminCommission'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter commission percentage"
              required
              min="0"
              max="100"
              step="1"
            />
            {fieldErrors['adminCommission'] && (
              <p className="text-red-500 text-xs mt-1.5">{fieldErrors['adminCommission']}</p>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="duration"
              value={inputFieldDetail.duration}
              onChange={handleInputChange}
              className={`w-full h-10 px-3 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all ${
                fieldErrors['duration'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., 2-3 hours"
              required
            />
            {fieldErrors['duration'] && (
              <p className="text-red-500 text-xs mt-1.5">{fieldErrors['duration']}</p>
            )}
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purpose <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="purpose"
              value={inputFieldDetail.purpose || ''}
              onChange={handleInputChange}
              className={`w-full h-10 px-3 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all ${
                fieldErrors['purpose'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., To seek divine blessings for protection and strength"
              required
            />
            {fieldErrors['purpose'] && (
              <p className="text-red-500 text-xs mt-1.5">{fieldErrors['purpose']}</p>
            )}
          </div>

          {/* Temple Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temple Location
            </label>
            <input
              type="text"
              name="templeLocation"
              value={inputFieldDetail.templeLocation || ''}
              onChange={handleInputChange}
              className={`w-full h-10 px-3 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all ${
                fieldErrors['templeLocation'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Varanasi, Haridwar"
            />
            {fieldErrors['templeLocation'] && (
              <p className="text-red-500 text-xs mt-1.5">{fieldErrors['templeLocation']}</p>
            )}
          </div>

          {/* Puja Day */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Puja Day
            </label>
            <input
              type="text"
              name="pujaDay"
              value={inputFieldDetail.pujaDay || ''}
              onChange={handleInputChange}
              className={`w-full h-10 px-3 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all ${
                fieldErrors['pujaDay'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Monday"
            />
            {fieldErrors['pujaDay'] && (
              <p className="text-red-500 text-xs mt-1.5">{fieldErrors['pujaDay']}</p>
            )}
          </div>

          {/* Puja Venue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Puja Venue
            </label>
            <input
              type="text"
              name="pujaVenue"
              value={inputFieldDetail.pujaVenue || ''}
              onChange={handleInputChange}
              className={`w-full h-10 px-3 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all ${
                fieldErrors['pujaVenue'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Temple / Online"
            />
            {fieldErrors['pujaVenue'] && (
              <p className="text-red-500 text-xs mt-1.5">{fieldErrors['pujaVenue']}</p>
            )}
          </div>

          {/* Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mode <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="mode"
              value={inputFieldDetail.mode || ''}
              onChange={handleInputChange}
              className={`w-full h-10 px-3 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all ${
                fieldErrors['mode'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Online with Personalized Sankalp and Prasad Delivery"
              required
            />
            {fieldErrors['mode'] && (
              <p className="text-red-500 text-xs mt-1.5">{fieldErrors['mode']}</p>
            )}
          </div>

          {/* Overview */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overview <span className="text-red-500">*</span>
            </label>
            <textarea
              name="overview"
              value={inputFieldDetail.overview}
              onChange={handleInputChange}
              rows={4}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none ${
                fieldErrors['overview'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Provide a brief overview of the puja (minimum 10 characters)"
              required
            />
            {fieldErrors['overview'] && (
              <p className="text-red-500 text-xs mt-1.5">{fieldErrors['overview']}</p>
            )}
          </div>

          {/* Inclusion */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inclusion <span className="text-red-500">*</span>
            </label>
            <textarea
              name="inclusion"
              value={inputFieldDetail.inclusion || ''}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none ${
                fieldErrors['inclusion'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Complete rituals, Vedic Mantra Chanting, Havan, Sankalp, Energized Prasad Potli, and Puja Recording"
              required
            />
            {fieldErrors['inclusion'] && (
              <p className="text-red-500 text-xs mt-1.5">{fieldErrors['inclusion']}</p>
            )}
          </div>

        </div>
      </div>

      {/* ── Crop Modal ─────────────────────────────────────── */}
      {cropModal.open && (
        <CropModal
          imgSrc={cropModal.imgSrc}
          aspect={cropConfig[cropModal.type].aspect}
          label={cropConfig[cropModal.type].label}
          outputW={cropConfig[cropModal.type].outputW}
          outputH={cropConfig[cropModal.type].outputH}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
};

export default BasicInfoTab;