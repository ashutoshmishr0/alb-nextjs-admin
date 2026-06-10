'use client';
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Swal from "sweetalert2";

interface InputFieldDetail {
  title: string;
  description: string;
}

interface InputFieldError {
  title: string;
  description: string;
  image: string;
}

interface ImageState {
  file: string;
  bytes: File | null;
}

interface MainExpertise {
  _id: string;
  mainExpertise: string;
  description: string;
  image: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface MainExpertiseResponse {
  success: boolean;
  mainExpertise: MainExpertise[];
}

function AddMainExpertiseContent(){
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const editMode = searchParams.get('edit') === 'true';
  const expertiseId = searchParams.get('id');

  const [image, setImage] = useState<ImageState>({ file: '', bytes: null });
  const [inputFieldDetail, setInputFieldDetail] = useState<InputFieldDetail>({ 
    title: '', 
    description: '' 
  });
  const [inputFieldError, setInputFieldError] = useState<InputFieldError>({ 
    title: '', 
    description: '', 
    image: '' 
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(editMode && !!expertiseId);

  // Regex pattern for validation
const Regex_Accept_Alpha = /^[a-zA-Z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/;

  // Fetch expertise data if in edit mode
  useEffect(() => {
    const fetchExpertiseData = async () => {
      if (editMode && expertiseId) {
        try {
          setFetching(true);
          const response = await fetch(`/api/admin/get-all-main-expertise`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data: MainExpertiseResponse = await response.json();
            
            if (data.success && data.mainExpertise) {
              // Find the specific expertise by ID
              const expertiseToEdit = data.mainExpertise.find(
                (expertise: MainExpertise) => expertise._id === expertiseId
              );
              
              if (expertiseToEdit) {
                setInputFieldDetail({
                  title: expertiseToEdit.mainExpertise || '',
                  description: expertiseToEdit.description || ''
                });
                if (expertiseToEdit.image) {
                  setImage({
                    file: `${process.env.NEXT_PUBLIC_IMAGE_URL}${expertiseToEdit.image}`,
                    bytes: null
                  });
                }
              } else {
                Swal.fire({
                  icon: 'error',
                  title: 'Error!',
                  text: 'Expertise not found',
                  confirmButtonColor: '#d33',
                });
                router.push("/main-expertise");
              }
            }
          } else {
            console.error('Failed to fetch main expertise');
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: 'Failed to load expertise data',
              confirmButtonColor: '#d33',
            });
          }
        } catch (error) {
          console.error('Error fetching expertise:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to load expertise data',
            confirmButtonColor: '#d33',
          });
        } finally {
          setFetching(false);
        }
      }
    };

    fetchExpertiseData();
  }, [editMode, expertiseId, router]);

  //* Handle Input Field : Data
  const handleInputChange = (field: keyof InputFieldDetail, value: string) => {
    setInputFieldDetail(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (inputFieldError[field]) {
      setInputFieldError(prev => ({ ...prev, [field]: '' }));
    }
  };

  //* Handle Input Field : Error
  const handleInputFieldError = (input: keyof InputFieldError, value: string) => {
    setInputFieldError((prev) => ({ ...prev, [input]: value }));
  };

  //! Handle Image : Normally
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImage({
        file: URL.createObjectURL(e.target.files[0]),
        bytes: e.target.files[0],
      });
    }
    handleInputFieldError("image", "");
  };

