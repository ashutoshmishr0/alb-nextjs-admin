// app/admin/reports/add-report/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Swal from 'sweetalert2';

interface ReportFormData {
  title: string;
  slug: string;
  imageUrl: string;
  category: string;
  price: number;
  cutPrice: number;
  rating: number;
  reviews: number;
  featured: boolean;
  bestseller: boolean;
  tag: string;
  newlyLaunched: boolean;
  description: string;
  sectionPriority: 'hero' | 'featured' | 'regular' | 'hidden';
}

const categories = ["Personal Growth", "Relationships", "Transformation", "Special Offer", "Newly Launched"];

export default function AddEditReport() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportId = searchParams.get('id');
  const isEditing = !!reportId;

  const [formData, setFormData] = useState<ReportFormData>({
    title: '',
    slug: '',
    imageUrl: '',
    category: '',
    price: 0,
    cutPrice: 0,
    rating: 4.5,
    reviews: 0,
    featured: false,
    bestseller: false,
    tag: '',
    newlyLaunched: false,
    description: '',
    sectionPriority: 'regular'
  });

  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  // Fetch report if editing
  useEffect(() => {
    if (isEditing && reportId) {
      fetchReport();
    }
  }, [isEditing, reportId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/${reportId}`);
      const data = await response.json();
      
      if (data.success && data.report) {
        setFormData(data.report);
        setImagePreview(data.report.imageUrl);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

//   const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const title = e.target.value;
//     setFormData(prev => ({
//       ...prev,
//       title,
//       slug: generateSlug(title)
//     }));
//   };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
        ...prev,
        title: e.target.value  // Sirf title change
    }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.category || !formData.price || !formData.description) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fill all required fields'
      });
      return;
    }

    Swal.fire({
      title: isEditing ? 'Updating...' : 'Creating...',
      text: 'Please wait',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const url = isEditing 
        ? `/api/admin/${reportId}`
        : `/api/admin`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: `Report ${isEditing ? 'updated' : 'created'} successfully`,
          timer: 2000,
          showConfirmButton: false
        });
        
        router.push('/reports/change-reports-order');
      } else {
        throw new Error(data.message || 'Operation failed');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message
      });
    }
  };

  if (loading && isEditing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Report' : 'Add New Report'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditing ? 'Update report details' : 'Create a new astrological report'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleTitleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug (URL)
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                // readOnly
              />
              <p className="text-xs text-gray-500 mt-1">Auto-generated from title</p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Section Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section Priority
              </label>
              <select
                name="sectionPriority"
                value={formData.sectionPriority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="regular">Regular</option>
                <option value="featured">Featured</option>
                <option value="hero">Hero</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            {/* Image URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="text"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => {
                  handleChange(e);
                  setImagePreview(e.target.value);
                }}
                placeholder="/images/report-name.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">Preview:</p>
                  <div className="relative w-32 h-40 rounded-lg overflow-hidden border">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cut Price (₹)
              </label>
              <input
                type="number"
                name="cutPrice"
                value={formData.cutPrice}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                min="0"
              />
            </div>
          </div>

          {/* Rating */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating (1-5)
              </label>
              <input
                type="number"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                step="0.1"
                min="0"
                max="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Reviews
              </label>
              <input
                type="number"
                name="reviews"
                value={formData.reviews}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                min="0"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
                className="w-4 h-4 text-red-600"
              />
              <span className="text-sm text-gray-700">Featured Report</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="bestseller"
                checked={formData.bestseller}
                onChange={handleChange}
                className="w-4 h-4 text-red-600"
              />
              <span className="text-sm text-gray-700">Bestseller</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="newlyLaunched"
                checked={formData.newlyLaunched}
                onChange={handleChange}
                className="w-4 h-4 text-red-600"
              />
              <span className="text-sm text-gray-700">Newly Launched</span>
            </label>
          </div>

          {/* Custom Tag */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Tag (optional)
            </label>
            <input
              type="text"
              name="tag"
              value={formData.tag}
              onChange={handleChange}
              placeholder="e.g., Bestseller, New, Limited Offer"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.push('/reports/change-reports-order')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {isEditing ? 'Update Report' : 'Create Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}