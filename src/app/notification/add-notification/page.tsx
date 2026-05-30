'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import { UploadImageSvg } from '@/components/svgs/page';

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------
interface User {
  _id: string;
  customerName?: string;
  astrologerName?: string;
}

interface NotificationDetail {
  title: string;
  description: string;
}

interface ApiResponse<T> {
  astrologers: never[];
  success: boolean;
  data: T;
  message?: string;
}

interface SelectOption {
  value: string;
  label: string | null;
}

// ---------------------------------------------------------------------
// Main Content Component
// ---------------------------------------------------------------------
function AddNotificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') as 'Customer' | 'Astrologer';

  const [notificationDetail, setNotificationDetail] = useState<NotificationDetail>({ title: '', description: '' });
  const [userData, setUserData] = useState<User[]>([]);
  const [multiPage, setMultiPage] = useState<string[]>([]);
  const [inputFieldError, setInputFieldError] = useState({
    title: '',
    multiPage: '',
    image: '',
    description: ''
  });
  const [image, setImage] = useState<{ file: string; bytes: File | null }>({ file: '', bytes: null });
  const [loading, setLoading] = useState(false);

  // Multi-page options
  const multiPageOptions: SelectOption[] = userData
    ? [
      { value: 'all', label: 'Select All' },
      ...userData.map(item => ({
        value: item._id,
        label: (type === 'Customer' ? item.customerName : item.astrologerName) || null
      }))
    ]
    : [];

  // Fetch Users
  const getUsers = async () => {
    if (!type) return;

    try {
      setLoading(true);
      const endpoint = type === 'Customer'
        ? '/api/admin/get-customers'
        : '/api/admin/get-all-astrologers';

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        credentials: 'include'
      });
      const data: ApiResponse<User[]> = await response.json();

      if (data.success) {
        setUserData(data.astrologers || []);
      } else {
        console.error(`Failed to fetch ${type.toLowerCase()}s:`, data.message);
      }
    } catch (error) {
      console.error(`Error fetching ${type.toLowerCase()}s:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (type) {
      getUsers();
    }
  }, [type]);

  // Input Handlers
  const handleInputFieldError = (input: string, value: string) => {
    setInputFieldError(prev => ({ ...prev, [input]: value }));
  };

  const handleInputField = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNotificationDetail(prev => ({ ...prev, [name]: value }));
    if (inputFieldError[name as keyof typeof inputFieldError]) {
      handleInputFieldError(name, '');
    }
  };

  // Multi Select with "Select All"
  const handleChangeMultiPageOption = (selectedItems: string[]) => {
    if (selectedItems.includes('all')) {
      setMultiPage(userData.map(item => item._id));
    } else {
      setMultiPage(selectedItems.filter(id => id !== 'all'));
    }
  };

  // Image Upload (Click & Drag)
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage({
        file: URL.createObjectURL(file),
        bytes: file
      });
      handleInputFieldError('image', '');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImage({
        file: URL.createObjectURL(file),
        bytes: file
      });
      handleInputFieldError('image', '');
    }
  };

  // Validation
  const handleValidation = () => {
    let isValid = true;
    const { title } = notificationDetail;

    if (!title) {
      handleInputFieldError('title', 'Please Enter Title');
      isValid = false;
    } else if (title.length > 50) {
      handleInputFieldError('title', 'Please Enter Title Less Than 50 Character');
      isValid = false;
    } else {
      handleInputFieldError('title', '');
    }

    if (multiPage.length === 0) {
      handleInputFieldError('multiPage', 'Please Select At Least One User');
      isValid = false;
    } else {
      handleInputFieldError('multiPage', '');
    }

    if (!image.bytes) {
      handleInputFieldError('image', 'Please Upload an Image');
      isValid = false;
    } else {
      handleInputFieldError('image', '');
    }

    return isValid;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleValidation()) return;

    setLoading(true);
    const { title, description } = notificationDetail;

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      if (image.bytes) formData.append('image', image.bytes);
      formData.append('redirectTo', 'Redirect');

      multiPage.forEach((id, index) => {
        if (type === 'Customer') {
          formData.append(`customerIds[${index}]`, id);
        } else {
          formData.append(`astrologerIds[${index}]`, id);
        }
      });

      const endpoint = type === 'Customer'
        ? '/api/admin/send-customer-notification'
        : '/api/admin/send-astrologer-notification';

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire('Success!', `Notification sent successfully to ${type.toLowerCase()}s.`, 'success');
        router.push(`/${type.toLowerCase()}-notification`);
      } else {
        Swal.fire('Error!', data.message || `Failed to send ${type.toLowerCase()} notification.`, 'error');
      }
    } catch (error) {
      Swal.fire('Error!', `Something went wrong while sending ${type.toLowerCase()} notification.`, 'error');
      console.error('Error sending notification:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!type) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-red-600 font-medium">Error: Notification type is required</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Send {type} Notification
          </h1>
          <button
            onClick={() => router.push(`/${type.toLowerCase()}-notification`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Display
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div>
            <div
              className="border border-gray-300 rounded-md overflow-hidden"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {image.file ? (
                <label htmlFor="upload-image" className="block cursor-pointer">
                  <img
                    src={image.file}
                    alt="Uploaded"
                    className="w-full h-80 object-contain"
                  />
                </label>
              ) : (
                <label
                  htmlFor="upload-image"
                  className="flex flex-col items-center justify-center py-20 cursor-pointer space-y-4"
                >
                  <UploadImageSvg h="80" w="80" color="#C4C4C4" />
                  <div className="font-semibold text-lg text-gray-900">Choose Image to Upload</div>
                  <div className="font-medium text-gray-500">Or Drop an Image Here</div>
                </label>
              )}
              <input
                id="upload-image"
                type="file"
                accept="image/*"
                onChange={handleImage}
                className="hidden"
              />
            </div>
            {inputFieldError.image && (
              <p className="text-red-600 text-xs mt-2 pl-1">{inputFieldError.image}</p>
            )}
          </div>

          {/* Title & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={notificationDetail.title}
                onChange={handleInputField}
                onFocus={() => handleInputFieldError('title', '')}
                maxLength={50}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${inputFieldError.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Enter title"
              />
              <div className="flex justify-between text-xs mt-1">
                {inputFieldError.title ? (
                  <span className="text-red-600">{inputFieldError.title}</span>
                ) : (
                  <span></span>
                )}
                <span className="text-gray-500">{notificationDetail.title.length}/50</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={notificationDetail.description}
                onChange={handleInputField}
                onFocus={() => handleInputFieldError('description', '')}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none ${inputFieldError.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Enter description"
              />
              {inputFieldError.description && (
                <p className="text-red-600 text-xs mt-1">{inputFieldError.description}</p>
              )}
            </div>
          </div>

          {/* Multi Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select {type}s <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-300 rounded-md p-2 min-h-[45px] max-h-[150px] overflow-auto">
              {/* Selected Tags */}
              <div className="flex flex-wrap gap-2 mb-2">
                {multiPageOptions
                  .filter(opt => multiPage.includes(opt.value))
                  .map(opt => (
                    <span
                      key={opt.value}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium"
                    >
                      {opt.label}
                    </span>
                  ))}
              </div>

              {/* Native Select */}
              <select
                multiple
                value={multiPage}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                  handleChangeMultiPageOption(selected);
                }}
                onFocus={() => handleInputFieldError('multiPage', '')}
                className="w-full border-none outline-none text-sm bg-transparent"
                size={5}
              >
                {multiPageOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {inputFieldError.multiPage && (
              <p className="text-red-600 text-xs mt-1 pl-1">{inputFieldError.multiPage}</p>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-start">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Suspense Wrapper
// ---------------------------------------------------------------------
const AddNotification = () => {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium">Loading...</span>
          </div>
        </div>
      }
    >
      <AddNotificationContent />
    </Suspense>
  );
};

export default AddNotification;