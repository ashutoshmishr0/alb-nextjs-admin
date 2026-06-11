'use client';
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";

interface ReviewDetail {
  customer: string;
  astrologer: string;
  rating: string;
  comment: string;
  reviewId?: string;
}

interface InputFieldError {
  customer: string;
  astrologer: string;
  rating: string;
  comment: string;
}

interface Astrologer {
  _id: string;
  astrologerName: string;
}

interface Customer {
  _id: string;
  customerName: string;
}

function AddReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const editMode = searchParams.get('edit') === 'true';
  const reviewId = searchParams.get('id');

  const [reviewDetail, setReviewDetail] = useState<ReviewDetail>({
    customer: '',
    astrologer: '',
    rating: '',
    comment: ''
  });
  const [inputFieldError, setInputFieldError] = useState<InputFieldError>({
    customer: '',
    astrologer: '',
    rating: '',
    comment: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(editMode);
  const [astrologerListData, setAstrologerListData] = useState<Astrologer[]>([]);
  const [customerListData, setCustomerListData] = useState<Customer[]>([]);

  // Fetch review data if in edit mode
  useEffect(() => {
    const fetchReviewData = async () => {
      if (editMode && reviewId) {
        try {
          setFetching(true);
          const response = await fetch(`/api/admin/reviews?reviewId=${reviewId}`);
          const data = await response.json();

          if (data.success && data.data) {
            setReviewDetail({
              customer: data.data.customerId?._id || data.data.customerId || '',
              astrologer: data.data.astrologerId?._id || data.data.astrologerId || '',
              rating: data.data.ratings?.toString() || '',
              comment: data.data.comments || '',
              reviewId: data.data._id
            });
          }
        } catch (error) {
          console.error('Error fetching review:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to fetch review data',
          });
        } finally {
          setFetching(false);
        }
      }
    };

    fetchReviewData();
  }, [editMode, reviewId]);

  // Fetch astrologers and customers
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch astrologers
        const astroResponse = await fetch(`/api/admin/get-all-astrologers`,{credentials: 'include'});
        const astroData = await astroResponse.json();
        if (astroData.success) {
          setAstrologerListData(astroData.astrologers || []);
        }

        // Fetch customers
        const customerResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers/get-all-customers`, {
          credentials: 'include'
        });
        const customerData = await customerResponse.json();
        if (customerData.success) {
          setCustomerListData(customerData.customers || []);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to fetch initial data',
        });
      }
    };

    fetchInitialData();
  }, []);

  //* Handle Input Field : Error
  const handleInputFieldError = (input: keyof InputFieldError, value: string) =>
    setInputFieldError((prev) => ({ ...prev, [input]: value }));

  //* Handle Input Field : Data
  const handleInputField = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'rating') {
      if (value && (parseInt(value) < 1 || parseInt(value) > 5)) {
        setInputFieldError({ ...inputFieldError, rating: 'Rating must be 1 to 5' });
      } else {
        setInputFieldError({ ...inputFieldError, rating: '' });
      }
    }

    setReviewDetail({ ...reviewDetail, [name]: value });
  };

  //! Handle validation
  const handleValidation = () => {
    let isValid = true;
    const { astrologer, customer, rating, comment } = reviewDetail;

    if (!astrologer) {
      handleInputFieldError("astrologer", "Please Select Astrologer Name");
      isValid = false;
    }
    if (!customer) {
      handleInputFieldError("customer", "Please Select Customer Name");
      isValid = false;
    }
    if (!rating) {
      handleInputFieldError("rating", "Please Enter Rating");
      isValid = false;
    }
    if (rating && (parseInt(rating) < 1 || parseInt(rating) > 5)) {
      handleInputFieldError("rating", "Rating must be 1 to 5");
      isValid = false;
    }

    return isValid;
  };

  // ✅ FIXED: Create Review API call
  const createReview = async (reviewData: {
    astrologerId: string;
    customerId: string;
    ratings: string;
    comments: string;
  }) => {
    try {
      console.log("📤 Creating review with payload:", reviewData);

      const response = await fetch(`/api/admin/add-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // ✅ Use JSON, not FormData
        },
        body: JSON.stringify({
          astrologerId: reviewData.astrologerId,
          customerId: reviewData.customerId,
          ratings: reviewData.ratings, // ✅ Send as string to match expected payload
          comments: reviewData.comments
        }),
      });

      console.log("📥 Response status:", response.status);

      const result = await response.json();
      console.log("📦 API Response:", result);

      return result;
    } catch (error) {
      console.error('❌ Error creating review:', error);
      throw error;
    }
  };

  // ✅ FIXED: Update Review API call
  const updateReview = async (reviewData: {
    ratings: string;
    comments: string;
    reviewId: string;
  }) => {
    try {
      console.log("📤 Updating review with payload:", reviewData);

      const response = await fetch(`/api/admin/update-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ratings: reviewData.ratings, // ✅ Keep as string to match expected format
          comments: reviewData.comments,
          reviewId: reviewData.reviewId
        }),
      });

      console.log("📥 Response status:", response.status);

      const result = await response.json();
      console.log("📦 API Response:", result);

      return result;
    } catch (error) {
      console.error('❌ Error updating review:', error);
      throw error;
    }
  };

  //! Handle Submit - Creating/Updating Review
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔄 Submit triggered, editMode:", editMode);

    if (handleValidation()) {
      setLoading(true);
      const { astrologer, customer, rating, comment, reviewId } = reviewDetail;

      try {
        if (editMode && reviewId) {
          // Update existing review
          const result = await updateReview({
            ratings: rating,
            comments: comment,
            reviewId: reviewId
          });

          if (result.success) {
            await Swal.fire({
              icon: 'success',
              title: 'Success!',
              text: 'Review updated successfully!',
              showConfirmButton: false,
              timer: 1500
            });
            router.push("/review");
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: result.message || 'Failed to update review',
            });
          }
        } else {
          // ✅ FIXED: Create new review with correct payload format
          const result = await createReview({
            astrologerId: astrologer,
            customerId: customer,
            ratings: rating,
            comments: comment
          });

          if (result.success) {
            await Swal.fire({
              icon: 'success',
              title: 'Success!',
              text: 'Review created successfully!',
              showConfirmButton: false,
              timer: 1500
            });
            router.push("/review");
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: result.message || 'Failed to create review',
            });
          }
        }
      } catch (error) {
        console.error('❌ Error submitting review:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'An error occurred while submitting the review',
        });
      } finally {
        setLoading(false);
      }
    } else {
      console.log("❌ Validation failed");
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">Loading review data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-xl font-semibold text-gray-800">
            {editMode ? 'Edit' : 'Add'} Review
          </div>
          <button
            onClick={() => router.push("/review")}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg cursor-pointer text-sm font-medium transition duration-200"
          >
            Display
          </button>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Astrologer Select */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Astrologer <span className="text-red-500">*</span>
            </label>
            <select
              name="astrologer"
              value={reviewDetail.astrologer}
              onChange={handleInputField}
              onFocus={() => handleInputFieldError("astrologer", "")}
              disabled={editMode}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputFieldError.astrologer ? 'border-red-500' : 'border-gray-300'
                } ${editMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">-Select Astrologer-</option>
              {astrologerListData.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.astrologerName}
                </option>
              ))}
            </select>
            {inputFieldError.astrologer && (
              <p className="text-red-500 text-sm mt-1">{inputFieldError.astrologer}</p>
            )}
          </div>

          {/* Customer Select */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Customer <span className="text-red-500">*</span>
            </label>
            <select
              name="customer"
              value={reviewDetail.customer}
              onChange={handleInputField}
              onFocus={() => handleInputFieldError("customer", "")}
              disabled={editMode}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputFieldError.customer ? 'border-red-500' : 'border-gray-300'
                } ${editMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">-Select Customer-</option>
              {customerListData.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.customerName}
                </option>
              ))}
            </select>
            {inputFieldError.customer && (
              <p className="text-red-500 text-sm mt-1">{inputFieldError.customer}</p>
            )}
          </div>

          {/* Rating Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Rating <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="rating"
              min="1"
              max="5"
              value={reviewDetail.rating}
              onChange={handleInputField}
              onFocus={() => handleInputFieldError("rating", "")}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputFieldError.rating ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Enter rating (1-5)"
            />
            {inputFieldError.rating && (
              <p className="text-red-500 text-sm mt-1">{inputFieldError.rating}</p>
            )}
          </div>

          {/* Comment Textarea - Full width */}
          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700">
              Comment
            </label>
            <textarea
              name="comment"
              rows={4}
              value={reviewDetail.comment}
              onChange={handleInputField}
              onFocus={() => handleInputFieldError("comment", "")}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputFieldError.comment ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Enter your comment"
            />
            {inputFieldError.comment && (
              <p className="text-red-500 text-sm mt-1">{inputFieldError.comment}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2 lg:col-span-3">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg cursor-pointer font-medium transition duration-200 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {editMode ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                editMode ? 'Update' : 'Submit'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const AddReview = () => {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><div className="text-xl text-gray-600">Loading...</div></div>}>
      <AddReviewContent />
    </Suspense>
  );
};

export default AddReview;