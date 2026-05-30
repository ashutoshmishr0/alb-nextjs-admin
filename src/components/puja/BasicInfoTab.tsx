'use client';

import React, { useRef } from 'react';
import { Eye, Info, Upload, Image as ImageIcon, X } from 'lucide-react';
import Image from 'next/image';

interface Props {
  inputFieldDetail: any;
  handleInputChange: (e: any) => void;
  categories: any[];
  image: any;
  imagePreview: string;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  galleryImages: File[];
  galleryPreviews: string[];
  handleGalleryImages: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeGalleryImage: (index: number) => void;
  editId?: string | null;
  fieldErrors?: Record<string, string>;
}

const BasicInfoTab: React.FC<Props> = ({ 
  inputFieldDetail, 
  handleInputChange, 
  categories,
  image,
  imagePreview,
  handleImageUpload,
  galleryImages,
  galleryPreviews,
  handleGalleryImages,
  removeGalleryImage,
  editId,
  fieldErrors = {}
}) => {
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const previewSrc = image.bytes
    ? imagePreview
    : `${process.env.NEXT_PUBLIC_IMAGE_URL3}${image.file}`;

  return (
    <div className="space-y-8">
      {/* Images Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-red-600" />
          <h2 className="text-xl font-semibold text-gray-800">Images</h2>
        </div>
     
        {/* Main Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Main Image <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <div 
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:border-red-500 hover:bg-red-50/30 ${
                  fieldErrors['mainImage'] ? 'border-red-500 bg-red-50' : imagePreview ? 'border-gray-300 bg-white' : 'border-gray-300 bg-gray-50'
                }`}
                onClick={() => mainImageInputRef.current?.click()}
              >
                {imagePreview ? (
                  <div className="space-y-3">
                    <div className="mx-auto w-40 h-40 rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm">
                      <img
                        src={previewSrc}
                        alt="Main preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm text-gray-600">Click to change image</p>
                  </div>
                ) : (
                  <div className="py-4">
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-base font-medium text-gray-700 mb-1">Upload Main Image</p>
                    <p className="text-sm text-gray-500">Click to browse or drag & drop</p>
                    <p className="text-xs text-gray-400 mt-2">Recommended: 800x600px, JPG/PNG</p>
                  </div>
                )}
              </div>
              {fieldErrors['mainImage'] && (
                <p className="text-red-500 text-xs mt-1.5">{fieldErrors['mainImage']}</p>
              )}
              <input
                ref={mainImageInputRef}
                type="file"
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
                required={!editId}
              />
            </div>
          </div>
        </div>

        {/* Gallery Images */}
        {galleryPreviews.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Gallery Images ({galleryPreviews.length})
            </label>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {galleryPreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <Image
                      src={preview}
                      alt={`Gallery ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 33vw, (max-width: 1024px) 20vw, 16vw"
                      className="object-cover"
                    />
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

      <div className="border-t border-gray-200 my-6"></div>

      {/* Basic Information Section */}
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
              placeholder="Enter discounted price"
              required
             
            />
            {fieldErrors['discountedPrice'] && (
              <p className="text-red-500 text-xs mt-1.5">{fieldErrors['discountedPrice']}</p>
            )}
          </div>

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
              placeholder="Enter Subtitle"
              required
              min="0"
              step="0.01"
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
              Duration
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
            />
            {fieldErrors['purpose'] && (
              <p className="text-red-500 text-xs mt-1.5">{fieldErrors['purpose']}</p>
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
    <p className="text-red-500 text-xs mt-1.5">
      {fieldErrors['pujaDay']}
    </p>
  )}
</div>
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
    placeholder="e.g., Monday"
  />

  {fieldErrors['pujaVenue'] && (
    <p className="text-red-500 text-xs mt-1.5">
      {fieldErrors['pujaVenue']}
    </p>
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
            />
            {fieldErrors['mode'] && (
              <p className="text-red-500 text-xs mt-1.5">{fieldErrors['mode']}</p>
            )}
          </div>

          {/* Overview - Full Width */}
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

          {/* inclusion - Full Width */}
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
            />
            {fieldErrors['inclusion'] && (
              <p className="text-red-500 text-xs mt-1.5">{fieldErrors['inclusion']}</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default BasicInfoTab;