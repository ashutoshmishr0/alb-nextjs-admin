'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Color } from '@/assets/colors';
import StaticPageEditor from '@/components/common/Addblogeditor';
import { UploadImageSvg } from '@/components/svgs/page';
import Swal from 'sweetalert2';
import { base_url } from '@/lib/api-routes';

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------
interface BlogCategory {
  _id: string;
  blog_category: string;
}

interface Blog {
  _id: string;
  title: string;
  created_by: string;
  blogCategoryId: { _id: string; blog_category: string };
  description: string;
  image: string;
}

interface InputFieldDetail {
  title: string;
  created_by: string;
  categoryId: string;
}

interface InputFieldError {
  title?: string;
  created_by?: string;
  categoryId?: string;
  image?: string;
}

interface ImageState {
  file: string;
  bytes: File | string;
}

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------
const IMG_URL = process.env.NEXT_PUBLIC_IMG_URL || '/uploads/';
const Regex_Accept_Alpha = /^[a-zA-Z\s]+$/;
const Regex_Accept_Alpha2 = /^[a-zA-Z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+.{3,}$/;

// ---------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------
const AddEditBlogContent = () => {
  const router = useRouter();

  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [inputFieldDetail, setInputFieldDetail] = useState<InputFieldDetail>({
    title: '',
    created_by: '',
    categoryId: '',
  });
  const [description, setDescription] = useState<string>('');
  const [inputFieldError, setInputFieldError] = useState<InputFieldError>({});
  const [image, setImage] = useState<ImageState>({
    file: '',
    bytes: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [editBlog, setEditBlog] = useState<Blog | null>(null);

  // Load edit data from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('editBlogData');
    if (stored) {
      try {
        const blog: Blog = JSON.parse(stored);
        setEditBlog(blog);
        setInputFieldDetail({
          title: blog.title || '',
          created_by: blog.created_by || '',
          categoryId: blog.blogCategoryId?._id || '',
        });
        setDescription(blog.description || '');
        if (blog.image) {
          setImage({
            file: blog.image,
            bytes: '',
          });
        }
      } catch (error) {
        console.error('Failed to parse edit blog data:', error);
      } finally {
        sessionStorage.removeItem('editBlogData');
      }
    }
  }, []);

  // Fetch Categories
  const fetchCategories = async (): Promise<void> => {
    try {
      const res = await fetch(`/api/admin/blog-category-list`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data.categoryBlog || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle Input Field Error
  const handleInputFieldError = (input: keyof InputFieldError, value: string | null): void => {
    setInputFieldError((prev) => ({ ...prev, [input]: value ?? undefined }));
  };

  // Handle Input Field Data
  const handleInputField = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = event.target;
    setInputFieldDetail((prev) => ({ ...prev, [name]: value }));
    if (inputFieldError[name as keyof InputFieldError]) {
      handleInputFieldError(name as keyof InputFieldError, null);
    }
  };

  // Handle Select Change
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const { name, value } = event.target;
    setInputFieldDetail((prev) => ({ ...prev, [name as string]: value }));
    if (inputFieldError.categoryId) {
      handleInputFieldError('categoryId', null);
    }
  };

  // Handle Image Upload
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size < 1 * 1024 * 1024) {
        setImage({
          file: URL.createObjectURL(file),
          bytes: file,
        });
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'File too large',
          text: 'Please upload images having size less than 1 MB',
          confirmButtonColor: '#3085d6',
        });
      }
    }
    handleInputFieldError('image', null);
  };

  // Handle Drag and Drop
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>): void => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.size < 1 * 1024 * 1024) {
        setImage({
          file: URL.createObjectURL(file),
          bytes: file,
        });
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'File too large',
          text: 'Please upload images having size less than 1 MB',
          confirmButtonColor: '#3085d6',
        });
      }
    }
    handleInputFieldError('image', null);
  };

  // Get image source URL
  const getImageSrc = (): string => {
    if (typeof image.bytes === 'object' && image.bytes instanceof File) {
      return image.file;
    }
    if (image.file && !image.file.startsWith('blob:')) {
      return `${process.env.NEXT_PUBLIC_IMAGE_URL}uploads/${image.file}`;

    }
    return image.file;
  };

  // Handle Validation
  const handleValidation = (): boolean => {
    let isValid = true;
    const { title, created_by, categoryId } = inputFieldDetail;
    const { file } = image;

    if (!title.trim()) {
      handleInputFieldError('title', 'Please Enter Title');
      isValid = false;
    } else if (!Regex_Accept_Alpha2.test(title)) {
      handleInputFieldError('title', 'Please Enter Valid Title (At least 3 characters)');
      isValid = false;
    } else {
      handleInputFieldError('title', null);
    }

    if (!created_by.trim()) {
      handleInputFieldError('created_by', 'Please Enter Author Name');
      isValid = false;
    } else if (!Regex_Accept_Alpha.test(created_by)) {
      handleInputFieldError('created_by', 'Please Enter Valid Author Name (letters and spaces only)');
      isValid = false;
    } else {
      handleInputFieldError('created_by', null);
    }

    if (!categoryId) {
      handleInputFieldError('categoryId', 'Please Select Category');
      isValid = false;
    } else {
      handleInputFieldError('categoryId', null);
    }

    if (!file) {
      handleInputFieldError('image', 'Please Upload Image');
      isValid = false;
    } else {
      handleInputFieldError('image', null);
    }

    const stripped = description.replace(/<[^>]*>/g, '').trim();
    if (!stripped || description === '<p><br></p>' || description === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Description Required',
        text: 'Please enter blog description',
        confirmButtonColor: '#3085d6',
      });
      isValid = false;
    }

    return isValid;
  };

  // Handle Submit
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();

    if (!handleValidation()) return;

    const { title, created_by, categoryId } = inputFieldDetail;
    const formData = new FormData();

    formData.append('title', title.trim());
    formData.append('created_by', created_by.trim());
    formData.append('blogCategoryId', categoryId);
    formData.append('description', description.trim());

    if (image.bytes && typeof image.bytes !== 'string') {
      formData.append('image', image.bytes);
    }

    if (editBlog?._id) {
      formData.append('blogId', editBlog._id);
    }

    try {
      setLoading(true);

      const url = editBlog
        ? `/api/admin/update_astro_blog`
        : `/api/admin/add-astro-blog`;
      const method = 'POST';

      const res = await fetch(url, {
        method,
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${editBlog ? 'update' : 'create'} blog`);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Blog ${editBlog ? 'updated' : 'created'} successfully!`,
        confirmButtonColor: '#3085d6',
      });

      router.push('/astro-blog/blog');
    } catch (error) {
      console.error('Error submitting blog:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: error instanceof Error ? error.message : 'Failed to submit blog. Please try again.',
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
          {editBlog ? 'Edit' : 'Add'} Astroblog
        </h1>
        <button
          onClick={() => router.push('/astro-blog/blog')}
          className="font-medium text-white px-4 py-2 rounded hover:opacity-90 text-sm"
          style={{ backgroundColor: Color.primary }}
        >
          Display
        </button>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Blog Image <span className="text-red-600">*</span>
          </label>

          <div className="flex items-start justify-start">
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              htmlFor="upload-image"
              className="relative cursor-pointer group"
            >
              {image.file ? (
                <div className="relative">
                  <img
                    src={getImageSrc()}
                    alt="Blog preview"
                    className="h-32 w-32 object-cover rounded-full shadow-md group-hover:opacity-80 transition-opacity border-4 border-white"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-40 rounded-full">
                    <span className="text-white text-xs font-medium">Change</span>
                  </div>
                </div>
              ) : (
                <div className="h-32 w-32 flex items-center justify-center rounded-full bg-gray-100 shadow-md cursor-pointer hover:bg-gray-200 transition-colors">
                  <UploadImageSvg h="48" w="48" color="#9CA3AF" />
                </div>
              )}
            </label>

            <input
              id="upload-image"
              onChange={handleImage}
              hidden
              accept="image/*"
              type="file"
            />
          </div>

          {inputFieldError.image && (
            <p className="text-red-600 text-xs mt-2">{inputFieldError.image}</p>
          )}
        </div>

        {/* Title */}
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
          />
          {inputFieldError.title && (
            <p className="text-red-600 text-xs mt-1">{inputFieldError.title}</p>
          )}
        </div>

        {/* Category and Author Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category */}
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium mb-1.5 text-gray-700">
              Select Category Name <span className="text-red-600">*</span>
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={inputFieldDetail.categoryId}
              onChange={handleSelectChange}
              onFocus={() => handleInputFieldError('categoryId', null)}
              disabled={loading}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputFieldError.categoryId ? 'border-red-600' : 'border-gray-300'
                } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">---Select Category Name---</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.blog_category}
                </option>
              ))}
            </select>
            {inputFieldError.categoryId && (
              <p className="text-red-600 text-xs mt-1">{inputFieldError.categoryId}</p>
            )}
          </div>

          {/* Author */}
          <div>
            <label htmlFor="created_by" className="block text-sm font-medium mb-1.5 text-gray-700">
              Author <span className="text-red-600">*</span>
            </label>
            <input
              id="created_by"
              type="text"
              name="created_by"
              value={inputFieldDetail.created_by}
              onChange={handleInputField}
              onFocus={() => handleInputFieldError('created_by', null)}
              disabled={loading}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputFieldError.created_by ? 'border-red-600' : 'border-gray-300'
                } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {inputFieldError.created_by && (
              <p className="text-red-600 text-xs mt-1">{inputFieldError.created_by}</p>
            )}
          </div>
        </div>

        {/* Static Page Editor */}
        <div>
          <StaticPageEditor
            title="Blog Description"
            initialContent={description}
            createEndpoint=""
            loading={loading}
            onDescriptionChange={(html: string) => setDescription(html)}
            onValidationError={(hasError: boolean) => {
              // Optional: handle error state
            }}
          />
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
// Suspense Wrapper
// ---------------------------------------------------------------------
const AddEditBlogClient = () => {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading form...</div>}>
      <AddEditBlogContent />
    </Suspense>
  );
};

export default AddEditBlogClient;