'use client';
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";

interface Category {
  _id: string;
  categoryName: string;
}
interface Topic {
  _id: string;
  categoryId: string | Category | null;
  topicName: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  topics?: T[];
  data?: T[];
}

interface InputFieldDetail {
  categoryId: string;
  title: string;
}

interface InputFieldError {
  categoryId: string;
  title: string;
}

function AddTopicContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const editMode = searchParams.get('edit') === 'true';
  const topicId = searchParams.get('id');

  const [liveSessionCategoryData, setLiveSessionCategoryData] = useState<Category[]>([]);
  const [liveSessionTopicData, setLiveSessionTopicData] = useState<Topic[]>([]);
  const [inputFieldDetail, setInputFieldDetail] = useState<InputFieldDetail>({
    categoryId: '',
    title: ''
  });
  const [inputFieldError, setInputFieldError] = useState<InputFieldError>({
    categoryId: '',
    title: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Regex pattern for validation
  const Regex_Accept_Everything = /^[\s\S]*$/;

  // API call functions
  const getLiveSessionCategory = async () => {
    try {
      const response = await fetch(`/api/admin/get_live_session_category`);
      const data = await response.json();
      if (data.success) {
        setLiveSessionCategoryData(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Get all topics and filter by ID for edit mode
  const getLiveSessionTopic = async () => {
    try {
      setFetching(true);
      const response = await fetch(`/api/admin/get_live_session_topic`);
      const data: ApiResponse<Topic> = await response.json();

      console.log('All Topics API Response:', data); // Debug log

      if (data.success) {
        const topics = data.topics || data.data || [];
        setLiveSessionTopicData(topics);

        // If in edit mode, find the specific topic by ID
        if (editMode && topicId) {
          const specificTopic = topics.find((topic: Topic) => topic._id === topicId);

          if (specificTopic) {
            console.log('Found topic for editing:', specificTopic); // Debug log
            const categoryIdValue =
              typeof specificTopic.categoryId === 'string'
                ? specificTopic.categoryId
                : specificTopic.categoryId?._id || '';
            setInputFieldDetail({
              categoryId: categoryIdValue,
              title: specificTopic.topicName || ''
            });
          } else {
            throw new Error('Topic not found');
          }
        }
      } else {
        throw new Error(data.message || 'Failed to fetch topics');
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
      if (editMode) {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to load topic data. Please try again.',
          confirmButtonColor: '#d33',
        }).then(() => {
          router.push("/live-session/topic");
        });
      }
    } finally {
      setFetching(false);
    }
  };

  const createLiveSessionTopic = async (topicData: { categoryId: string; topicName: string }) => {
    try {
      const response = await fetch(`/api/admin/create_live_session_topic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topicData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating topic:', error);
      throw error;
    }
  };

  const updateLiveSessionTopic = async (topicData: { topicId: string; categoryId: string; topicName: string }) => {
    try {
      const response = await fetch(`/api/admin/update_live_session_topic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topicData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating topic:', error);
      throw error;
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      await getLiveSessionCategory();

      if (editMode && topicId) {
        await getLiveSessionTopic();
      }
    };

    fetchData();
  }, [editMode, topicId]);

  //* Handle Input Field : Error
  const handleInputFieldError = (input: keyof InputFieldError, value: string) =>
    setInputFieldError((prev) => ({ ...prev, [input]: value }));

  //* Handle Input Field : Data
  const handleInputChange = (field: keyof InputFieldDetail, value: string) => {
    setInputFieldDetail(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (inputFieldError[field as keyof InputFieldError]) {
      handleInputFieldError(field as keyof InputFieldError, '');
    }
  };

  //! Handle validation
  const handleValidation = () => {
    let isValid = true;
    const { title, categoryId } = inputFieldDetail;

    if (!title.trim()) {
      handleInputFieldError("title", "Please Enter Title");
      isValid = false;
    }
    if (!Regex_Accept_Everything.test(title)) {
      handleInputFieldError("title", "Please Enter Valid Title");
      isValid = false;
    }
    if (title.length > 70) {
      handleInputFieldError("title", "Please Enter Title Less Than 70 Letter");
      isValid = false;
    }
    if (!categoryId) {
      handleInputFieldError("categoryId", "Please Select Category");
      isValid = false;
    }

    return isValid;
  };

  //! Handle Submit - Creating/Updating Topic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (handleValidation()) {
      setLoading(true);
      const { title, categoryId } = inputFieldDetail;

      try {
        let result;
        const isEdit = editMode && topicId;

        if (isEdit) {
          result = await updateLiveSessionTopic({
            topicId: topicId!,
            categoryId,
            topicName: title
          });
        } else {
          result = await createLiveSessionTopic({
            categoryId,
            topicName: title
          });
        }

        if (result.success) {
          Swal.fire({
            icon: 'success',
            title: isEdit ? 'Updated!' : 'Created!',
            text: `Topic ${isEdit ? 'updated' : 'created'} successfully`,
            timer: 1500,
            showConfirmButton: false
          });
          setTimeout(() => {
            router.push("/live-session/topic");
          }, 1600);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: result.message || `Failed to ${isEdit ? 'update' : 'create'} topic`,
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
        console.error('Error submitting topic:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">Loading topic data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-xl font-semibold text-gray-800">
            {editMode ? 'Edit' : 'Add'} Session Topic
            {editMode && topicId && <span className="text-sm text-gray-500 ml-2">(ID: {topicId})</span>}
          </div>
          <button
            onClick={() => router.push("/live-session/topic")}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg cursor-pointer text-sm font-medium transition duration-200"
          >
            Display
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Category Select */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Category Name <span className="text-red-500">*</span>
            </label>
            <select
              value={inputFieldDetail.categoryId}
              onChange={(e) => handleInputChange('categoryId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputFieldError.categoryId ? 'border-red-500' : 'border-gray-300'
                }`}
            >
              <option value="">---Select Category Name---</option>
              {liveSessionCategoryData.map((value, index) => (
                <option key={index} value={value._id}>
                  {value.categoryName}
                </option>
              ))}
            </select>
            {inputFieldError.categoryId && (
              <p className="text-red-500 text-sm mt-1">{inputFieldError.categoryId}</p>
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
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputFieldError.title ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Enter topic title"
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
};

const AddTopic = () => {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><div className="text-xl text-gray-600">Loading...</div></div>}>
      <AddTopicContent />
    </Suspense>
  );
};

export default AddTopic;