'use client';
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";

interface CategoryDetail {
  title: string;
}

interface InputFieldError {
  title: string;
}

function AddCategoryReview() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const editMode = searchParams.get('edit') === 'true';
  const categoryId = searchParams.get('id');
  const categoryNameFromUrl = searchParams.get('category');

  const [categoryDetail, setCategoryDetail] = useState<CategoryDetail>({
    title: categoryNameFromUrl ? decodeURIComponent(categoryNameFromUrl) : ''
  });
  const [inputFieldError, setInputFieldError] = useState<InputFieldError>({
    title: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(editMode && !categoryNameFromUrl);

  const Regex_Accept_Alpha = /^[a-zA-Z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/;

  // Fetch category data if in edit mode
  useEffect(() => {
    const fetchCategoryData = async () => {
      if (editMode && categoryId && !categoryNameFromUrl) {
        try {
          setFetching(true);
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/category/get_category/${categoryId}`);
          const data = await response.json();

          if (data.success && data.data) {
            setCategoryDetail({ title: data.data.categories || '' });
          }
        } catch (error) {
          console.error('Error fetching category:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to load category data',
            confirmButtonColor: '#d33',
          });
        } finally {
          setFetching(false);
        }
      }
    };

    fetchCategoryData();
  }, [editMode, categoryId, categoryNameFromUrl]);

  const handleInputFieldError = (input: keyof InputFieldError, value: string) => {
    setInputFieldError((prev) => ({ ...prev, [input]: value }));
  };

  const handleInputField = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'title') {
      if (value.length > 40) {
        setInputFieldError({ ...inputFieldError, title: 'Maximum character limit is 40' });
        return;
      } else {
        setInputFieldError({ ...inputFieldError, title: '' });
      }
    }

    setCategoryDetail(prev => ({ ...prev, [name]: value }));
  };

  const handleValidation = () => {
    let isValid = true;
    const { title } = categoryDetail;

    if (!title.trim()) {
      handleInputFieldError("title", "Please Enter Title");
      isValid = false;
    } else if (!Regex_Accept_Alpha.test(title)) {
      handleInputFieldError("title", "Please Enter Valid Title (Letters only)");
      isValid = false;
    } else if (title.length > 40) {
      handleInputFieldError("title", "Maximum character limit is 40");
      isValid = false;
    }

    return isValid;
  };

  // Create Category — field name "categories" as per API
  const createCategory = async (categoryData: { categories: string }) => {
    try {
      const response = await fetch(`/api/admin/add-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  };

  // Update Category — adjust endpoint/body as per your update API
  const updateCategory = async (categoryData: { categoryId: string; categories: string }) => {
    try {
      const response = await fetch(`/api/admin/update-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleValidation()) return;

    setLoading(true);
    const { title } = categoryDetail;

    try {
      let result;
      const isEdit = editMode && categoryId;

      if (isEdit) {
        result = await updateCategory({
          categoryId: categoryId!,
          categories: title,
        });
      } else {
        result = await createCategory({
          categories: title,  // matches API: req.body.categories
        });
      }

      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: isEdit ? 'Updated!' : 'Created!',
          text: `Category ${isEdit ? 'updated' : 'created'} successfully`,
          timer: 1500,
          showConfirmButton: false,
        });
        setTimeout(() => {
          router.push("/astrologer-categories");
        }, 1600);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: result.message || `Failed to ${isEdit ? 'update' : 'create'} category`,
          confirmButtonColor: '#d33',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Network Error!',
        text: 'Please check your connection and try again.',
        confirmButtonColor: '#d33',
      });
      console.error('Error submitting category:', error);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg text-gray-600">Loading category data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-xl font-semibold text-gray-800">
            {editMode ? 'Edit' : 'Add'} Category
          </div>
          <button
            onClick={() => router.push("/astrologer-categories")}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg cursor-pointer text-sm font-medium transition duration-200"
          >
            Display
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 ml-2">
                {categoryDetail.title.length}/40 characters
              </span>
            </label>
            <input
              type="text"
              name="title"
              value={categoryDetail.title}
              onChange={handleInputField}
              onFocus={() => handleInputFieldError("title", "")}
              maxLength={40}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                inputFieldError.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter category title"
            />
            {inputFieldError.title && (
              <p className="text-red-500 text-sm mt-1">{inputFieldError.title}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-start">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg cursor-pointer font-medium transition duration-200 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {editMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editMode ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const AddCategory = () => {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    }>
      <AddCategoryReview />
    </Suspense>
  );
};

export default AddCategory;