'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Color } from '@/assets/colors';
import { base_url } from '@/lib/api-routes';
import Swal from 'sweetalert2';

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------
interface BlogCategory {
  _id: string;
  blog_category: string;
}

interface InputFieldDetail {
  title: string;
}

interface InputFieldError {
  title?: string;
}

// ---------------------------------------------------------------------
// Regex Pattern
// ---------------------------------------------------------------------
const Regex_Accept_Everything = /^.+$/;

// ---------------------------------------------------------------------
// Content Component
// ---------------------------------------------------------------------
const AddEditCategoryContent: React.FC = () => {
  const router = useRouter();

  const [inputFieldDetail, setInputFieldDetail] = useState<InputFieldDetail>({
    title: '',
  });
  const [inputFieldError, setInputFieldError] = useState<InputFieldError>({});
  const [loading, setLoading] = useState(false);
  const [editCategory, setEditCategory] = useState<BlogCategory | null>(null);

  // Load from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('editBlogCategory');
    if (stored) {
      try {
        const category: BlogCategory = JSON.parse(stored);
        setEditCategory(category);
        setInputFieldDetail({ title: category.blog_category });
      } catch (error) {
        console.error('Failed to parse edit category:', error);
      } finally {
        sessionStorage.removeItem('editBlogCategory'); // Clean up
      }
    }
  }, []);

  // Handle Input Field Error
  const handleInputFieldError = (input: keyof InputFieldError, value: string | null) => {
    setInputFieldError((prev) => ({ ...prev, [input]: value ?? undefined }));
  };

  // Handle Input Field Data
  const handleInputField = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setInputFieldDetail((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Validation
  const handleValidation = (): boolean => {
    let isValid = true;
    const { title } = inputFieldDetail;

    if (!title) {
      handleInputFieldError('title', 'Please Enter Title');
      isValid = false;
    } else if (!Regex_Accept_Everything.test(title)) {
      handleInputFieldError('title', 'Please Enter Valid Title');
      isValid = false;
    } else if (title.toString().length > 70) {
      handleInputFieldError('title', 'Please Enter Title Less Than 70 Characters');
      isValid = false;
    } else {
      handleInputFieldError('title', null);
    }

    return isValid;
  };

  // Handle Submit
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!handleValidation()) return;

    const { title } = inputFieldDetail;

    try {
      setLoading(true);

      if (editCategory) {
        // UPDATE
        const res = await fetch(`/api/admin/update_blog_category`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blogCategoryId: editCategory._id,
            blogCategoryName: title,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to update category');
        }

        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Category updated successfully!',
          confirmButtonColor: '#3085d6',
        });
      } else {
        // CREATE
        const res = await fetch(`/api/admin/add-blog-category`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blog_category: title }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to create category');
        }

        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Category created successfully!',
          confirmButtonColor: '#3085d6',
        });
      }

      router.push('/astro-blog/category');
    } catch (error: any) {
      console.error('Error submitting category:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: error.message || 'Something went wrong',
        confirmButtonColor: '#d33',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 bg-white mb-5 shadow-md rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-medium" style={{ color: Color.black }}>
          {editCategory ? 'Edit' : 'Add'} Blog Category
        </h1>
        <button
          onClick={() => router.push('/astro-blog/category')}
          className="font-medium text-white px-4 py-2 rounded hover:opacity-90 text-sm"
          style={{ backgroundColor: Color.primary }}
        >
          Display
        </button>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Title Field */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1.5 text-gray-700">
            Title <span className="text-red-600">*</span>
          </label>
          <input
            id="title"
            type="text"
            name="title"
            value={inputFieldDetail.title}
            onChange={handleInputField}
            onFocus={() => handleInputFieldError('title', null)}
            disabled={loading}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputFieldError.title ? 'border-red-600' : 'border-gray-300'
              } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            placeholder="Enter category title"
          />
          {inputFieldError.title && (
            <p className="text-red-600 text-xs mt-1">{inputFieldError.title}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-between">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="font-medium text-white px-5 py-2.5 rounded hover:opacity-90 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: loading ? '#ccc' : Color.primary }}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------
// Main Component with Suspense
// ---------------------------------------------------------------------
const AddEditCategoryPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <AddEditCategoryContent />
    </Suspense>
  );
};

export default AddEditCategoryPage;