  //! Handle Image : Drop Feature
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setImage({
        file: URL.createObjectURL(e.dataTransfer.files[0]),
        bytes: e.dataTransfer.files[0],
      });
    }
    handleInputFieldError("image", "");
  };

  //! Handle validation
  const handleValidation = () => {
    let isValid = true;
    const { title, description } = inputFieldDetail;

    if (!title.trim()) {
      handleInputFieldError("title", "Please Enter Title");
      isValid = false;
    }
    if (!Regex_Accept_Alpha.test(title)) {
      handleInputFieldError("title", "Please Enter Valid Title (No Escape characters or blank)");
      isValid = false;
    }
    if (!description.trim()) {
      handleInputFieldError("description", "Please Enter Description");
      isValid = false;
    }
    if (!image.bytes && !image.file && !editMode) {
      handleInputFieldError("image", "Please Select Image");
      isValid = false;
    }

    return isValid;
  };

  // API call functions
  const createMainExpertise = async (formData: FormData) => {
    try {
      const response = await fetch(`/api/admin/add-main-expertise`, {
        method: 'POST',
        body: formData,
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating expertise:', error);
      throw error;
    }
  };

  const updateMainExpertise = async (formData: FormData) => {
    try {
      const response = await fetch(`/api/admin/update-main-expertise`, {
        method: 'POST',
        body: formData,
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating expertise:', error);
      throw error;
    }
  };

  //! Handle Submit - Creating/Updating
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (handleValidation()) {
      setLoading(true);
      const { title, description } = inputFieldDetail;

      try {
        const formData = new FormData();
        formData.append('mainExpertise', title);
        formData.append('description', description);
        
        if (image.bytes) {
          formData.append('image', image.bytes);
        }

        let result;
        if (editMode && expertiseId) {
          formData.append('mainExpertiseId', expertiseId);
          result = await updateMainExpertise(formData);
        } else {
          result = await createMainExpertise(formData);
        }
        
        if (result.success) {
          Swal.fire({
            icon: 'success',
            title: editMode ? 'Updated!' : 'Created!',
            text: `Main expertise ${editMode ? 'updated' : 'created'} successfully`,
            timer: 1500,
            showConfirmButton: false
          });
          setTimeout(() => {
            router.push("/main-expertise");
          }, 1600);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: result.message || `Failed to ${editMode ? 'update' : 'create'} main expertise`,
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
        console.error('Error submitting expertise:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Add click handler for image upload area
  const handleImageAreaClick = () => {
    const fileInput = document.getElementById('upload-image') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg text-gray-600">Loading expertise data...</div>
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
            {editMode ? 'Edit' : 'Add'} Main Expertise
          </div>
          <button 
            onClick={() => router.back()}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg cursor-pointer text-sm font-medium transition duration-200"
          >
            Display
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Image <span className="text-red-500">*</span>
            </label>
            <div 
              onDragOver={(e) => e.preventDefault()} 
              onDrop={handleDrop}
              onClick={handleImageAreaClick}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
            >
              {image.file ? (
                <div className="flex flex-col items-center">
                  <div className="relative w-64 h-64 mb-4">
                    <img 
                      src={image.file} 
                      alt="Expertise" 
                      className="object-contain rounded-lg"
                    />
                  </div>
                  <p className="text-sm text-gray-600">Click or drag to change image</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                    <span className="text-gray-500 text-2xl">📷</span>
                  </div>
                  <p className="text-sm text-gray-600">Choose Your Image to Upload</p>
                  <p className="text-xs text-gray-500 mt-1">Or Drop Your Image Here</p>
                </div>
              )}
              <input 
                id="upload-image" 
                onChange={handleImage} 
                hidden 
                accept="image/*" 
                type="file" 
              />
            </div>
            {inputFieldError.image && (
              <p className="text-red-500 text-sm mt-1">{inputFieldError.image}</p>
            )}
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={inputFieldDetail.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              onFocus={() => handleInputFieldError("title", "")}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                inputFieldError.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter main expertise title"
            />
            {inputFieldError.title && (
              <p className="text-red-500 text-sm mt-1">{inputFieldError.title}</p>
            )}
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={inputFieldDetail.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              onFocus={() => handleInputFieldError("description", "")}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                inputFieldError.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter main expertise description"
            />
            {inputFieldError.description && (
              <p className="text-red-500 text-sm mt-1">{inputFieldError.description}</p>
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
};

const AddReview = () => {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><div className="text-xl text-gray-600">Loading...</div></div>}>
      <AddMainExpertiseContent />
    </Suspense>
  );
};

export default AddReview;