'use client';
import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Swal from "sweetalert2";

interface GiftDetail {
  title: string;
  amount: string;
  shortBio: string;
}

interface InputFieldError {
  title: string;
  amount: string;
  shortBio: string;
  image: string;
}

interface ImageState {
  file: string;
  bytes: File | null;
}

interface Gift {
  _id: string;
  gift: string;
  giftIcon: string;
  amount: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ApiResponse {
  success: boolean;
  gift: Gift[];
  message?: string;
}

function AddGiftContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const editMode = searchParams.get('edit') === 'true';
  const giftId = searchParams.get('id');

  const [giftDetail, setGiftDetail] = useState<GiftDetail>({
    title: '',
    amount: '',
    shortBio: ''
  });
  const [inputFieldError, setInputFieldError] = useState<InputFieldError>({
    title: '',
    amount: '',
    shortBio: '',
    image: ''
  });
  const [image, setImage] = useState<ImageState>({
    file: '',
    bytes: null
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(editMode && !!giftId);
  const [allGifts, setAllGifts] = useState<Gift[]>([]);

  // Regex pattern for validation
  const Regex_Accept_Alpha = /^[a-zA-Z\s]*$/;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API to get all gifts
  const getAllGifts = async () => {
    try {
      const response = await fetch(`/api/admin/get-all-gift`);
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setAllGifts(data.gift || []);
        return data.gift || [];
      } else {
        console.error('Failed to fetch gifts:', data.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching gifts:', error);
      return [];
    }
  };

  // Fetch gift data if in edit mode
  useEffect(() => {
    const fetchGiftData = async () => {
      if (editMode && giftId) {
        try {
          setFetching(true);
          console.log('Fetching all gifts for edit mode, looking for ID:', giftId);
          
          // Get all gifts
          const gifts = await getAllGifts();
          
          // Find the specific gift by ID
          const specificGift = gifts.find(gift => gift._id === giftId);
          
          console.log('Found gift:', specificGift); // Debug log
          
          if (specificGift) {
            // Set the form data with the gift information
            setGiftDetail({
              title: specificGift.gift || '',
              amount: specificGift.amount?.toString() || '',
              shortBio: specificGift.description || ''
            });

            // Set the image if available
            if (specificGift.giftIcon) {
              setImage({
                file: `${process.env.NEXT_PUBLIC_API_URL}/${specificGift.giftIcon}`,
                bytes: null
              });
            }
            
            console.log('Form data set successfully'); // Debug log
          } else {
            throw new Error('Gift not found with the provided ID');
          }
        } catch (error) {
          console.error('Error fetching gift data:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to load gift data. Please check if the gift exists.',
            confirmButtonColor: '#d33',
          }).then(() => {
            router.push("/gift");
          });
        } finally {
          setFetching(false);
        }
      }
    };

    fetchGiftData();
  }, [editMode, giftId, router]);

  //* Handle Input Field : Error
  const handleInputFieldError = (input: keyof InputFieldError, value: string) => {
    setInputFieldError((prev) => ({ ...prev, [input]: value }));
  };

  //* Handle Input Field : Data
  const handleInputChange = (field: keyof GiftDetail, value: string) => {
    setGiftDetail(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (inputFieldError[field]) {
      handleInputFieldError(field, '');
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
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
    const { title, amount, shortBio } = giftDetail;

    if (!title.trim()) {
      handleInputFieldError("title", "Please Enter Title");
      isValid = false;
    }
    if (!Regex_Accept_Alpha.test(title)) {
      handleInputFieldError("title", "Please Enter Valid Title (Letters only)");
      isValid = false;
    }
    if (!amount.trim()) {
      handleInputFieldError("amount", "Please Enter Amount");
      isValid = false;
    }
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      handleInputFieldError("amount", "Please Enter Valid Amount");
      isValid = false;
    }
    if (!shortBio.trim()) {
      handleInputFieldError("shortBio", "Please Enter Short Bio");
      isValid = false;
    }
    if (!Regex_Accept_Alpha.test(shortBio)) {
      handleInputFieldError("shortBio", "Please Enter Valid Short Bio (Letters only)");
      isValid = false;
    }
    if (!image.bytes && !image.file && !editMode) {
      handleInputFieldError("image", "Please Upload Image");
      isValid = false;
    }

    return isValid;
  };

  // API call functions
  const createGift = async (formData: FormData) => {
    try {
      const response = await fetch(`/api/admin/add-gift`, {
        method: 'POST',
        body: formData,
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating gift:', error);
      throw error;
    }
  };

  const updateGift = async (formData: FormData) => {
    try {
      const response = await fetch(`/api/admin/update-gift`, {
        method: 'POST',
        body: formData,
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating gift:', error);
      throw error;
    }
  };

  //! Handle Submit - Creating/Updating Gift
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (handleValidation()) {
      setLoading(true);
      const { title, amount, shortBio } = giftDetail;

      try {
        const formData = new FormData();

        if (editMode && giftId) {
          formData.append("giftId", giftId);
        }
        formData.append("gift", title);
        formData.append("amount", amount);
        formData.append("description", shortBio);

        if (image.bytes) {
          formData.append("image", image.bytes);
        }

        console.log('Submitting form data:', {
          editMode,
          giftId,
          title,
          amount,
          shortBio,
          hasImage: !!image.bytes
        });

        let result;
        if (editMode && giftId) {
          result = await updateGift(formData);
        } else {
          result = await createGift(formData);
        }

        console.log('Submission result:', result);

        if (result.success) {
          Swal.fire({
            icon: 'success',
            title: editMode ? 'Updated!' : 'Created!',
            text: `Gift ${editMode ? 'updated' : 'created'} successfully`,
            timer: 1500,
            showConfirmButton: false
          });
          setTimeout(() => {
            router.push("/gift");
          }, 1600);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: result.message || `Failed to ${editMode ? 'update' : 'create'} gift`,
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
        console.error('Error submitting gift:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg text-gray-600">Loading gift data...</div>
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
            {editMode ? 'Edit' : 'Add'} Gift
            {editMode && giftId && (
              <span className="text-sm text-gray-500 ml-2">(ID: {giftId})</span>
            )}
          </div>
          <button
            onClick={() => router.push("/gift")}
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
              Gift Icon {!editMode && <span className="text-red-500">*</span>}
              {editMode && <span className="text-gray-500 text-xs ml-1">(Upload new to change)</span>}
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={handleImageClick}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
            >
              {image.file ? (
                <div className="flex flex-col items-center">
                  <div className="relative w-48 h-48 mb-4">
                    <img
                      src={image.file}
                      alt="Gift icon"
                      className="object-contain rounded-lg"
                    />
                  </div>
                  <p className="text-sm text-gray-600">Click or drag to change image</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                    <span className="text-gray-500 text-2xl">🎁</span>
                  </div>
                  <p className="text-sm text-gray-600">Choose Your Image to Upload</p>
                  <p className="text-xs text-gray-500 mt-1">Or Drop Your Image Here</p>
                </div>
              )}
              <input
                ref={fileInputRef}
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
              value={giftDetail.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              onFocus={() => handleInputFieldError("title", "")}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                inputFieldError.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter gift title"
            />
            {inputFieldError.title && (
              <p className="text-red-500 text-sm mt-1">{inputFieldError.title}</p>
            )}
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={giftDetail.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              onFocus={() => handleInputFieldError("amount", "")}
              min="0"
              step="0.01"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                inputFieldError.amount ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter gift amount"
            />
            {inputFieldError.amount && (
              <p className="text-red-500 text-sm mt-1">{inputFieldError.amount}</p>
            )}
          </div>

          {/* Short Bio Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Short Bio <span className="text-red-500">*</span>
            </label>
            <textarea
              value={giftDetail.shortBio}
              onChange={(e) => handleInputChange('shortBio', e.target.value)}
              onFocus={() => handleInputFieldError("shortBio", "")}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                inputFieldError.shortBio ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter gift description"
            />
            {inputFieldError.shortBio && (
              <p className="text-red-500 text-sm mt-1">{inputFieldError.shortBio}</p>
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

const AddGift = () => {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><div className="text-xl text-gray-600">Loading...</div></div>}>
      <AddGiftContent />
    </Suspense>
  );
};

export default AddGift;